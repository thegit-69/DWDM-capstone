-- ============================================================================
-- DATA WAREHOUSE PERFORMANCE INDEXES
-- Project: Zomato DWDM Capstone
-- ============================================================================

-- Fact Orders Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_fact_orders_user ON fact_orders(user_sk);
CREATE INDEX IF NOT EXISTS idx_fact_orders_restaurant ON fact_orders(restaurant_sk);
CREATE INDEX IF NOT EXISTS idx_fact_orders_date ON fact_orders(date_sk);
CREATE INDEX IF NOT EXISTS idx_fact_orders_location ON fact_orders(location_sk);
CREATE INDEX IF NOT EXISTS idx_fact_orders_valid ON fact_orders(is_valid_order);

-- Fact Restaurant Menu Indexes
CREATE INDEX IF NOT EXISTS idx_fact_menu_restaurant ON fact_restaurant_menu(restaurant_sk);
CREATE INDEX IF NOT EXISTS idx_fact_menu_food ON fact_restaurant_menu(food_sk);
CREATE INDEX IF NOT EXISTS idx_fact_menu_cuisine ON fact_restaurant_menu(cuisine);

-- Dimension Lookup & Filter Indexes
CREATE INDEX IF NOT EXISTS idx_dim_user_natural ON dim_user(user_id);
CREATE INDEX IF NOT EXISTS idx_dim_user_segment ON dim_user(customer_segment);
CREATE INDEX IF NOT EXISTS idx_dim_user_churn ON dim_user(is_churned);

CREATE INDEX IF NOT EXISTS idx_dim_restaurant_natural ON dim_restaurant(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dim_restaurant_city ON dim_restaurant(city);
CREATE INDEX IF NOT EXISTS idx_dim_restaurant_rating ON dim_restaurant(rating);
CREATE INDEX IF NOT EXISTS idx_dim_restaurant_cuisine ON dim_restaurant(primary_cuisine);

CREATE INDEX IF NOT EXISTS idx_dim_date_year_month ON dim_date(year, month);
CREATE INDEX IF NOT EXISTS idx_dim_date_quarter ON dim_date(year, quarter);
