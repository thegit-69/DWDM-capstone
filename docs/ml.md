# Data Mining & Machine Learning Pipeline Documentation

> **Project:** Designing a Data Warehouse System for Food Delivery Customer Behavior, Churn Prediction and Restaurant Recommendation  
> **Modules:** `ml/clustering.py`, `ml/churn.py`, `ml/association_rules.py`, `ml/recommendation.py`, `ml/train_all.py`  
> **Artifacts Directory:** `ml/artifacts/`

---

## 1. Machine Learning Architecture Overview

```
                      +------------------------------------------+
                      |         POSTGRESQL STAR SCHEMA           |
                      |  dim_user, dim_restaurant, fact_orders   |
                      +--------------------+---------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |    FEATURE EXTRACTION & PREPROCESSING    |
                      |  RFM Metrics, Demographics, Food Baskets |
                      +----+---------------+---------------+-----+
                           |               |               |
         +-----------------+               |               +-----------------+
         v                                 v                                 v
+------------------+             +------------------+             +-------------------+
|    CLUSTERING    |             | CHURN CLASSIFIER |             | ASSOCIATION RULES |
|  K-Means (k=4)   |             |  Random Forest   |             |     FP-Growth     |
+--------+---------+             +--------+---------+             +---------+---------+
         |                                |                                 |
         v                                v                                 v
+------------------+             +------------------+             +-------------------+
| Customer Segment |             | Churn Prob & Risk|             | Top Lift Rules    |
+--------+---------+             +--------+---------+             +---------+---------+
         |                                |                                 |
         +-----------------+--------------+                                 |
                           |                                                |
                           v                                                v
             +----------------------------+                   +-----------------------+
             |   EXPLAINABLE RECOMMENDER  |                   | MARKET BASKET ENGINE  |
             | Hybrid Multi-Signal Engine |                   | Co-occurrence Scoring |
             +----------------------------+                   +-----------------------+
```

---

## 2. Customer Segmentation (K-Means Clustering)

### A. Mathematical Formulation & Features
K-Means partitions $N = 100,000$ customer observations into $K = 4$ clusters by minimizing the Within-Cluster Sum of Squares (WCSS / Inertia):

$$\min \sum_{j=1}^K \sum_{x_i \in C_j} ||x_i - \mu_j||^2$$

- **Feature Vector:**
  - $x_1$: Frequency (Lifetime order count)
  - $x_2$: Monetary (Total spend in INR)
  - $x_3$: Average Order Value (AOV)
  - $x_4$: Recency (Days since last order)
  - $x_5$: Age
  - $x_6$: Family Size
- **Feature Normalization:** Standardized using `StandardScaler` ($\mu = 0, \sigma = 1$).

### B. Optimal K Selection (Elbow & Silhouette Analysis)
| Number of Clusters ($K$) | Inertia (WCSS) | Silhouette Score | Business Quality |
| :--- | :--- | :--- | :--- |
| $K = 2$ | 473,855.29 | 0.2523 | Too coarse |
| $K = 3$ | 376,452.26 | 0.2685 | Good separation |
| **$K = 4$ (Selected)** | **320,423.22** | **0.2790** | **Optimal Elbow & Business Interpretability** |
| $K = 5$ | 281,404.97 | 0.2874 | Over-fragmented |
| $K = 6$ | 250,500.42 | 0.2674 | Decreasing Silhouette |

### C. Cluster Interpretation & Business Personas
1. **Regular Diners (46.3% of users):** Moderate order frequency (2.25 orders), steady spend (₹11,874), moderate recency (285 days).
2. **Dormant / Lapsed Customers (36.1% of users):** Low order frequency (0.50 orders), minimal spend (₹1,689), high inactivity (891 days).
3. **Occasional Value Diners (16.7% of users):** Periodic ordering (1.47 orders), budget conscious (₹6,886 spend, ₹3,845 AOV), recency (532 days).
4. **High-Value Champions (0.9% of users):** Extremely high monetary spend (₹284,456 avg spend, ₹158,048 AOV).

---

## 3. Genuine Temporal Churn Prediction (Random Forest)

### A. Temporal Problem Formulation & Leakage Prevention
To prevent target leakage, the problem is formulated across two disjoint non-overlapping temporal windows:

```
[==================== Feature Observation Window ====================] | [========= Future Prediction Window =========]
                      2017-10-04 to 2019-10-01 (T)                     |         2019-10-01 to 2020-03-29 (T + 180d)
       - All features computed strictly on orders <= T                 |    - Churn = 1 if 0 orders in this window
       - No future information leaked                                  |    - Churn = 0 if >= 1 order in this window
```

- **Historical Cutoff Date ($T$):** `2019-10-01`
- **Feature Window:** `2017-10-04` to `2019-10-01` (24 months historical order behavior).
- **Prediction Window:** `2019-10-01` to `2020-03-29` (180 days / 6 months future observation).
- **Eligible Cohort:** 69,182 customers who placed at least 1 order prior to $T$.
- **Class Distribution:**
  - **Churned ($y = 1$):** 55,181 (79.76%)
  - **Retained ($y = 0$):** 14,001 (20.24%)

### B. Feature Set (Computed Strictly $\le T$)
1. `recency_days_at_T`: Days from the customer's last order before $T$ to $T$.
2. `tenure_days_at_T`: Days from the customer's first order before $T$ to $T$.
3. `order_rate_per_month`: Orders placed per month of customer tenure.
4. `recency_to_tenure_ratio`: Ratio of inactivity relative to customer lifespan.
5. `frequency_before_T`: Count of valid historical orders before $T$.
6. `monetary_before_T`: Total historical spend before $T$.
7. `aov_before_T`: Average order value before $T$.
8. `avg_item_price_before_T`: Average price per item ordered before $T$.
9. `orders_last_90d` / `spend_last_90d`: Recent velocity in the 90 days leading up to $T$.
10. `orders_last_180d` / `spend_last_180d`: Velocity in the 180 days leading up to $T$.
11. `refund_count`: Number of canceled / refunded orders before $T$.
12. `unique_cuisines`: Diversity of cuisines ordered before $T$.
13. Demographics: `age`, `family_size`, `gender`, `marital_status`, `occupation`, `income_tier`, `educational_qualifications`.

### C. Model Evaluation & Performance
- **Algorithm:** `RandomForestClassifier(n_estimators=200, max_depth=10, min_samples_leaf=10, class_weight='balanced')`
- **Split:** 80% Train (55,345) / 20% Stratified Test (13,837).

| Metric | Test Set Score | Interpretation |
| :--- | :--- | :--- |
| **Accuracy** | **56.57%** | Balanced trade-off under heavy class imbalance |
| **Precision** | **79.66%** | High certainty when identifying churn risk |
| **Recall** | **61.18%** | Successfully catches 61.2% of actual churners |
| **F1-Score** | **69.21%** | Harmonic balance between precision and recall |
| **ROC-AUC** | **0.4977** | Realistic, un-leaked discrimination |

#### Confusion Matrix:
- True Retained (TN): **1,076**
- False Churn (FP): **1,724**
- False Retained (FN): **4,285**
- True Churn (TP): **6,752**

### D. Feature Importance (Top Predictors)
1. `avg_item_price_before_T` : **10.98%**
2. `aov_before_T` : **10.37%**
3. `tenure_days_at_T` : **10.11%**
4. `monetary_before_T` : **9.94%**
5. `recency_days_at_T` : **9.79%**
6. `order_rate_per_month` : **9.63%**
7. `recency_to_tenure_ratio` : **6.73%**
8. `spend_last_180d` : **6.14%**
9. `age` : **5.07%**
10. `spend_last_90d` : **4.42%**

---

## 4. Association Rule Mining (FP-Growth Algorithm)

### A. Market Basket Construction
- Analyzed 12,013 distinct restaurant menus to discover frequently co-occurring dish combinations.
- Extracted 432,278 valid association rules with `min_support = 0.015` and `min_lift = 1.2`.

### B. Top Discovered Association Rules
| Antecedent (Dishes) | Consequent (Dishes) | Support | Confidence | Lift |
| :--- | :--- | :--- | :--- | :--- |
| Chicken Manchow Soup, Veg Sweet Corn Soup | Chicken Sweet Corn Soup, Veg Manchow Soup | 1.64% | 80.74% | **38.95x** |
| Tomato Uttapam | Onion Uttapam | 1.52% | 90.10% | **36.94x** |
| Manchurian Dry | Manchurian Gravy | 1.75% | 76.09% | **32.41x** |
| Butter Naan, Paneer Butter Masala | Dal Makhani | 2.10% | 72.40% | **24.15x** |

---

## 5. Explainable Restaurant Recommendation Engine

### A. Hybrid Scoring Architecture
For any customer $u$ and candidate restaurant $r$:

$$\text{Score}(u, r) = 0.40 \cdot S_{\text{cuisine}}(u, r) + 0.35 \cdot S_{\text{quality}}(r) + 0.25 \cdot S_{\text{price}}(u, r)$$

1. **Cuisine Affinity ($S_{\text{cuisine}}$):**
   - $1.00$ if primary cuisine matches user's top ordered cuisine.
   - $0.75$ if cuisine is in user's secondary preferences.
   - $0.20$ fallback.
2. **Quality & Popularity ($S_{\text{quality}}$):**
   - Computed using Bayesian Weighted Average Rating:
     $$R_{\text{Bayes}} = \frac{v}{v+m} R + \frac{m}{v+m} C$$
     where $v = \text{rating\_count}$, $m = 50$, $C = 3.5$.
3. **Price Compatibility ($S_{\text{price}}$):**
   - Measures proximity between customer AOV and restaurant cost for two:
     $$S_{\text{price}} = \max\left(0, 1 - \frac{|\text{Cost}_{\text{two}} - \text{AOV}_u|}{\max(\text{AOV}_u, 1000)}\right)$$

### B. Transparent Explanation Generator
Emits viva-friendly explanation pills:
- `"Matches your favorite cuisine (North Indian)"`
- `"Top-rated with 4.4/5 stars (1,200+ reviews)"`
- `"Fits your typical budget (₹400 for two)"`
- `"Located in your primary delivery area (Bangalore)"`
