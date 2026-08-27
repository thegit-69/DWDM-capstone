# Data Warehouse Data Dictionary

> **Database:** `zomato_dw`  
> **Schema:** `public`  
> **Total Tables:** 7 (2 Facts, 5 Dimensions)

---

## 1. Fact Tables

### `fact_orders`
| Column | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `order_sk` | `BIGSERIAL` | No | Surrogate primary key |
| `order_id` | `INT` | Yes | Source transaction sequential identifier |
| `user_sk` | `INT` | No | FK to `dim_user.user_sk` |
| `restaurant_sk` | `INT` | No | FK to `dim_restaurant.restaurant_sk` |
| `date_sk` | `INT` | No | FK to `dim_date.date_sk` (YYYYMMDD) |
| `location_sk` | `INT` | No | FK to `dim_location.location_sk` |
| `sales_qty` | `INT` | No | Quantity of items ordered |
| `sales_amount` | `NUMERIC(12,2)` | No | Monetary order value in INR |
| `avg_item_price` | `NUMERIC(10,2)` | Yes | Computed average price per item |
| `currency` | `VARCHAR(10)` | No | Transaction currency (INR) |
| `is_valid_order` | `BOOLEAN` | No | `TRUE` if `sales_amount > 0` |
| `is_refund` | `BOOLEAN` | No | `TRUE` if transaction was a refund (`sales_amount <= 0`) |
| `created_at` | `TIMESTAMP` | No | Row creation timestamp |

### `fact_restaurant_menu`
| Column | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `menu_sk` | `BIGSERIAL` | No | Surrogate primary key |
| `menu_id` | `VARCHAR(50)` | Yes | Natural identifier from source dataset |
| `restaurant_sk` | `INT` | No | FK to `dim_restaurant.restaurant_sk` |
| `food_sk` | `INT` | No | FK to `dim_food.food_sk` |
| `cuisine` | `VARCHAR(100)` | Yes | Cuisine category for this dish offering |
| `price` | `NUMERIC(10,2)` | No | Price in INR |
| `created_at` | `TIMESTAMP` | No | Row creation timestamp |

---

## 2. Dimension Tables

### `dim_user`
| Column | Type | Description |
| :--- | :--- | :--- |
| `user_sk` | `SERIAL (PK)` | Surrogate key (0 = Unknown) |
| `user_id` | `INT (Unique)` | Natural user ID from source |
| `name` | `VARCHAR(255)` | User full name |
| `email` | `VARCHAR(255)` | User email address |
| `age` | `INT` | Age in years |
| `gender` | `VARCHAR(50)` | Gender (Male / Female) |
| `marital_status`| `VARCHAR(50)` | Marital status (Single, Married, etc.) |
| `occupation` | `VARCHAR(100)` | Employment category |
| `monthly_income`| `VARCHAR(100)` | Income range bracket |
| `educational_qualifications` | `VARCHAR(100)` | Education level |
| `family_size` | `INT` | Number of family members |
| `customer_segment` | `VARCHAR(100)` | K-Means derived cluster label |
| `churn_probability` | `NUMERIC(5,4)` | Random Forest estimated churn risk (0.0 to 1.0) |
| `is_churned` | `BOOLEAN` | High churn risk flag (> 0.5 probability) |

### `dim_restaurant`
| Column | Type | Description |
| :--- | :--- | :--- |
| `restaurant_sk` | `SERIAL (PK)` | Surrogate key (0 = Unknown) |
| `restaurant_id` | `INT (Unique)` | Natural restaurant ID |
| `name` | `VARCHAR(255)` | Restaurant business name |
| `city` | `VARCHAR(100)` | City location |
| `location_sk` | `INT (FK)` | Location dimension foreign key |
| `rating` | `NUMERIC(3,2)` | Clean average rating (0.0 to 5.0) |
| `rating_category`| `VARCHAR(50)` | Rating tier (Excellent, Good, Average, Unrated) |
| `rating_count` | `INT` | Total customer review count |
| `cost_for_two` | `NUMERIC(10,2)`| Clean numeric estimated cost for two (INR) |
| `cost_tier` | `VARCHAR(50)` | Budget, Moderate, Premium, Fine Dining |
| `primary_cuisine` | `VARCHAR(100)`| Extracted top cuisine |
| `all_cuisines` | `TEXT` | Comma-separated full cuisine list |
| `address` | `TEXT` | Physical address |

### `dim_food`
| Column | Type | Description |
| :--- | :--- | :--- |
| `food_sk` | `SERIAL (PK)` | Surrogate key (0 = Unknown) |
| `food_id` | `VARCHAR(50)` | Natural food identifier (e.g. `fd0`) |
| `item_name` | `VARCHAR(255)` | Name of the food dish |
| `veg_or_non_veg`| `VARCHAR(50)` | Dietary flag (`Veg` / `Non-veg`) |

### `dim_date`
| Column | Type | Description |
| :--- | :--- | :--- |
| `date_sk` | `INT (PK)` | `YYYYMMDD` integer representation |
| `full_date` | `DATE (Unique)`| Calendar date |
| `day` | `INT` | Day of month (1-31) |
| `month` | `INT` | Month number (1-12) |
| `month_name` | `VARCHAR(20)` | Full month name (e.g. `October`) |
| `quarter` | `INT` | Quarter number (1-4) |
| `quarter_name` | `VARCHAR(10)` | Quarter string (`Q1`, `Q2`, `Q3`, `Q4`) |
| `year` | `INT` | Calendar year (e.g. `2018`) |
| `day_of_week` | `INT` | 1 (Monday) to 7 (Sunday) |
| `day_name` | `VARCHAR(20)` | Name of day (e.g. `Wednesday`) |
| `is_weekend` | `BOOLEAN` | `TRUE` if Saturday or Sunday |

### `dim_location`
| Column | Type | Description |
| :--- | :--- | :--- |
| `location_sk` | `SERIAL (PK)` | Surrogate key (0 = Unknown) |
| `city` | `VARCHAR(100)` | Unique city name |
| `market_tier` | `VARCHAR(50)` | Commercial tier (`Metro`, `Tier-1`, `Tier-2`) |
