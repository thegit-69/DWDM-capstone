import sys
from typing import List, Optional, Dict, Any
from backend.app.database import execute_query

def get_executive_kpis() -> Dict[str, Any]:
    """Retrieves high-level summary KPIs across the data warehouse."""
    query = "SELECT * FROM vw_executive_kpis;"
    res = execute_query(query, fetch="one")
    return res or {}

def get_monthly_trends(
    year: Optional[int] = None,
    city: Optional[str] = None,
    cuisine: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Retrieves monthly order and revenue time series with optional dimensional filters."""
    where_clauses = ["f.is_valid_order = TRUE"]
    params = []

    if year:
        where_clauses.append("d.year = %s")
        params.append(year)
    if city:
        where_clauses.append("l.city ILIKE %s")
        params.append(f"%{city}%")
    if cuisine:
        where_clauses.append("r.primary_cuisine ILIKE %s")
        params.append(f"%{cuisine}%")

    where_sql = " AND ".join(where_clauses)
    query = f"""
    SELECT 
        d.year,
        d.month,
        d.month_name,
        d.quarter_name,
        TO_CHAR(d.full_date, 'YYYY-MM') AS year_month,
        COUNT(f.order_sk) AS total_orders,
        ROUND(SUM(f.sales_amount), 2) AS total_revenue,
        ROUND(AVG(f.sales_amount), 2) AS aov,
        COUNT(DISTINCT f.user_sk) AS active_users
    FROM fact_orders f
    JOIN dim_date d ON f.date_sk = d.date_sk
    JOIN dim_restaurant r ON f.restaurant_sk = r.restaurant_sk
    JOIN dim_location l ON f.location_sk = l.location_sk
    WHERE {where_sql}
    GROUP BY d.year, d.month, d.month_name, d.quarter_name, TO_CHAR(d.full_date, 'YYYY-MM')
    ORDER BY d.year, d.month;
    """
    return execute_query(query, tuple(params), fetch="all")

def get_rollup_hierarchy() -> List[Dict[str, Any]]:
    """Executes multidimensional ROLLUP OLAP operation: Year -> Quarter -> Month."""
    query = """
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
    """
    return execute_query(query, fetch="all")

def get_drilldown_daily(year: int, month: int) -> List[Dict[str, Any]]:
    """Executes DRILL-DOWN OLAP operation to expand a monthly slice into daily data points."""
    query = """
    SELECT 
        d.full_date,
        d.day,
        d.day_name,
        d.is_weekend,
        COUNT(f.order_sk) AS daily_orders,
        ROUND(SUM(f.sales_amount), 2) AS daily_revenue,
        ROUND(AVG(f.sales_amount), 2) AS daily_aov
    FROM fact_orders f
    JOIN dim_date d ON f.date_sk = d.date_sk
    WHERE d.year = %s AND d.month = %s AND f.is_valid_order = TRUE
    GROUP BY d.full_date, d.day, d.day_name, d.is_weekend
    ORDER BY d.full_date ASC;
    """
    return execute_query(query, (year, month), fetch="all")

def get_slice_city(city: str) -> List[Dict[str, Any]]:
    """Executes SLICE OLAP operation: filters cube along a single dimension (City)."""
    query = """
    SELECT 
        r.primary_cuisine,
        COUNT(f.order_sk) AS total_orders,
        ROUND(SUM(f.sales_amount), 2) AS total_revenue,
        ROUND(AVG(f.sales_amount), 2) AS avg_order_value,
        COUNT(DISTINCT r.restaurant_sk) AS restaurant_count
    FROM fact_orders f
    JOIN dim_location l ON f.location_sk = l.location_sk
    JOIN dim_restaurant r ON f.restaurant_sk = r.restaurant_sk
    WHERE l.city ILIKE %s AND f.is_valid_order = TRUE
    GROUP BY r.primary_cuisine
    ORDER BY total_revenue DESC
    LIMIT 15;
    """
    return execute_query(query, (f"%{city}%",), fetch="all")

def get_dice_subcube(
    cities: List[str],
    cuisines: List[str],
    year: int
) -> List[Dict[str, Any]]:
    """Executes DICE OLAP operation: selects a sub-cube defined across multiple dimensions."""
    where_cities = " OR ".join(["l.city ILIKE %s" for _ in cities])
    where_cuisines = " OR ".join(["r.primary_cuisine ILIKE %s" for _ in cuisines])

    params = [f"%{c}%" for c in cities] + [f"%{c}%" for c in cuisines] + [year]

    query = f"""
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
    WHERE ({where_cities})
      AND ({where_cuisines})
      AND d.year = %s
      AND f.is_valid_order = TRUE
    GROUP BY l.city, r.primary_cuisine, d.year, d.quarter_name
    ORDER BY l.city, total_revenue DESC;
    """
    return execute_query(query, tuple(params), fetch="all")

def get_cuisine_analytics(limit: int = 15) -> List[Dict[str, Any]]:
    """Returns ranked cuisine performance and revenue shares."""
    query = """
    SELECT * FROM vw_cuisine_analytics
    ORDER BY total_revenue DESC
    LIMIT %s;
    """
    return execute_query(query, (limit,), fetch="all")

def get_city_analytics(limit: int = 20) -> List[Dict[str, Any]]:
    """Returns ranked cities by revenue and orders."""
    query = """
    SELECT * FROM vw_city_analytics
    ORDER BY total_revenue DESC
    LIMIT %s;
    """
    return execute_query(query, (limit,), fetch="all")

def get_top_restaurants(
    limit: int = 10,
    city: Optional[str] = None,
    cuisine: Optional[str] = None,
    sort_by: str = "revenue"
) -> List[Dict[str, Any]]:
    """Returns top performing restaurants filterable by city, cuisine, and metric."""
    where_clauses = ["1=1"]
    params = []

    if city:
        where_clauses.append("city ILIKE %s")
        params.append(f"%{city}%")
    if cuisine:
        where_clauses.append("primary_cuisine ILIKE %s")
        params.append(f"%{cuisine}%")

    order_col = "total_revenue DESC"
    if sort_by == "rating":
        order_col = "rating DESC, rating_count DESC"
    elif sort_by == "orders":
        order_col = "total_orders DESC"

    where_sql = " AND ".join(where_clauses)
    params.append(limit)

    query = f"""
    SELECT * FROM vw_top_restaurants
    WHERE {where_sql}
    ORDER BY {order_col}
    LIMIT %s;
    """
    return execute_query(query, tuple(params), fetch="all")
