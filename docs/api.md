# RESTful Backend API Documentation

> **Project:** Designing a Data Warehouse System for Food Delivery Customer Behavior, Churn Prediction and Restaurant Recommendation  
> **Framework:** FastAPI (Python 3.11)  
> **Interactive Swagger UI:** `http://localhost:8000/docs`  
> **OpenAPI Specification:** `http://localhost:8000/openapi.json`  
> **Source Directory:** `backend/app/`

---

## 1. API Architecture & Routing

```
                                  +-----------------------+
                                  |    FastAPI (App)      |
                                  |    CORS Middleware    |
                                  +-----------+-----------+
                                              |
      +---------------------+-----------------+---------------------+---------------------+
      |                     |                 |                     |                     |
      v                     v                 v                     v                     v
[ Overview API ]     [ Cuisines API ]  [ Restaurants API ]  [ Customers API ]     [ Mining API ]
- /api/health        - /api/cuisines   - /api/restaurants   - /api/customers/     - /api/association-rules
- /api/overview      - /api/cities       /top                 segments            - /api/recommendations/
- /api/orders/trend                    - /api/restaurants   - /api/customers/       {customer_id}
                                         /{id}                churn               - /api/olap/rollup
                                                            - /api/customers/     - /api/olap/drilldown
                                                              /{user_id}          - /api/olap/slice
                                                                                  - /api/olap/dice
```

---

## 2. Endpoint Specifications

### A. Overview & System Health
- **`GET /api/health`**
  - **Description:** System health check verifying PostgreSQL database connection and loaded ML model artifacts (`kmeans_model.pkl`, `churn_model.pkl`, `association_rules.json`).
  - **Response:**
    ```json
    {
      "status": "healthy",
      "database": "Connected (PostgreSQL zomato_dw)",
      "timestamp": "2026-08-27T23:25:00.123456",
      "models_loaded": true
    }
    ```

- **`GET /api/overview`**
  - **Description:** Retrieves high-level business intelligence KPIs across all fact transactions.
  - **Response:**
    ```json
    {
      "total_valid_orders": 148670,
      "total_refund_orders": 1611,
      "total_transactions": 150281,
      "total_revenue": 986565018.0,
      "average_order_value": 6635.94,
      "active_customers": 77929,
      "total_registered_customers": 100000,
      "active_restaurants": 148542,
      "total_restaurants": 148541,
      "average_restaurant_rating": 3.89
    }
    ```

- **`GET /api/orders/trend`**
  - **Query Parameters:** `year` (int), `city` (string), `cuisine` (string).
  - **Description:** Returns monthly time series with order volume, revenue, AOV, and active user metrics.

---

### B. Cuisine & City Analytics
- **`GET /api/cuisines`**
  - **Query Parameters:** `limit` (int, default=15).
  - **Description:** Ranked cuisine performance with total revenue, volume, and percentage market share.
- **`GET /api/cities`**
  - **Query Parameters:** `limit` (int, default=20).
  - **Description:** City revenue and transaction distribution across geographic market tiers.

---

### C. Restaurant Analytics
- **`GET /api/restaurants/top`**
  - **Query Parameters:**
    - `limit` (int, default=10)
    - `city` (string, optional)
    - `cuisine` (string, optional)
    - `sort_by` (`revenue` | `rating` | `orders`, default=`revenue`)
  - **Description:** Dynamic restaurant leaderboards filterable across multiple dimensional constraints.
- **`GET /api/restaurants/{restaurant_id}`**
  - **Description:** Detailed performance metrics and metadata for an individual restaurant.

---

### D. Customer Intelligence (Clustering & Churn)
- **`GET /api/customers/segments`**
  - **Description:** Returns K-Means cluster centroid metrics, business interpretations (*Regular Diners*, *Dormant Customers*, *Occasional Value Diners*, *High-Value Champions*), Elbow/Silhouette evaluation curves, and stratified 2D PCA scatter points for interactive charts.
- **`GET /api/customers/churn`**
  - **Description:** Returns leak-free temporal Random Forest churn model performance, confusion matrix, top Gini feature importances, customer risk tier breakdown, and benchmark comparisons against baselines (Majority Class, Recency Rule, Logistic Regression).
- **`GET /api/customers/{user_id}`**
  - **Description:** Full profile for an individual customer including demographics, lifetime spend, order frequency, assigned segment, churn risk probability, and preferred cuisines.

---

### E. Data Mining, OLAP & Recommendations
- **`GET /api/association-rules`**
  - **Query Parameters:** `min_lift` (float), `min_confidence` (float), `item_type` (`Menu Dishes` | `Customer Cuisines`), `limit` (int).
  - **Description:** Discovered FP-Growth association rules sorted by lift and confidence.
- **`GET /api/recommendations/{customer_id}`**
  - **Query Parameters:** `top_n` (int, default=6), `city` (string, optional), `cuisine` (string, optional).
  - **Description:** Generates personalized, hybrid restaurant recommendations with college viva-ready transparent explanation strings.
- **`GET /api/olap/rollup`**
  - **Description:** Multilevel temporal aggregation across Year $\rightarrow$ Quarter $\rightarrow$ Month (`GROUP BY ROLLUP`).
- **`GET /api/olap/drilldown`**
  - **Query Parameters:** `year` (int), `month` (int).
  - **Description:** Daily transaction velocity.
- **`GET /api/olap/slice`**
  - **Query Parameters:** `city` (string).
  - **Description:** Single dimension slice (e.g. City = 'Bangalore').
- **`GET /api/olap/dice`**
  - **Query Parameters:** `cities` (list), `cuisines` (list), `year` (int).
  - **Description:** Sub-cube filtering across multiple dimensions simultaneously.

---

## 3. Automated Test Execution

Run the complete test suite:
```powershell
.\.venv\Scripts\python.exe -m pytest backend/tests/test_api.py -v
```
**Results:** 16 passed in ~5 seconds.
