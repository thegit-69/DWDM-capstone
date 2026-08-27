-- ============================================================================
-- DATA WAREHOUSE ANALYTICAL VIEWS
-- Project: Zomato DWDM Capstone
-- Database: zomato_dw
-- ============================================================================

DROP VIEW IF EXISTS vw_executive_kpis CASCADE;
DROP VIEW IF EXISTS vw_monthly_trends CASCADE;
DROP VIEW IF EXISTS vw_cuisine_analytics CASCADE;
DROP VIEW IF EXISTS vw_city_analytics CASCADE;
DROP VIEW IF EXISTS vw_top_restaurants CASCADE;
DROP VIEW IF EXISTS vw_customer_rfm CASCADE;

-- 1. EXECUTIVE KPI VIEW
CREATE OR REPLACE VIEW vw_executive_kpis AS
SELECT 
    COUNT(CASE WHEN f.is_valid_order THEN 1 END) AS total_valid_orders,
    COUNT(CASE WHEN f.is_refund THEN 1 END) AS total_refund_orders,
    COUNT(*) AS total_transactions,
    ROUND(SUM(CASE WHEN f.is_valid_order THEN f.sales_amount ELSE 0 END), 2) AS total_revenue,
    ROUND(AVG(CASE WHEN f.is_valid_order THEN f.sales_amount ELSE NULL END), 2) AS average_order_value,
    COUNT(DISTINCT f.user_sk) AS active_customers,
    (SELECT COUNT(*) FROM dim_user WHERE user_sk > 0) AS total_registered_customers,
    COUNT(DISTINCT f.restaurant_sk) AS active_restaurants,
    (SELECT COUNT(*) FROM dim_restaurant WHERE restaurant_sk > 0) AS total_restaurants,
    ROUND(AVG(r.rating) FILTER (WHERE r.rating > 0), 2) AS average_restaurant_rating
FROM fact_orders f
JOIN dim_restaurant r ON f.restaurant_sk = r.restaurant_sk;

-- 2. MONTHLY TIME SERIES TRENDS VIEW
CREATE OR REPLACE VIEW vw_monthly_trends AS
SELECT 
    d.year,
    d.month,
    d.month_name,
    d.quarter_name,
    TO_CHAR(d.full_date, 'YYYY-MM') AS year_month,
    COUNT(f.order_sk) AS total_orders,
    ROUND(SUM(f.sales_amount), 2) AS total_revenue,
    ROUND(AVG(f.sales_amount), 2) AS aov,
    COUNT(DISTINCT f.user_sk) AS active_users,
    COUNT(DISTINCT f.restaurant_sk) AS active_restaurants
FROM fact_orders f
JOIN dim_date d ON f.date_sk = d.date_sk
WHERE f.is_valid_order = TRUE
GROUP BY d.year, d.month, d.month_name, d.quarter_name, TO_CHAR(d.full_date, 'YYYY-MM')
ORDER BY d.year, d.month;

-- 3. CUISINE PERFORMANCE ANALYTICS VIEW
CREATE OR REPLACE VIEW vw_cuisine_analytics AS
SELECT 
    r.primary_cuisine,
    COUNT(f.order_sk) AS total_orders,
    ROUND(SUM(f.sales_amount), 2) AS total_revenue,
    ROUND((SUM(f.sales_amount) * 100.0 / NULLIF(SUM(SUM(f.sales_amount)) OVER (), 0)), 2) AS revenue_share_pct,
    ROUND(AVG(f.sales_amount), 2) AS aov,
    ROUND(AVG(r.rating) FILTER (WHERE r.rating > 0), 2) AS avg_rating,
    ROUND(AVG(r.cost_for_two), 2) AS avg_cost_for_two,
    COUNT(DISTINCT r.restaurant_sk) AS restaurant_count
FROM fact_orders f
JOIN dim_restaurant r ON f.restaurant_sk = r.restaurant_sk
WHERE f.is_valid_order = TRUE
GROUP BY r.primary_cuisine;

-- 4. CITY & LOCATION PERFORMANCE VIEW
CREATE OR REPLACE VIEW vw_city_analytics AS
SELECT 
    l.location_sk,
    l.city,
    l.market_tier,
    COUNT(f.order_sk) AS total_orders,
    ROUND(SUM(f.sales_amount), 2) AS total_revenue,
    ROUND(AVG(f.sales_amount), 2) AS aov,
    COUNT(DISTINCT f.user_sk) AS unique_customers,
    COUNT(DISTINCT f.restaurant_sk) AS active_restaurants
FROM fact_orders f
JOIN dim_location l ON f.location_sk = l.location_sk
WHERE f.is_valid_order = TRUE
GROUP BY l.location_sk, l.city, l.market_tier;

-- 5. TOP RESTAURANTS VIEW
CREATE OR REPLACE VIEW vw_top_restaurants AS
SELECT 
    r.restaurant_sk,
    r.restaurant_id,
    r.name AS restaurant_name,
    l.city,
    l.market_tier,
    r.primary_cuisine,
    r.rating,
    r.rating_category,
    r.rating_count,
    r.cost_for_two,
    r.cost_tier,
    COUNT(f.order_sk) AS total_orders,
    ROUND(SUM(f.sales_amount), 2) AS total_revenue,
    ROUND(AVG(f.sales_amount), 2) AS aov
FROM fact_orders f
JOIN dim_restaurant r ON f.restaurant_sk = r.restaurant_sk
JOIN dim_location l ON f.location_sk = l.location_sk
WHERE f.is_valid_order = TRUE
GROUP BY r.restaurant_sk, r.restaurant_id, r.name, l.city, l.market_tier,
         r.primary_cuisine, r.rating, r.rating_category, r.rating_count,
         r.cost_for_two, r.cost_tier;

-- 6. CUSTOMER RFM PROFILE VIEW
CREATE OR REPLACE VIEW vw_customer_rfm AS
WITH max_dataset_date AS (
    SELECT MAX(full_date) AS max_date 
    FROM dim_date 
    WHERE date_sk IN (SELECT DISTINCT date_sk FROM fact_orders WHERE is_valid_order = TRUE)
),
customer_orders AS (
    SELECT 
        u.user_sk,
        u.user_id,
        u.name,
        u.age,
        u.gender,
        u.marital_status,
        u.occupation,
        u.monthly_income,
        u.educational_qualifications,
        u.family_size,
        u.age_group,
        u.income_tier,
        u.customer_segment,
        u.churn_probability,
        u.is_churned,
        COUNT(f.order_sk) AS frequency,
        COALESCE(SUM(CASE WHEN f.is_valid_order THEN f.sales_amount ELSE 0 END), 0) AS monetary,
        COALESCE(ROUND(AVG(CASE WHEN f.is_valid_order THEN f.sales_amount ELSE NULL END), 2), 0) AS aov,
        MAX(d.full_date) AS last_order_date
    FROM dim_user u
    LEFT JOIN fact_orders f ON u.user_sk = f.user_sk AND f.is_valid_order = TRUE
    LEFT JOIN dim_date d ON f.date_sk = d.date_sk
    WHERE u.user_sk > 0
    GROUP BY u.user_sk, u.user_id, u.name, u.age, u.gender, u.marital_status,
             u.occupation, u.monthly_income, u.educational_qualifications,
             u.family_size, u.age_group, u.income_tier, u.customer_segment,
             u.churn_probability, u.is_churned
)
SELECT 
    co.*,
    COALESCE((m.max_date - co.last_order_date), 999) AS recency_days
FROM customer_orders co
CROSS JOIN max_dataset_date m;
