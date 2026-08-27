import os
from pathlib import Path
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator
from dotenv import load_dotenv

# Locate project root directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings(BaseSettings):
    # Database Settings
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "zomato_dw"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"

    # Paths
    PROJECT_ROOT: Path = BASE_DIR
    DATASET_PATH: Path = BASE_DIR / "zomato_dataset"
    PROCESSED_DATA_DIR: Path = BASE_DIR / "data/processed"
    ML_ARTIFACTS_DIR: Path = BASE_DIR / "ml/artifacts"
    SQL_SCRIPTS_DIR: Path = BASE_DIR / "sql"

    # FastAPI Server
    BACKEND_HOST: str = "127.0.0.1"
    BACKEND_PORT: int = 8000
    API_PREFIX: str = "/api"
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://127.0.0.1:5173"

    # ML Parameters
    KMEANS_N_CLUSTERS: int = 4
    KMEANS_RANDOM_STATE: int = 42
    CHURN_INACTIVITY_DAYS: int = 180
    FP_GROWTH_MIN_SUPPORT: float = 0.01
    FP_GROWTH_MIN_LIFT: float = 1.1

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def PSYCOPG2_CONN_DICT(self) -> dict:
        return {
            "host": self.DB_HOST,
            "port": self.DB_PORT,
            "dbname": self.DB_NAME,
            "user": self.DB_USER,
            "password": self.DB_PASSWORD,
        }

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
