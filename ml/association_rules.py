import os
import sys
import json
import time
from pathlib import Path
import pandas as pd
from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import fpgrowth, association_rules

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from backend.app.config import settings
from backend.app.database import execute_query

def extract_menu_baskets():
    """
    Extracts restaurant dish itemsets from the Data Warehouse:
    Groups co-occurring food items offered across restaurant menus.
    """
    print("  - Fetching co-occurring food items from fact_restaurant_menu and dim_food...")
    query = """
    SELECT 
        m.restaurant_sk,
        f.item_name
    FROM fact_restaurant_menu m
    JOIN dim_food f ON m.food_sk = f.food_sk
    WHERE m.food_sk > 0
    ORDER BY m.restaurant_sk;
    """
    records = execute_query(query, fetch="all")
    df = pd.DataFrame(records)

    # Group by restaurant to form transactions
    baskets = df.groupby("restaurant_sk")["item_name"].apply(list).tolist()
    print(f"    Constructed {len(baskets):,} restaurant menu baskets.")
    return baskets

def extract_user_cuisine_baskets():
    """
    Extracts user multi-order cuisine combinations from fact_orders.
    """
    print("  - Fetching user multi-order cuisine baskets from fact_orders...")
    query = """
    SELECT 
        f.user_sk,
        r.primary_cuisine
    FROM fact_orders f
    JOIN dim_restaurant r ON f.restaurant_sk = r.restaurant_sk
    WHERE f.is_valid_order = TRUE AND r.primary_cuisine != 'General'
    GROUP BY f.user_sk, r.primary_cuisine
    HAVING COUNT(f.order_sk) >= 1;
    """
    records = execute_query(query, fetch="all")
    df = pd.DataFrame(records)
    baskets = df.groupby("user_sk")["primary_cuisine"].apply(list).tolist()
    # Keep baskets with at least 2 distinct cuisines
    baskets = [b for b in baskets if len(b) >= 2]
    print(f"    Constructed {len(baskets):,} multi-cuisine customer baskets.")
    return baskets

def mine_association_rules(baskets, basket_type_name="Food Items", min_support=0.015, min_lift=1.1):
    """Mines frequent itemsets and association rules using the FP-Growth algorithm."""
    print(f"\n  - Mining FP-Growth rules for [{basket_type_name}] (min_support={min_support}, min_lift={min_lift})...")

    te = TransactionEncoder()
    te_ary = te.fit(baskets).transform(baskets)
    df_encoded = pd.DataFrame(te_ary, columns=te.columns_)

    # 1. FP-Growth Frequent Itemsets
    frequent_itemsets = fpgrowth(df_encoded, min_support=min_support, use_colnames=True)
    print(f"    Discovered {len(frequent_itemsets):,} frequent itemsets.")

    if len(frequent_itemsets) == 0:
        return []

    # 2. Derive Association Rules
    rules = association_rules(frequent_itemsets, metric="lift", min_threshold=min_lift)
    print(f"    Generated {len(rules):,} association rules.")

    formatted_rules = []
    for _, r in rules.iterrows():
        ant = list(r["antecedents"])
        con = list(r["consequents"])
        formatted_rules.append({
            "antecedents": ant,
            "consequents": con,
            "antecedent_str": ", ".join(ant),
            "consequent_str": ", ".join(con),
            "rule_str": f"{', '.join(ant)} -> {', '.join(con)}",
            "support": round(float(r["support"]), 4),
            "confidence": round(float(r["confidence"]), 4),
            "lift": round(float(r["lift"]), 4),
            "leverage": round(float(r["leverage"]), 4) if "leverage" in r else 0.0,
            "type": basket_type_name
        })

    formatted_rules = sorted(formatted_rules, key=lambda x: (x["lift"], x["confidence"]), reverse=True)
    return formatted_rules

def train_association_rules():
    """Runs the complete FP-Growth association rule mining pipeline and persists results."""
    print("\n" + "=" * 60)
    print("ASSOCIATION RULE MINING PIPELINE (FP-GROWTH)")
    print("=" * 60)

    artifacts_dir = settings.ML_ARTIFACTS_DIR
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    # 1. Food Menu Items Mining
    menu_baskets = extract_menu_baskets()
    food_rules = mine_association_rules(menu_baskets, "Menu Dishes", min_support=0.015, min_lift=1.2)

    # 2. User Cuisine Affinity Mining
    cuisine_baskets = extract_user_cuisine_baskets()
    cuisine_rules = mine_association_rules(cuisine_baskets, "Customer Cuisines", min_support=0.03, min_lift=1.1)

    all_rules = food_rules + cuisine_rules

    print("\n  - Top 5 Highest-Lift Association Rules:")
    for idx, rule in enumerate(all_rules[:5], 1):
        print(f"    {idx}. [{rule['type']}] {rule['rule_str']}")
        print(f"       Support: {rule['support']*100:.2f}% | Confidence: {rule['confidence']*100:.2f}% | Lift: {rule['lift']:.2f}x")

    # Persist JSON Artifact
    output_path = artifacts_dir / "association_rules.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_rules, f, indent=2)
    print(f"\n  - Saved {len(all_rules)} association rules to {output_path}")

    print("[SUCCESS] Association rule mining completed.")
    return all_rules

if __name__ == "__main__":
    train_association_rules()
