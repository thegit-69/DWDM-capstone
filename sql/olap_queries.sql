-- ============================================================================
-- OLAP ANALYTICAL ENGINE & MULTIDIMENSIONAL QUERIES
-- Project: Zomato DWDM Capstone
-- Database: zomato_dw
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXECUTIVE KPI SUMMARY
-- ----------------------------------------------------------------------------
-- Calculates core aggregate measures across the entire data warehouse.
SELECT 
    COUNT(CASE WHEN f.is_valid_order THEN 1 END) AS total_valid_orders,
    COUNT(CASE WHEN f.is_refund THEN 1 END) AS total_refund_orders,
    COUNT(*) AS total_transactions,
    ROUND(SUM(CASE WHEN f.is_valid_order THEN f.sales_amount ELSE 0 END), 2) AS total_revenue_inr,
    ROUND(AVG(CASE WHEN f.is_valid_order THEN f.sales_amount ELSE NULL END), 2) AS average_order_value,
    COUNT(DISTINCT f.user_sk) AS active_customers,
    (SELECT COUNT(*) FROM dim_user WHERE user_sk > 0) AS total_registered_customers,
    COUNT(DISTINCT f.restaurant_sk) AS active_restaurants,
    (SELECT COUNT(*) FROM dim_restaurant WHERE restaurant_sk > 0) AS total_restaurants,
    ROUND(AVG(r.rating) FILTER (WHERE r.rating > 0), 2) AS average_restaurant_rating
FROM fact_orders f
JOIN dim_restaurant r ON f.restaurant_sk = r.restaurant_sk;


-- ----------------------------------------------------------------------------
-- 2. ROLL-UP OLAP OPERATION (Year -> Quarter -> Month Multi-Level Aggregation)
-- ----------------------------------------------------------------------------
-- Roll-up aggregates detailed monthly data up to quarterly and yearly totals.
SELECT 
    d.year,
    d.quarter_name,
    d.month_name,
    COUNT(f.order_sk) AS total_orders,
    ROUND(SUM(f.sales_amount), 2) AS total_revenue,
    ROUND(AVG(f.sales_amount), 2) AS aov,
    COUNT(DISTINCT f.user_sk) AS active_users
FROM fact_orders f
JOIN dim_date d ON f.date_sk = d.date_sk
WHERE f.is_valid_order = TRUE
GROUP BY ROLLUP(d.year, d.quarter_name, d.month_name)
ORDER BY d.year NULLS LAST, d.quarter_name NULLS LAST, MIN(d.month) NULLS LAST;


-- ----------------------------------------------------------------------------
-- 3. DRILL-DOWN OLAP OPERATION (Year 2019 -> Specific Month -> Daily Velocity)
-- ----------------------------------------------------------------------------
-- Drill-down expands a higher-level summary into granular daily order timestamps.
SELECT 
    d.full_date,
    d.day_name,
    d.is_weekend,
    COUNT(f.order_sk) AS daily_orders,
    ROUND(SUM(f.sales_amount), 2) AS daily_revenue,
    ROUND(AVG(f.sales_amount), 2) AS daily_aov
FROM fact_orders f
JOIN dim_date d ON f.date_sk = d.date_sk
WHERE d.year = 2019 AND d.month = 5 -- May 2019 drill-down
  AND f.is_valid_order = TRUE
GROUP BY d.full_date, d.day_name, d.is_weekend
ORDER BY d.full_date ASC;


-- ----------------------------------------------------------------------------
-- 4. SLICE OLAP OPERATION (Filter on Single Dimension: City = 'Bangalore')
-- ----------------------------------------------------------------------------
-- Slice extracts a single 2D cross-section from the multidimensional cube.
SELECT 
    r.primary_cuisine,
    COUNT(f.order_sk) AS total_orders,
    ROUND(SUM(f.sales_amount), 2) AS total_revenue,
    ROUND(AVG(f.sales_amount), 2) AS avg_order_value,
    COUNT(DISTINCT r.restaurant_sk) AS restaurant_count
FROM fact_orders f
JOIN dim_location l ON f.location_sk = l.location_sk
JOIN dim_restaurant r ON f.restaurant_sk = r.restaurant_sk
WHERE LOWER(l.city) = 'bangalore' AND f.is_valid_order = TRUE
GROUP BY r.primary_cuisine
ORDER BY total_revenue DESC
LIMIT 15;


-- ----------------------------------------------------------------------------
-- 5. DICE OLAP OPERATION (Multi-Dimensional Filter: City, Cuisine, and Year)
-- ----------------------------------------------------------------------------
-- Dice selects a sub-cube defined by constraints on multiple dimensions simultaneously.
SELECT 
    l.city,
    r.primary_cuisine,
    d.year,
    d.quarter_name,
    COUNT(f.order_sk) AS orders_count,
    ROUND(SUM(f.sales_amount), 2) AS total_revenue,
    ROUND(AVG(r.cost_for_two), 2) AS avg_cost_for_two
FROM fact_orders f
JOIN dim_location l ON f.location_sk = l.location_sk
JOIN dim_restaurant r ON f.restaurant_sk = r.restaurant_sk
JOIN dim_date d ON f.date_sk = d.date_sk
WHERE LOWER(l.city) IN ('bangalore', 'delhi', 'mumbai')
  AND r.primary_cuisine IN ('North Indian', 'Chinese', 'Biryani', 'South Indian', 'Fast Food')
  AND d.year = 2019
  AND f.is_valid_order = TRUE
GROUP BY l.city, r.primary_cuisine, d.year, d.quarter_name
ORDER BY l.city, total_revenue DESC;


-- ----------------------------------------------------------------------------
-- 6. PIVOT / CROSS-TABULATION (Quarterly Revenue by Top Cuisines)
-- ----------------------------------------------------------------------------
-- Rotates dimension axes to project quarterly performance side-by-side.
SELECT 
    r.primary_cuisine,
    ROUND(SUM(CASE WHEN d.quarter = 1 THEN f.sales_amount ELSE 0 END), 2) AS q1_revenue,
    ROUND(SUM(CASE WHEN d.quarter = 2 THEN f.sales_amount ELSE 0 END), 2) AS q2_revenue,
    ROUND(SUM(CASE WHEN d.quarter = 3 THEN f.sales_amount ELSE 0 END), 2) AS q3_revenue,
    ROUND(SUM(CASE WHEN d.quarter = 4 THEN f.sales_amount ELSE 0 END), 2) AS q4_revenue,
    ROUND(SUM(f.sales_amount), 2) AS total_annual_revenue
FROM fact_orders f
JOIN dim_restaurant r ON f.restaurant_sk = r.restaurant_sk
JOIN dim_date d ON f.date_sk = d.date_sk
WHERE d.year = 2019 AND f.is_valid_order = TRUE
GROUP BY r.primary_cuisine
ORDER BY total_annual_revenue DESC
LIMIT 10;


-- ----------------------------------------------------------------------------
-- 7. CUISINE MARKET SHARE & PERFORMANCE
-- ----------------------------------------------------------------------------
SELECT 
    r.primary_cuisine,
    COUNT(f.order_sk) AS total_orders,
    ROUND(SUM(f.sales_amount), 2) AS total_revenue,
    ROUND((SUM(f.sales_amount) * 100.0 / SUM(SUM(f.sales_amount)) OVER ()), 2) AS revenue_market_share_pct,
    ROUND(AVG(f.sales_amount), 2) AS aov,
    ROUND(AVG(r.rating) FILTER (WHERE r.rating > 0), 2) AS avg_cuisine_rating,
    ROUND(AVG(r.cost_for_two), 2) AS avg_cost_for_two
FROM fact_orders f
JOIN dim_restaurant r ON f.restaurant_sk = r.restaurant_sk
WHERE f.is_valid_order = TRUE
GROUP BY r.primary_cuisine
ORDER BY total_revenue DESC
LIMIT 20;


-- ----------------------------------------------------------------------------
-- 8. TOP RESTAURANTS RANKINGS (Revenue & Bayesian Quality Score)
-- ----------------------------------------------------------------------------
SELECT 
    r.restaurant_id,
    r.name AS restaurant_name,
    l.city,
    r.primary_cuisine,
    r.rating,
    r.rating_count,
    r.cost_for_two,
    COUNT(f.order_sk) AS total_orders,
    ROUND(SUM(f.sales_amount), 2) AS total_revenue,
    ROUND(AVG(f.sales_amount), 2) AS aov
FROM fact_orders f
JOIN dim_restaurant r ON f.restaurant_sk = r.restaurant_sk
JOIN dim_location l ON f.location_sk = l.location_sk
WHERE f.is_valid_order = TRUE
GROUP BY r.restaurant_id, r.name, l.city, r.primary_cuisine, r.rating, r.rating_count, r.cost_for_two
ORDER BY total_revenue DESC
LIMIT 25;


-- ----------------------------------------------------------------------------
-- 9. CUSTOMER RFM (Recency, Frequency, Monetary) EXTRACTION
-- ----------------------------------------------------------------------------
-- Computes customer-level RFM metrics directly from the Star Schema.
WITH max_dataset_date AS (
    SELECT MAX(full_date) AS max_date FROM dim_date WHERE date_sk IN (SELECT DISTINCT date_sk FROM fact_orders)
),
customer_orders AS (
    SELECT 
        u.user_sk,
        u.user_id,
        u.name,
        u.age,
        u.gender,
        u.occupation,
        u.monthly_income,
        u.family_size,
        COUNT(f.order_sk) AS frequency,
        COALESCE(SUM(CASE WHEN f.is_valid_order THEN f.sales_amount ELSE 0 END), 0) AS monetary,
        COALESCE(AVG(CASE WHEN f.is_valid_order THEN f.sales_amount ELSE NULL END), 0) AS avg_order_value,
        MAX(d.full_date) AS last_order_date
    FROM dim_user u
    LEFT JOIN fact_orders f ON u.user_sk = f.user_sk
    LEFT JOIN dim_date d ON f.date_sk = d.date_sk
    WHERE u.user_sk > 0
    GROUP BY u.user_sk, u.user_id, u.name, u.age, u.gender, u.occupation, u.monthly_income, u.family_size
)
SELECT 
    co.*,
    COALESCE((m.max_date - co.last_order_date), 999) AS recency_days,
    CASE 
        WHEN co.frequency = 0 THEN 'Dormant'
        WHEN (m.max_date - co.last_order_date) > 180 THEN 'At Risk / Inactive'
        WHEN co.frequency >= 5 AND co.monetary > 5000 THEN 'Champions / High Value'
        WHEN co.frequency >= 2 THEN 'Regular Customer'
        ELSE 'Occasional Buyer'
    END AS rfm_preliminary_segment
FROM customer_orders co
CROSS JOIN max_dataset_date m;
