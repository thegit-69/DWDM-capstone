-- ============================================================================
-- DATA WAREHOUSE FACT TABLES DDL
-- Project: Zomato DWDM Capstone
-- ============================================================================

-- 1. FACT_ORDERS (Primary Order Transactions Fact Table)
-- Grain: One record per individual order transaction
CREATE TABLE IF NOT EXISTS fact_orders (
    order_sk BIGSERIAL PRIMARY KEY,
    order_id INT,
    user_sk INT NOT NULL REFERENCES dim_user(user_sk),
    restaurant_sk INT NOT NULL REFERENCES dim_restaurant(restaurant_sk),
    date_sk INT NOT NULL REFERENCES dim_date(date_sk),
    location_sk INT NOT NULL REFERENCES dim_location(location_sk),
    sales_qty INT DEFAULT 1,
    sales_amount NUMERIC(12, 2) NOT NULL,
    avg_item_price NUMERIC(10, 2),
    currency VARCHAR(10) DEFAULT 'INR',
    is_valid_order BOOLEAN DEFAULT TRUE,
    is_refund BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. FACT_RESTAURANT_MENU (Restaurant Menu Offering Bridge / Fact)
-- Grain: One record per dish offered by a restaurant
CREATE TABLE IF NOT EXISTS fact_restaurant_menu (
    menu_sk BIGSERIAL PRIMARY KEY,
    menu_id VARCHAR(50),
    restaurant_sk INT NOT NULL REFERENCES dim_restaurant(restaurant_sk),
    food_sk INT NOT NULL REFERENCES dim_food(food_sk),
    cuisine VARCHAR(100),
    price NUMERIC(10, 2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
