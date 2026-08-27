import psycopg2
from psycopg2.extras import RealDictCursor
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

# SQLAlchemy setup
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_raw_connection():
    return psycopg2.connect(**settings.PSYCOPG2_CONN_DICT)

def execute_query(query: str, params: tuple = None, fetch: str = "all"):
    """Execute a raw SQL query and return results as dictionaries."""
    conn = get_raw_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params or ())
            if fetch == "all":
                return [dict(row) for row in cur.fetchall()]
            elif fetch == "one":
                row = cur.fetchone()
                return dict(row) if row else None
            elif fetch == "none":
                conn.commit()
                return None
    finally:
        conn.close()
