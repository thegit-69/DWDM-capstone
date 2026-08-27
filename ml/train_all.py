import sys
import time

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from ml.clustering import train_customer_segmentation
from ml.churn import train_churn_model
from ml.association_rules import train_association_rules
from ml.recommendation import recommend_restaurants_for_customer

def run_all_ml_pipelines():
    """Master runner executing all Data Mining and Machine Learning workflows."""
    print("=" * 75)
    print("DATA MINING & MACHINE LEARNING PIPELINE EXECUTION")
    print("Project: Zomato DWDM Capstone")
    print("=" * 75)
    start_total = time.time()

    # 1. Customer Segmentation (K-Means)
    t0 = time.time()
    _, cluster_info = train_customer_segmentation()
    print(f"[STAGE 1 DONE] Customer Segmentation completed in {time.time() - t0:.2f}s.")

    # 2. Churn Prediction (Random Forest)
    t0 = time.time()
    _, churn_meta = train_churn_model()
    print(f"[STAGE 2 DONE] Churn Prediction completed in {time.time() - t0:.2f}s.")

    # 3. Association Rule Mining (FP-Growth)
    t0 = time.time()
    rules = train_association_rules()
    print(f"[STAGE 3 DONE] Association Rule Mining completed in {time.time() - t0:.2f}s.")

    # 4. Recommendation Engine Verification
    t0 = time.time()
    print("\n" + "=" * 60)
    print("RECOMMENDATION ENGINE VERIFICATION")
    print("=" * 60)
    sample_users = [1, 10, 42]
    for uid in sample_users:
        rec = recommend_restaurants_for_customer(user_id=uid, top_n=2)
        c = rec["customer"]
        print(f"\n  * Target Customer {c['user_id']} ({c['name']}):")
        print(f"    - Segment: {c['segment']} | Churn Risk: {c['churn_probability']*100:.1f}% | AOV: Rs. {c['avg_order_value']:,.2f}")
        for r in rec["recommendations"]:
            print(f"      -> {r['name']} ({r['primary_cuisine']}) | Match: {r['match_score_pct']}%")
            print(f"         Explanation: {r['explanation']}")

    total_time = time.time() - start_total
    print("\n" + "=" * 75)
    print(f"[SUCCESS] ALL ML & MINING PIPELINES EXECUTED IN {total_time:.2f} SECONDS!")
    print("=" * 75)

if __name__ == "__main__":
    run_all_ml_pipelines()
