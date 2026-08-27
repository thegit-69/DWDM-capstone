# Data Warehouse ETL Pipeline Documentation

> **Project:** Designing a Data Warehouse System for Food Delivery Customer Behavior, Churn Prediction and Restaurant Recommendation  
> **ETL Modules:** `etl/extract.py`, `etl/transform.py`, `etl/load.py`, `etl/pipeline.py`, `etl/profiling.py`, `etl/init_db.py`  
> **Source Directory:** `zomato_dataset/`  
> **Target Database:** PostgreSQL (`zomato_dw`)

---

## 1. ETL Architecture & Pipeline Flow

```
+---------------------------------------------------------------------------------------------------+
|                                         RAW DATA SOURCE                                           |
|  users.csv (100k) | restaurant.csv (148k) | food.csv (371k) | menu.csv (1.17M) | orders.csv (150k)|
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                     EXTRACT (etl/extract.py)                                      |
|  - High-performance Pandas ingestion with UTF-8 encoding and low_memory mode                      |
|  - File existence and schema verification                                                         |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                   TRANSFORM (etl/transform.py)                                    |
|  - Text Sanitization: Strips tabs (\t), newlines (\n), and excessive whitespace                   |
|  - Currency & Numeric Cleansing: Regex extraction from cost strings (e.g. '₹ 200' -> 200.0)       |
|  - Rating Normalization: Converts non-numeric flags ('--', 'NEW') -> 0.0, assigns rating tiers   |
|  - Customer Enrichment: Computes age groups, income brackets, and default ML status fields        |
|  - Surrogate Key Mapping: Builds dictionary mappings for users, restaurants, food, and locations  |
|  - Transaction Integrity: Flags refund/cancellation rows (sales_amount <= 0), maps dates to YYYYMMDD |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                      LOAD (etl/load.py)                                           |
|  - Fast in-memory CSV buffer streaming via PostgreSQL COPY ... FROM STDIN                         |
|  - Deterministic SK=0 fallback record preservation                                                |
|  - Foreign key constraint and index enforcement                                                   |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                   POSTGRESQL STAR SCHEMA                                          |
|  dim_location (822) | dim_user (100,001) | dim_food (371,562) | dim_restaurant (148,542)         |
|  dim_date (2,192)   | fact_orders (150,281) | fact_restaurant_menu (1,179,663)                    |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Transformation & Cleansing Rules

### A. Customer Dimension (`dim_user`)
- **Missing Value Handling:** Missing names imputed as `'Customer {user_id}'`, missing emails imputed as `'user{user_id}@example.com'`.
- **Age Categorization:**
  - `< 20`: `Under 20`
  - `20–29`: `Young Adult (20-29)`
  - `30–45`: `Middle-aged (30-45)`
  - `> 45`: `Senior (>45)`
- **Income Tiers:** Standardized into `No Income`, `Low Income`, `Lower Middle`, `Upper Middle`, `High Income`.

### B. Restaurant Dimension (`dim_restaurant`)
- **Cost for Two:** Extracted numeric values from raw strings containing rupee symbols (`₹ 200` $\rightarrow$ `200.0`). Missing values assigned the median `250.0`.
- **Ratings & Categories:**
  - `4.5–5.0`: `Excellent`
  - `4.0–4.4`: `Very Good`
  - `3.5–3.9`: `Good`
  - `3.0–3.4`: `Average`
  - `< 3.0`: `Poor`
  - Non-numeric (`--`, `NEW`, unrated): `0.0` / `Unrated`
- **Rating Count:** Parsed strings like `'100+ ratings'` $\rightarrow$ `100`, `'1K+ ratings'` $\rightarrow$ `1000`.

### C. Location Dimension (`dim_location`)
- **City Extraction:** Extracted 821 distinct cities from restaurant addresses.
- **Market Tiers:**
  - `Metro`: Bangalore, Delhi, Mumbai, Hyderabad, Kolkata, Chennai, Pune, Ahmedabad.
  - `Tier-1`: Jaipur, Lucknow, Chandigarh, Indore, Kochi, Surat, Nagpur, Patna, Bhopal, etc.
  - `Tier-2`: All remaining regional markets.

### D. Orders Fact Table (`fact_orders`)
- **Date Key:** Converted `YYYY-MM-DD` strings into integer surrogate keys `YYYYMMDD` matching `dim_date`.
- **Negative Sales Amounts:** 2 transactions with `sales_amount = -1` flagged as `is_refund = TRUE`, `is_valid_order = FALSE`.
- **Orphaned FK Handling:** Missing restaurant IDs in orders imputed to `restaurant_sk = 0` (Unknown Restaurant) to preserve transaction counts and financial totals.
- **Average Item Price:** Calculated as `sales_amount / sales_qty`.

---

## 3. Pipeline Ingestion Benchmark

| Step | Operation | Records Processed | Execution Time | Throughput |
| :--- | :--- | :--- | :--- | :--- |
| **Step 1** | Schema Verification & `dim_date` Population | 2,192 rows | 0.82s | ~2,670 rows/s |
| **Step 2** | Raw CSV Extraction | 1,950,319 total rows | 2.46s | ~792,000 rows/s |
| **Step 3** | Data Transformation & Standardization | 1,950,319 total rows | 7.98s | ~244,000 rows/s |
| **Step 4** | PostgreSQL Bulk Loading (`COPY`) | 1,950,319 total rows | 126.84s | ~15,370 rows/s |
| **Total** | **End-to-End Pipeline Execution** | **1,950,319 total rows** | **137.55s (~2.3 min)** | - |

---

## 4. Single-Command Reproduction

To execute the complete ETL pipeline from scratch at any time:

```bash
python -m etl.pipeline
```
