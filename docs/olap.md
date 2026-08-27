# OLAP Analytical Engine & Multidimensional SQL Operations

> **Project:** Designing a Data Warehouse System for Food Delivery Customer Behavior, Churn Prediction and Restaurant Recommendation  
> **Database:** PostgreSQL (`zomato_dw`)  
> **Source Scripts:** `sql/olap_queries.sql`, `sql/views.sql`, `backend/app/services/olap_service.py`, `sql/test_olap.py`

---

## 1. OLAP Concept & Multidimensional Cube Operations

Online Analytical Processing (OLAP) provides multidimensional views of data to support business intelligence, aggregate reporting, and decision making.

```
                            +---------------------------------+
                            |       DATA WAREHOUSE CUBE       |
                            |                                 |
                            |   Dimensions:                   |
                            |   - Time (Year, Quarter, Month) |
                            |   - Location (City, Tier)       |
                            |   - Cuisine / Restaurant        |
                            |   - Customer Demographics       |
                            |                                 |
                            |   Measures:                     |
                            |   - Sales Amount (Revenue INR)  |
                            |   - Sales Quantity (Order Vol)  |
                            |   - Average Order Value (AOV)   |
                            |   - Customer Count              |
                            +----------------+----------------+
                                             |
            +--------------------+-----------+-----------+--------------------+
            |                    |                       |                    |
            v                    v                       v                    v
      [ ROLL-UP ]         [ DRILL-DOWN ]             [ SLICE ]             [ DICE ]
   Day -> Mo -> Qtr -> Yr   Month -> Daily Date     Single City Slice     Sub-Cube Filtering
   (GROUP BY ROLLUP)        (Temporal Detail)       (WHERE City='Bng')    (City + Cuis + Year)
```

---

## 2. Core OLAP Operations Implemented

### 1. ROLL-UP (Aggregation along Hierarchy)
- **Definition:** Ascends the concept hierarchy by summarizing lower-level details into higher-level parent groupings.
- **Implementation:** `GROUP BY ROLLUP(d.year, d.quarter_name, d.month_name)`
- **SQL Excerpt:**
  ```sql
  SELECT 
      d.year,
      d.quarter_name,
      d.month_name,
      COUNT(f.order_sk) AS total_orders,
      ROUND(SUM(f.sales_amount), 2) AS total_revenue
  FROM fact_orders f
  JOIN dim_date d ON f.date_sk = d.date_sk
  WHERE f.is_valid_order = TRUE
  GROUP BY ROLLUP(d.year, d.quarter_name, d.month_name);
  ```

### 2. DRILL-DOWN (Increasing Detail Level)
- **Definition:** Navigates from less detailed data to more granular levels (e.g. from Year/Month down to individual Day timestamps).
- **SQL Excerpt:**
  ```sql
  SELECT 
      d.full_date,
      d.day_name,
      d.is_weekend,
      COUNT(f.order_sk) AS daily_orders,
      ROUND(SUM(f.sales_amount), 2) AS daily_revenue
  FROM fact_orders f
  JOIN dim_date d ON f.date_sk = d.date_sk
  WHERE d.year = 2019 AND d.month = 5
    AND f.is_valid_order = TRUE
  GROUP BY d.full_date, d.day_name, d.is_weekend
  ORDER BY d.full_date ASC;
  ```

### 3. SLICE (Single-Dimensional Filter)
- **Definition:** Performs a selection on one dimension of the cube, resulting in a 2D sub-table.
- **Example:** Slicing the cube specifically for the Bangalore market.
- **SQL Excerpt:**
  ```sql
  SELECT 
      r.primary_cuisine,
      COUNT(f.order_sk) AS total_orders,
      ROUND(SUM(f.sales_amount), 2) AS total_revenue
  FROM fact_orders f
  JOIN dim_location l ON f.location_sk = l.location_sk
  JOIN dim_restaurant r ON f.restaurant_sk = r.restaurant_sk
  WHERE l.city ILIKE '%bangalore%' AND f.is_valid_order = TRUE
  GROUP BY r.primary_cuisine
  ORDER BY total_revenue DESC;
  ```

### 4. DICE (Multi-Dimensional Sub-Cube Selection)
- **Definition:** Defines a sub-cube by applying simultaneous constraints across two or more dimensions (e.g., Cities $\times$ Cuisines $\times$ Year).
- **SQL Excerpt:**
  ```sql
  SELECT 
      l.city,
      r.primary_cuisine,
      d.year,
      d.quarter_name,
      COUNT(f.order_sk) AS orders_count,
      ROUND(SUM(f.sales_amount), 2) AS total_revenue
  FROM fact_orders f
  JOIN dim_location l ON f.location_sk = l.location_sk
  JOIN dim_restaurant r ON f.restaurant_sk = r.restaurant_sk
  JOIN dim_date d ON f.date_sk = d.date_sk
  WHERE (l.city ILIKE '%bangalore%' OR l.city ILIKE '%delhi%' OR l.city ILIKE '%mumbai%')
    AND (r.primary_cuisine ILIKE '%north indian%' OR r.primary_cuisine ILIKE '%chinese%')
    AND d.year = 2019 AND f.is_valid_order = TRUE
  GROUP BY l.city, r.primary_cuisine, d.year, d.quarter_name;
  ```

### 5. PIVOT (Cross-Tabulation & Dimension Rotation)
- **Definition:** Rotates data axes in view to provide an alternative presentation of multidimensional summaries.
- **Example:** Rotating Quarters into columnar projections for top cuisines side-by-side.

---

## 3. Database Views & Benchmark Results

The following views were created in PostgreSQL for fast API access:

| View Name | Granularity & Description | Query Execution Time |
| :--- | :--- | :--- |
| `vw_executive_kpis` | Single-row aggregate KPIs across all facts | **~270 ms** |
| `vw_monthly_trends` | 33 monthly temporal rows (2017-10 to 2020-06) | **~260 ms** |
| `vw_cuisine_analytics` | 2,132 distinct cuisine categories ranked by revenue | **~450 ms** |
| `vw_city_analytics` | 822 distinct cities and market tiers | **~220 ms** |
| `vw_top_restaurants` | 148,542 restaurants with revenue and rating aggregates | **~430 ms** |
| `vw_customer_rfm` | 100,001 customer profiles with Recency, Frequency, Monetary | **~330 ms** |

---

## 4. Academic Syllabus Mapping

This module directly satisfies the following Data Warehousing & Data Mining curricular requirements:
1. **Multidimensional Data Modeling:** Conceptual, Logical, and Physical schema implementation.
2. **OLAP Operations:** Practical demonstration of Roll-up, Drill-down, Slice, Dice, and Pivot.
3. **SQL-Based Aggregate Engines:** Replaces manual client-side computation with efficient database aggregation.
4. **RFM Customer Mining Foundation:** Direct SQL extraction of Recency, Frequency, and Monetary features for downstream K-Means clustering and Churn classification.
