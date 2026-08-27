import os
import sys
from pathlib import Path
import pandas as pd

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from backend.app.config import settings

def extract_raw_datasets():
    """Extracts all 5 raw CSV datasets from the dataset directory."""
    dataset_dir = settings.DATASET_PATH
    print(f"[EXTRACT] Reading raw CSV datasets from: {dataset_dir}...")

    if not dataset_dir.exists():
        raise FileNotFoundError(f"Dataset directory not found at: {dataset_dir}")

    raw_data = {}
    files = {
        "users": "users.csv",
        "restaurants": "restaurant.csv",
        "food": "food.csv",
        "menu": "menu.csv",
        "orders": "orders.csv"
    }

    for key, filename in files.items():
        file_path = dataset_dir / filename
        if not file_path.exists():
            raise FileNotFoundError(f"Required dataset file missing: {file_path}")

        print(f"  - Loading {filename}...")
        df = pd.read_csv(file_path, low_memory=False)
        raw_data[key] = df
        print(f"    Loaded {len(df):,} rows and {len(df.columns)} columns.")

    print("[EXTRACT] All raw datasets successfully extracted into memory.")
    return raw_data

if __name__ == "__main__":
    extract_raw_datasets()
