-- ============================================================================
-- MASTER DATA WAREHOUSE SCHEMA SCRIPT
-- Project: Zomato DWDM Capstone
-- ============================================================================

-- Drop existing tables in reverse dependency order if full rebuild is needed
DROP TABLE IF EXISTS fact_orders CASCADE;
DROP TABLE IF EXISTS fact_restaurant_menu CASCADE;
DROP TABLE IF EXISTS dim_user CASCADE;
DROP TABLE IF EXISTS dim_restaurant CASCADE;
DROP TABLE IF EXISTS dim_food CASCADE;
DROP TABLE IF EXISTS dim_date CASCADE;
DROP TABLE IF EXISTS dim_location CASCADE;

-- 1. Create Dimensions
\i dimensions.sql

-- 2. Create Facts
\i facts.sql

-- 3. Create Indexes
\i indexes.sql
