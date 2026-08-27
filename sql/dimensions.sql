-- ============================================================================
-- DATA WAREHOUSE DIMENSION TABLES DDL
-- Project: Zomato DWDM Capstone
-- ============================================================================

-- 1. DIM_USER (Customer Dimension)
-- Grain: One record per registered customer
CREATE TABLE IF NOT EXISTS dim_user (
    user_sk SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    age INT,
    gender VARCHAR(50),
    marital_status VARCHAR(50),
    occupation VARCHAR(100),
    monthly_income VARCHAR(100),
    educational_qualifications VARCHAR(100),
    family_size INT,
    age_group VARCHAR(50),
    income_tier VARCHAR(50),
    customer_segment VARCHAR(100) DEFAULT 'Unassigned',
    churn_probability NUMERIC(5, 4) DEFAULT 0.0000,
    is_churned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unknown / Default Record for User Dimension (SK = 0)
INSERT INTO dim_user (user_sk, user_id, name, age, gender, occupation, customer_segment)
VALUES (0, 0, 'Unknown Customer', 0, 'Unknown', 'Unknown', 'Unknown')
ON CONFLICT (user_sk) DO NOTHING;

-- 2. DIM_LOCATION (Location / City Dimension)
-- Grain: One record per distinct city / delivery territory
CREATE TABLE IF NOT EXISTS dim_location (
    location_sk SERIAL PRIMARY KEY,
    city VARCHAR(100) UNIQUE NOT NULL,
    market_tier VARCHAR(50) DEFAULT 'Tier-2',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unknown / Default Record for Location (SK = 0)
INSERT INTO dim_location (location_sk, city, market_tier)
VALUES (0, 'Unknown City', 'Unknown')
ON CONFLICT (location_sk) DO NOTHING;

-- 3. DIM_RESTAURANT (Restaurant Dimension)
-- Grain: One record per restaurant
CREATE TABLE IF NOT EXISTS dim_restaurant (
    restaurant_sk SERIAL PRIMARY KEY,
    restaurant_id INT UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    location_sk INT REFERENCES dim_location(location_sk),
    rating NUMERIC(3, 2) DEFAULT 0.0,
    rating_category VARCHAR(50) DEFAULT 'Unrated',
    rating_count INT DEFAULT 0,
    cost_for_two NUMERIC(10, 2) DEFAULT 0.0,
    cost_tier VARCHAR(50) DEFAULT 'Budget',
    primary_cuisine VARCHAR(100),
    all_cuisines TEXT,
    license_number VARCHAR(100),
    address TEXT,
    link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unknown / Default Record for Restaurant (SK = 0)
INSERT INTO dim_restaurant (restaurant_sk, restaurant_id, name, city, location_sk)
VALUES (0, 0, 'Unknown Restaurant', 'Unknown City', 0)
ON CONFLICT (restaurant_sk) DO NOTHING;

-- 4. DIM_FOOD (Food Catalog Dimension)
-- Grain: One record per unique food dish
CREATE TABLE IF NOT EXISTS dim_food (
    food_sk SERIAL PRIMARY KEY,
    food_id VARCHAR(50) UNIQUE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    veg_or_non_veg VARCHAR(50) DEFAULT 'Veg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unknown / Default Record for Food (SK = 0)
INSERT INTO dim_food (food_sk, food_id, item_name, veg_or_non_veg)
VALUES (0, 'fd_unknown', 'Unknown Dish', 'Unknown')
ON CONFLICT (food_sk) DO NOTHING;

-- 5. DIM_DATE (Calendar Date Dimension)
-- Grain: One record per calendar day across historical span (2017 to 2022)
CREATE TABLE IF NOT EXISTS dim_date (
    date_sk INT PRIMARY KEY, -- Format: YYYYMMDD (e.g. 20180512)
    full_date DATE UNIQUE NOT NULL,
    day INT NOT NULL,
    month INT NOT NULL,
    month_name VARCHAR(20) NOT NULL,
    quarter INT NOT NULL,
    quarter_name VARCHAR(10) NOT NULL,
    year INT NOT NULL,
    day_of_week INT NOT NULL,
    day_name VARCHAR(20) NOT NULL,
    is_weekend BOOLEAN NOT NULL
);

-- Unknown / Default Record for Date (SK = 0)
INSERT INTO dim_date (date_sk, full_date, day, month, month_name, quarter, quarter_name, year, day_of_week, day_name, is_weekend)
VALUES (0, '1970-01-01', 1, 1, 'January', 1, 'Q1', 1970, 4, 'Thursday', FALSE)
ON CONFLICT (date_sk) DO NOTHING;
