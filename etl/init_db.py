import os
import sys
from pathlib import Path
from datetime import date, timedelta
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from backend.app.config import settings

def create_database_if_not_exists():
    """Connect to default 'postgres' database and create target database if needed."""
    print(f"Connecting to PostgreSQL at {settings.DB_HOST}:{settings.DB_PORT} as '{settings.DB_USER}'...")
    try:
        conn = psycopg2.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            dbname="postgres",
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (settings.DB_NAME,))
        exists = cur.fetchone()
        if not exists:
            print(f"Database '{settings.DB_NAME}' does not exist. Creating...")
            cur.execute(f'CREATE DATABASE "{settings.DB_NAME}";')
            print(f"✅ Database '{settings.DB_NAME}' created successfully.")
        else:
            print(f"Database '{settings.DB_NAME}' already exists.")

        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error connecting/creating database: {e}")
        return False

def populate_dim_date(cur):
    """Pre-populates the dim_date dimension table from 2017-01-01 to 2022-12-31."""
    print("Populating dim_date dimension table (2017 to 2022)...")
    start_date = date(2017, 1, 1)
    end_date = date(2022, 12, 31)
    delta = timedelta(days=1)

    cur_date = start_date
    date_records = []
    while cur_date <= end_date:
        date_sk = int(cur_date.strftime("%Y%m%d"))
        day = cur_date.day
        month = cur_date.month
        month_name = cur_date.strftime("%B")
        quarter = (month - 1) // 3 + 1
        quarter_name = f"Q{quarter}"
        year = cur_date.year
        day_of_week = cur_date.weekday() + 1 # 1 = Monday, 7 = Sunday
        day_name = cur_date.strftime("%A")
        is_weekend = day_of_week in [6, 7]

        date_records.append((
            date_sk, cur_date, day, month, month_name, quarter,
            quarter_name, year, day_of_week, day_name, is_weekend
        ))
        cur_date += delta

    query = """
    INSERT INTO dim_date (
        date_sk, full_date, day, month, month_name, quarter,
        quarter_name, year, day_of_week, day_name, is_weekend
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (date_sk) DO NOTHING;
    """
    psycopg2.extras.execute_batch(cur, query, date_records, page_size=1000)
    print(f"✅ dim_date populated with {len(date_records):,} calendar day records.")

def init_schema():
    """Executes the DDL SQL scripts in the target database."""
    if not create_database_if_not_exists():
        print("Aborting schema initialization due to connection error.")
        return False

    print(f"Initializing Star Schema in database '{settings.DB_NAME}'...")
    try:
        conn = psycopg2.connect(**settings.PSYCOPG2_CONN_DICT)
        conn.autocommit = True
        cur = conn.cursor()

        sql_dir = settings.SQL_SCRIPTS_DIR

        # 1. Execute dimensions.sql
        print("Executing dimensions.sql...")
        with open(sql_dir / "dimensions.sql", "r", encoding="utf-8") as f:
            cur.execute(f.read())

        # 2. Execute facts.sql
        print("Executing facts.sql...")
        with open(sql_dir / "facts.sql", "r", encoding="utf-8") as f:
            cur.execute(f.read())

        # 3. Execute indexes.sql
        print("Executing indexes.sql...")
        with open(sql_dir / "indexes.sql", "r", encoding="utf-8") as f:
            cur.execute(f.read())

        # 4. Populate dim_date
        import psycopg2.extras
        populate_dim_date(cur)

        cur.close()
        conn.close()
        print("✅ Data Warehouse Star Schema initialized successfully!")
        return True
    except Exception as e:
        print(f"❌ Error initializing schema: {e}")
        return False

if __name__ == "__main__":
    init_schema()
