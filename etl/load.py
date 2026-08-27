import io
import sys
import time
import csv
import psycopg2
from psycopg2.extras import execute_values
import pandas as pd

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from backend.app.config import settings

def fast_bulk_load_df(cur, table_name, df, columns):
    """Ultra-fast PostgreSQL bulk loader using in-memory CSV buffer and COPY FROM STDIN."""
    print(f"  - Bulk loading {len(df):,} rows into '{table_name}'...")
    start_time = time.time()

    # Create in-memory buffer with standard CSV formatting
    s_buf = io.StringIO()
    df[columns].to_csv(
        s_buf,
        index=False,
        header=False,
        na_rep="\\N",
        sep=",",
        quoting=csv.QUOTE_MINIMAL,
        escapechar="\\"
    )
    s_buf.seek(0)

    cols_str = ", ".join(columns)
    sql = f"COPY {table_name} ({cols_str}) FROM STDIN WITH (FORMAT csv, NULL '\\N', ESCAPE '\\', QUOTE '\"');"

    cur.copy_expert(sql=sql, file=s_buf)
    elapsed = time.time() - start_time
    print(f"    [OK] Loaded '{table_name}' in {elapsed:.2f}s ({len(df)/max(elapsed, 0.001):,.0f} rows/sec).")

def load_data_warehouse(transformed_data):
    """Loads all transformed DataFrames into PostgreSQL Data Warehouse tables."""
    print("\n[LOAD] Starting Data Warehouse ingestion into PostgreSQL...")
    conn = psycopg2.connect(**settings.PSYCOPG2_CONN_DICT)
    cur = conn.cursor()

    try:
        print("  - Clearing existing transaction facts and dimensions (preserving SK=0 defaults)...")
        cur.execute("TRUNCATE fact_orders, fact_restaurant_menu RESTART IDENTITY CASCADE;")
        cur.execute("DELETE FROM dim_restaurant WHERE restaurant_sk > 0;")
        cur.execute("DELETE FROM dim_food WHERE food_sk > 0;")
        cur.execute("DELETE FROM dim_user WHERE user_sk > 0;")
        cur.execute("DELETE FROM dim_location WHERE location_sk > 0;")

        # 1. Load dim_location
        df_loc = transformed_data["dim_location"]
        fast_bulk_load_df(cur, "dim_location", df_loc, ["location_sk", "city", "market_tier"])

        # 2. Load dim_user
        df_user = transformed_data["dim_user"]
        fast_bulk_load_df(cur, "dim_user", df_user, [
            "user_sk", "user_id", "name", "email", "age", "gender",
            "marital_status", "occupation", "monthly_income",
            "educational_qualifications", "family_size", "age_group",
            "income_tier", "customer_segment", "churn_probability", "is_churned"
        ])

        # 3. Load dim_food
        df_food = transformed_data["dim_food"]
        fast_bulk_load_df(cur, "dim_food", df_food, ["food_sk", "food_id", "item_name", "veg_or_non_veg"])

        # 4. Load dim_restaurant
        df_rest = transformed_data["dim_restaurant"]
        fast_bulk_load_df(cur, "dim_restaurant", df_rest, [
            "restaurant_sk", "restaurant_id", "name", "city", "location_sk",
            "rating", "rating_category", "rating_count", "cost_for_two",
            "cost_tier", "primary_cuisine", "all_cuisines", "license_number",
            "address", "link"
        ])

        # 5. Load fact_orders
        df_orders = transformed_data["fact_orders"]
        fast_bulk_load_df(cur, "fact_orders", df_orders, [
            "order_id", "user_sk", "restaurant_sk", "date_sk", "location_sk",
            "sales_qty", "sales_amount", "avg_item_price", "currency",
            "is_valid_order", "is_refund"
        ])

        # 6. Load fact_restaurant_menu
        df_menu = transformed_data["fact_restaurant_menu"]
        fast_bulk_load_df(cur, "fact_restaurant_menu", df_menu, [
            "menu_id", "restaurant_sk", "food_sk", "cuisine", "price"
        ])

        # Commit transaction
        conn.commit()
        print("\n[LOAD] All Data Warehouse tables committed successfully!")

        # Verification query
        print("\n[VERIFY] Verifying table row counts in PostgreSQL:")
        tables = [
            "dim_location", "dim_user", "dim_food", "dim_restaurant",
            "dim_date", "fact_orders", "fact_restaurant_menu"
        ]
        for tbl in tables:
            cur.execute(f"SELECT COUNT(*) FROM {tbl};")
            cnt = cur.fetchone()[0]
            print(f"  - {tbl:22s} : {cnt:,} rows")

    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Database loading failed: {e}")
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    from etl.extract import extract_raw_datasets
    from etl.transform import transform_all_data

    raw = extract_raw_datasets()
    transformed = transform_all_data(raw)
    load_data_warehouse(transformed)
