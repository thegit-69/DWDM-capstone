import os
import sys
import json
import time
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
from sklearn.decomposition import PCA
import psycopg2
from psycopg2.extras import execute_batch

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from backend.app.config import settings
from backend.app.database import execute_query

def extract_customer_features_df():
    """Extracts customer-level feature dataset directly from the Star Schema."""
    print("  - Fetching customer profiles and RFM data from vw_customer_rfm...")
    query = """
    SELECT 
        user_sk,
        user_id,
        name,
        age,
        family_size,
        frequency,
        monetary,
        aov,
        recency_days,
        gender,
        marital_status,
        occupation,
        monthly_income,
        age_group,
        income_tier
    FROM vw_customer_rfm;
    """
    records = execute_query(query, fetch="all")
    df = pd.DataFrame(records)
    print(f"    Loaded {len(df):,} customer feature records.")
    return df

def evaluate_k_elbow_silhouette(X_scaled, max_k=7, sample_size=10000):
    """Evaluates K-Means inertia (Elbow) and Silhouette scores for k in [2, max_k]."""
    print("  - Evaluating optimal K using Elbow method and Silhouette scores...")
    elbow_data = []

    # Subsample for fast, robust silhouette calculation
    np.random.seed(42)
    sample_indices = np.random.choice(len(X_scaled), size=min(sample_size, len(X_scaled)), replace=False)
    X_sub = X_scaled[sample_indices]

    for k in range(2, max_k + 1):
        km = KMeans(n_clusters=k, random_state=settings.KMEANS_RANDOM_STATE, n_init=10)
        km.fit(X_scaled)
        inertia = float(km.inertia_)

        labels_sub = km.predict(X_sub)
        sil = float(silhouette_score(X_sub, labels_sub))

        elbow_data.append({
            "k": k,
            "inertia": round(inertia, 2),
            "silhouette_score": round(sil, 4)
        })
        print(f"    k={k} -> Inertia: {inertia:14,.2f} | Silhouette Score: {sil:.4f}")

    return elbow_data

def assign_cluster_labels(centroids, feature_names):
    """Assigns descriptive business labels to clusters based on centroid values."""
    centroid_df = pd.DataFrame(centroids, columns=feature_names)
    labels = {}

    for idx, row in centroid_df.iterrows():
        freq = row["frequency"]
        mon = row["monetary"]
        rec = row["recency_days"]

        if freq > 1.0 and mon > 1.0:
            label = "High-Value Champions"
        elif freq > 0.0 and mon > 0.0:
            label = "Regular Diners"
        elif rec > 0.5 or freq < -0.5:
            label = "Dormant / Lapsed Customers"
        else:
            label = "Occasional Value Diners"
        labels[idx] = label

    # Ensure distinct labels if any collisions
    used = set()
    final_labels = {}
    for idx, row in centroid_df.iterrows():
        base = labels[idx]
        if base in used:
            base = f"{base} (Tier {idx+1})"
        used.add(base)
        final_labels[idx] = base

    return final_labels

def train_customer_segmentation():
    """Trains K-Means clustering model, generates PCA projections, and persists artifacts."""
    print("\n" + "=" * 60)
    print("CUSTOMER SEGMENTATION PIPELINE (K-MEANS)")
    print("=" * 60)

    artifacts_dir = settings.ML_ARTIFACTS_DIR
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    df_customers = extract_customer_features_df()

    # Numerical features for clustering
    num_features = ["frequency", "monetary", "aov", "recency_days", "age", "family_size"]
    X = df_customers[num_features].copy()

    # Standardize numerical features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 1. Elbow & Silhouette Evaluation
    evaluation = evaluate_k_elbow_silhouette(X_scaled, max_k=6)

    # 2. Fit optimal K-Means model (k=4)
    k = settings.KMEANS_N_CLUSTERS
    print(f"\n  - Fitting final KMeans model with k={k}...")
    kmeans = KMeans(n_clusters=k, random_state=settings.KMEANS_RANDOM_STATE, n_init=10)
    cluster_ids = kmeans.fit_predict(X_scaled)
    df_customers["cluster_id"] = cluster_ids

    # 3. Label Clusters
    cluster_labels = assign_cluster_labels(kmeans.cluster_centers_, num_features)
    df_customers["customer_segment"] = df_customers["cluster_id"].map(cluster_labels)

    print("\n  - Cluster Summary & Interpretation:")
    for cid, name in cluster_labels.items():
        sub = df_customers[df_customers["cluster_id"] == cid]
        print(f"    Cluster {cid} ('{name}'): {len(sub):,} customers ({len(sub)/len(df_customers)*100:.1f}%)")
        print(f"      - Avg Frequency : {sub['frequency'].mean():.2f} orders")
        print(f"      - Avg Spend     : Rs. {sub['monetary'].mean():,.2f}")
        print(f"      - Avg AOV       : Rs. {sub['aov'].mean():,.2f}")
        print(f"      - Avg Recency   : {sub['recency_days'].mean():.1f} days")

    # 4. Compute 2D PCA Projections for Frontend Visualizations
    print("\n  - Computing 2D PCA projection for interactive scatter plots...")
    pca = PCA(n_components=2, random_state=42)
    X_pca = pca.fit_transform(X_scaled)
    df_customers["pca_x"] = np.round(X_pca[:, 0], 4)
    df_customers["pca_y"] = np.round(X_pca[:, 1], 4)

    # 5. Save Artifacts
    print(f"  - Saving clustering artifacts to {artifacts_dir}...")
    joblib.dump(kmeans, artifacts_dir / "kmeans_model.pkl")
    joblib.dump(scaler, artifacts_dir / "scaler.pkl")
    joblib.dump(pca, artifacts_dir / "pca.pkl")

    cluster_info = {
        "n_clusters": k,
        "features": num_features,
        "cluster_labels": cluster_labels,
        "evaluation": evaluation,
        "cluster_stats": {
            cluster_labels[cid]: {
                "count": int(len(sub)),
                "pct": round(len(sub) / len(df_customers) * 100, 2),
                "avg_frequency": round(float(sub["frequency"].mean()), 2),
                "avg_monetary": round(float(sub["monetary"].mean()), 2),
                "avg_aov": round(float(sub["aov"].mean()), 2),
                "avg_recency": round(float(sub["recency_days"].mean()), 1),
                "avg_age": round(float(sub["age"].mean()), 1)
            }
            for cid, sub in df_customers.groupby("cluster_id")
        }
    }
    with open(artifacts_dir / "clustering_metadata.json", "w", encoding="utf-8") as f:
        json.dump(cluster_info, f, indent=2)

    # 6. Update dim_user table in PostgreSQL
    print("  - Persisting cluster assignments to PostgreSQL dim_user...")
    conn = psycopg2.connect(**settings.PSYCOPG2_CONN_DICT)
    cur = conn.cursor()

    update_records = [
        (row["customer_segment"], row["user_sk"])
        for _, row in df_customers.iterrows()
    ]
    query = "UPDATE dim_user SET customer_segment = %s WHERE user_sk = %s;"
    execute_batch(cur, query, update_records, page_size=5000)
    conn.commit()
    cur.close()
    conn.close()

    print("[SUCCESS] Customer segmentation pipeline completed and updated in PostgreSQL.")
    return df_customers, cluster_info

if __name__ == "__main__":
    train_customer_segmentation()
