import sys
import time

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from etl.init_db import init_schema
from etl.extract import extract_raw_datasets
from etl.transform import transform_all_data
from etl.load import load_data_warehouse

def run_etl_pipeline():
    """Master ETL Pipeline runner executing Schema Init -> Extract -> Transform -> Load."""
    print("=" * 70)
    print("ZOMATO DATA WAREHOUSE (DWDM) - END-TO-END ETL PIPELINE")
    print("=" * 70)
    start_total = time.time()

    # Step 1: Initialize Database & Schema
    print("\n>>> STEP 1: Database & Star Schema Verification")
    schema_ok = init_schema()
    if not schema_ok:
        print("[FAIL] Schema initialization failed. Aborting pipeline.")
        sys.exit(1)

    # Step 2: Extract Data
    print("\n>>> STEP 2: Extraction")
    t0 = time.time()
    raw_data = extract_raw_datasets()
    print(f"Extraction finished in {time.time() - t0:.2f}s.")

    # Step 3: Transform Data
    print("\n>>> STEP 3: Transformation & Standardization")
    t0 = time.time()
    transformed_data = transform_all_data(raw_data)
    print(f"Transformation finished in {time.time() - t0:.2f}s.")

    # Step 4: Load into Data Warehouse
    print("\n>>> STEP 4: PostgreSQL Warehouse Loading")
    t0 = time.time()
    load_data_warehouse(transformed_data)
    print(f"Loading finished in {time.time() - t0:.2f}s.")

    total_time = time.time() - start_total
    print("\n" + "=" * 70)
    print(f"[SUCCESS] COMPLETE ETL PIPELINE EXECUTED IN {total_time:.2f} SECONDS!")
    print("=" * 70)

if __name__ == "__main__":
    run_etl_pipeline()
