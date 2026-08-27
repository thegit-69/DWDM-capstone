# Data Warehouse Architecture & Star Schema Design

> **Project:** Designing a Data Warehouse System for Food Delivery Customer Behavior, Churn Prediction and Restaurant Recommendation  
> **Target Database:** PostgreSQL (`zomato_dw`)  
> **Modeling Technique:** Dimensional Modeling (Kimball Star Schema)

---

## 1. Dimensional Model Overview

```
                      +-----------------------------+
                      |          DIM_USER           |
                      +-----------------------------+
                      | PK  user_sk                 |
                      |     user_id (Natural Key)   |
                      |     name, email             |
                      |     age, gender             |
                      |     marital_status          |
                      |     occupation              |
                      |     monthly_income          |
                      |     educational_qual        |
                      |     family_size             |
                      |     income_tier             |
                      |     customer_segment        |
                      |     churn_probability       |
                      |     is_churned              |
                      +--------------+--------------+
                                     |
                                     | 1:N
                                     v
+------------------------+     +------------------------+     +------------------------+
|     DIM_LOCATION       |     |      FACT_ORDERS       |     |     DIM_RESTAURANT     |
+------------------------+     +------------------------+     +------------------------+
| PK  location_sk        |<----+ PK  order_sk           +---->| PK  restaurant_sk      |
|     city (Natural Key) | 1:N | FK  user_sk            | 1:N |     restaurant_id (NK) |
|     market_tier        |     | FK  restaurant_sk      |     |     name, city         |
+------------------------+     | FK  date_sk            |     | FK  location_sk        |
                               | FK  location_sk        |     |     rating, rating_cat |
                               |     sales_qty          |     |     cost_for_two       |
                               |     sales_amount (INR) |     |     primary_cuisine    |
                               |     avg_item_price     |     |     all_cuisines       |
                               |     is_valid_order     |     +-----------+------------+
                               +-----------+------------+                 |
                                           |                              | 1:N
                                           | 1:N                          v
                                           v                  +------------------------+
                               +------------------------+     |  FACT_RESTAURANT_MENU  |
                               |        DIM_DATE        |     +------------------------+
                               +------------------------+     | PK  menu_sk            |
                               | PK  date_sk (YYYYMMDD) |     |     menu_id            |
                               |     full_date          |     | FK  restaurant_sk      |
                               |     day, month, year   |     | FK  food_sk            |
                               |     quarter, day_name  |     |     cuisine, price     |
                               |     is_weekend         |     +-----------+------------+
                               +------------------------+                 |
                                                                          | N:1
                                                                          v
                                                              +------------------------+
                                                              |        DIM_FOOD        |
                                                              +------------------------+
                                                              | PK  food_sk            |
                                                              |     food_id (NK)       |
                                                              |     item_name          |
                                                              |     veg_or_non_veg     |
                                                              +------------------------+
```

---

## 2. Table Specifications & Grain Definitions

### A. Fact Tables

#### 1. `fact_orders`
- **Grain:** One row per individual customer order transaction.
- **Foreign Keys:** `user_sk`, `restaurant_sk`, `date_sk`, `location_sk`.
- **Measures (Additive):**
  - `sales_qty`: Total units/items ordered in the transaction.
  - `sales_amount`: Monetary value in INR.
- **Measures (Semi-Additive / Non-Additive):**
  - `avg_item_price`: `sales_amount / sales_qty`.
- **Degenerate Dimensions / Flags:**
  - `is_valid_order`: `TRUE` for valid transactions, `FALSE` for cancellations/refunds (`sales_amount < 0`).
  - `is_refund`: `TRUE` if `sales_amount <= 0`.

#### 2. `fact_restaurant_menu`
- **Grain:** One row per menu offering per restaurant.
- **Foreign Keys:** `restaurant_sk`, `food_sk`.
- **Measures:** `price` (Price of the item in INR).

---

### B. Dimension Tables

#### 1. `dim_user`
- **Grain:** One row per registered customer.
- **Natural Key:** `user_id`.
- **Attributes:** Demographics (`age`, `gender`, `marital_status`, `occupation`, `monthly_income`, `educational_qualifications`, `family_size`).
- **Derived Analytics Attributes:** `customer_segment` (from K-Means clustering), `churn_probability` and `is_churned` (from Random Forest model).

#### 2. `dim_restaurant`
- **Grain:** One row per restaurant outlet.
- **Natural Key:** `restaurant_id`.
- **Attributes:** `name`, `city`, `rating`, `rating_category`, `cost_for_two`, `primary_cuisine`, `all_cuisines`, `address`.

#### 3. `dim_food`
- **Grain:** One row per catalog food dish.
- **Natural Key:** `food_id`.
- **Attributes:** `item_name`, `veg_or_non_veg`.

#### 4. `dim_date`
- **Grain:** One row per calendar day.
- **Surrogate Key:** Integer in `YYYYMMDD` format (e.g. `20180512`).
- **Attributes:** `full_date`, `day`, `month`, `month_name`, `quarter`, `quarter_name`, `year`, `day_of_week`, `day_name`, `is_weekend`.

#### 5. `dim_location`
- **Grain:** One row per distinct market / city.
- **Attributes:** `city`, `market_tier` (e.g. Tier-1, Tier-2).

---

## 3. Surrogate Key Strategy

1. **Deterministic Default Records (SK = 0):** All dimension tables contain a pre-populated `SK = 0` record representing "Unknown / Missing". If an order has a missing `r_id` or unregistered user, it is joined to `SK = 0` rather than dropped.
2. **Date Key Generation:** Integer date keys `YYYYMMDD` allow partition elimination and range-based OLAP grouping without expensive `DATE_TRUNC` conversions.
