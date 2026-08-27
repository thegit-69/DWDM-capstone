import re
import sys
from datetime import datetime
import pandas as pd
import numpy as np

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def sanitize_str(val):
    if pd.isnull(val):
        return ""
    s = str(val).replace("\t", " ").replace("\r", " ").replace("\n", " ")
    return re.sub(r"\s+", " ", s).strip()

def clean_cost(val):
    if pd.isnull(val):
        return 250.0
    val_str = str(val)
    digits = re.sub(r"[^\d]", "", val_str)
    if digits:
        return float(digits)
    return 250.0

def get_cost_tier(cost):
    if cost <= 250:
        return "Budget"
    elif cost <= 500:
        return "Moderate"
    elif cost <= 1000:
        return "Premium"
    else:
        return "Fine Dining"

def clean_rating(val):
    if pd.isnull(val):
        return 0.0
    val_str = str(val).strip()
    if val_str in ["--", "NEW", "Opening Soon", ""]:
        return 0.0
    try:
        r = float(val_str)
        return min(max(r, 0.0), 5.0)
    except ValueError:
        return 0.0

def get_rating_category(rating):
    if rating >= 4.5:
        return "Excellent"
    elif rating >= 4.0:
        return "Very Good"
    elif rating >= 3.5:
        return "Good"
    elif rating >= 3.0:
        return "Average"
    elif rating > 0.0:
        return "Poor"
    else:
        return "Unrated"

def clean_rating_count(val):
    if pd.isnull(val):
        return 0
    val_str = str(val).strip()
    if "K+" in val_str:
        num = re.sub(r"[^\d.]", "", val_str)
        try:
            return int(float(num) * 1000)
        except ValueError:
            return 1000
    digits = re.sub(r"[^\d]", "", val_str)
    if digits:
        return int(digits)
    return 0

def get_age_group(age):
    if age < 20:
        return "Under 20"
    elif age <= 29:
        return "Young Adult (20-29)"
    elif age <= 45:
        return "Middle-aged (30-45)"
    else:
        return "Senior (>45)"

def get_income_tier(income_str):
    if pd.isnull(income_str):
        return "Unknown"
    inc = str(income_str).lower()
    if "no income" in inc:
        return "No Income"
    elif "below" in inc or "10000" in inc:
        return "Low Income"
    elif "25000" in inc:
        return "Lower Middle"
    elif "50000" in inc:
        return "Upper Middle"
    elif "more than" in inc or "above" in inc:
        return "High Income"
    return "Medium Income"

METROS = {
    "bangalore", "delhi", "mumbai", "hyderabad", "kolkata",
    "chennai", "pune", "ahmedabad", "bengaluru", "new delhi"
}
TIER_1 = {
    "jaipur", "lucknow", "chandigarh", "indore", "kochi",
    "surat", "nagpur", "patna", "bhopal", "ludhiana", "agra",
    "vadodara", "varanasi", "visakhapatnam", "ghaziabad"
}

def get_market_tier(city):
    if not city:
        return "Tier-2"
    c = str(city).strip().lower()
    if c in METROS:
        return "Metro"
    elif c in TIER_1:
        return "Tier-1"
    return "Tier-2"

def transform_all_data(raw_data):
    """Transforms all raw datasets into clean relational DataFrames conforming to Star Schema."""
    print("\n[TRANSFORM] Starting data transformation and schema standardization...")

    # 1. Transform Locations
    print("  - Processing dim_location...")
    raw_rest = raw_data["restaurants"]
    cities = raw_rest["city"].dropna().apply(sanitize_str).unique()
    cities = sorted([c for c in cities if c])

    location_rows = []
    city_to_sk = {}
    for idx, city in enumerate(cities, start=1):
        city_to_sk[city.lower()] = idx
        location_rows.append({
            "location_sk": idx,
            "city": city,
            "market_tier": get_market_tier(city)
        })
    df_location = pd.DataFrame(location_rows)
    print(f"    Transformed {len(df_location):,} location records.")

    # 2. Transform Users
    print("  - Processing dim_user...")
    raw_users = raw_data["users"].copy()
    raw_users["name"] = raw_users["name"].apply(sanitize_str)
    raw_users["name"] = np.where(raw_users["name"] != "", raw_users["name"], "Customer " + raw_users["user_id"].astype(str))
    raw_users["email"] = raw_users["email"].apply(sanitize_str)
    raw_users["Age"] = raw_users["Age"].fillna(25).astype(int)
    raw_users["Gender"] = raw_users["Gender"].apply(sanitize_str).replace("", "Unknown")
    raw_users["Marital Status"] = raw_users["Marital Status"].apply(sanitize_str).replace("", "Single")
    raw_users["Occupation"] = raw_users["Occupation"].apply(sanitize_str).replace("", "Student")
    raw_users["Monthly Income"] = raw_users["Monthly Income"].apply(sanitize_str).replace("", "No Income")
    raw_users["Educational Qualifications"] = raw_users["Educational Qualifications"].apply(sanitize_str).replace("", "Graduate")
    raw_users["Family size"] = raw_users["Family size"].fillna(3).astype(int)

    raw_users["age_group"] = raw_users["Age"].apply(get_age_group)
    raw_users["income_tier"] = raw_users["Monthly Income"].apply(get_income_tier)
    raw_users["customer_segment"] = "Unassigned"
    raw_users["churn_probability"] = 0.0000
    raw_users["is_churned"] = False

    raw_users["user_sk"] = range(1, len(raw_users) + 1)
    user_id_to_sk = dict(zip(raw_users["user_id"], raw_users["user_sk"]))

    df_user = raw_users[[
        "user_sk", "user_id", "name", "email", "Age", "Gender",
        "Marital Status", "Occupation", "Monthly Income",
        "Educational Qualifications", "Family size", "age_group",
        "income_tier", "customer_segment", "churn_probability", "is_churned"
    ]].rename(columns={
        "Age": "age",
        "Gender": "gender",
        "Marital Status": "marital_status",
        "Occupation": "occupation",
        "Monthly Income": "monthly_income",
        "Educational Qualifications": "educational_qualifications",
        "Family size": "family_size"
    })
    print(f"    Transformed {len(df_user):,} customer records.")

    # 3. Transform Food Catalog
    print("  - Processing dim_food...")
    raw_food = raw_data["food"].copy()
    raw_food["item"] = raw_food["item"].apply(sanitize_str).str.title()
    raw_food["item"] = np.where(raw_food["item"] != "", raw_food["item"], "Unknown Dish")
    raw_food["veg_or_non_veg"] = raw_food["veg_or_non_veg"].apply(sanitize_str).str.capitalize()
    raw_food["veg_or_non_veg"] = raw_food["veg_or_non_veg"].apply(lambda v: "Non-veg" if "non" in v.lower() else "Veg")

    raw_food = raw_food.drop_duplicates(subset=["f_id"]).reset_index(drop=True)
    raw_food["food_sk"] = range(1, len(raw_food) + 1)
    food_id_to_sk = dict(zip(raw_food["f_id"], raw_food["food_sk"]))

    df_food = raw_food[["food_sk", "f_id", "item", "veg_or_non_veg"]].rename(columns={
        "f_id": "food_id",
        "item": "item_name"
    })
    print(f"    Transformed {len(df_food):,} food catalog records.")

    # 4. Transform Restaurants
    print("  - Processing dim_restaurant...")
    raw_rest = raw_data["restaurants"].copy()
    raw_rest["name"] = raw_rest["name"].apply(sanitize_str)
    raw_rest["name"] = np.where(raw_rest["name"] != "", raw_rest["name"], "Restaurant " + raw_rest["id"].astype(str))
    raw_rest["city"] = raw_rest["city"].apply(sanitize_str).replace("", "Unknown")
    raw_rest["rating_clean"] = raw_rest["rating"].apply(clean_rating)
    raw_rest["rating_category"] = raw_rest["rating_clean"].apply(get_rating_category)
    raw_rest["rating_count_clean"] = raw_rest["rating_count"].apply(clean_rating_count)
    raw_rest["cost_for_two"] = raw_rest["cost"].apply(clean_cost)
    raw_rest["cost_tier"] = raw_rest["cost_for_two"].apply(get_cost_tier)
    raw_rest["cuisine_clean"] = raw_rest["cuisine"].apply(sanitize_str).replace("", "General")
    raw_rest["primary_cuisine"] = raw_rest["cuisine_clean"].apply(lambda x: str(x).split(",")[0].strip())
    raw_rest["all_cuisines"] = raw_rest["cuisine_clean"]
    raw_rest["lic_no"] = raw_rest["lic_no"].apply(sanitize_str).replace("", "N/A")
    raw_rest["address"] = raw_rest["address"].apply(sanitize_str)
    raw_rest["address"] = np.where(raw_rest["address"] != "", raw_rest["address"], raw_rest["city"])
    raw_rest["link"] = raw_rest["link"].apply(sanitize_str)

    raw_rest["location_sk"] = raw_rest["city"].str.lower().map(city_to_sk).fillna(0).astype(int)
    raw_rest = raw_rest.drop_duplicates(subset=["id"]).reset_index(drop=True)
    raw_rest["restaurant_sk"] = range(1, len(raw_rest) + 1)
    rest_id_to_sk = dict(zip(raw_rest["id"], raw_rest["restaurant_sk"]))
    rest_sk_to_loc_sk = dict(zip(raw_rest["restaurant_sk"], raw_rest["location_sk"]))

    df_restaurant = raw_rest[[
        "restaurant_sk", "id", "name", "city", "location_sk",
        "rating_clean", "rating_category", "rating_count_clean",
        "cost_for_two", "cost_tier", "primary_cuisine", "all_cuisines",
        "lic_no", "address", "link"
    ]].rename(columns={
        "id": "restaurant_id",
        "rating_clean": "rating",
        "rating_count_clean": "rating_count",
        "lic_no": "license_number"
    })
    print(f"    Transformed {len(df_restaurant):,} restaurant records.")

    # 5. Transform Orders (fact_orders)
    print("  - Processing fact_orders...")
    raw_orders = raw_data["orders"].copy()
    raw_orders["order_id"] = range(1, len(raw_orders) + 1)
    raw_orders["user_sk"] = raw_orders["user_id"].map(user_id_to_sk).fillna(0).astype(int)
    raw_orders["restaurant_sk"] = raw_orders["r_id"].map(rest_id_to_sk).fillna(0).astype(int)
    raw_orders["location_sk"] = raw_orders["restaurant_sk"].map(rest_sk_to_loc_sk).fillna(0).astype(int)

    def parse_date_sk(d_str):
        try:
            return int(str(d_str).replace("-", "")[:8])
        except Exception:
            return 0

    raw_orders["date_sk"] = raw_orders["order_date"].apply(parse_date_sk)
    raw_orders["sales_qty"] = raw_orders["sales_qty"].fillna(1).astype(int).clip(lower=1)
    raw_orders["sales_amount"] = pd.to_numeric(raw_orders["sales_amount"], errors="coerce").fillna(0.0)

    raw_orders["is_valid_order"] = raw_orders["sales_amount"] > 0
    raw_orders["is_refund"] = raw_orders["sales_amount"] <= 0
    raw_orders["avg_item_price"] = np.where(
        raw_orders["sales_qty"] > 0,
        raw_orders["sales_amount"] / raw_orders["sales_qty"],
        raw_orders["sales_amount"]
    )
    raw_orders["currency"] = raw_orders["currency"].apply(sanitize_str).replace("", "INR")

    df_orders = raw_orders[[
        "order_id", "user_sk", "restaurant_sk", "date_sk", "location_sk",
        "sales_qty", "sales_amount", "avg_item_price", "currency",
        "is_valid_order", "is_refund"
    ]]
    print(f"    Transformed {len(df_orders):,} order transaction records.")

    # 6. Transform Menu (fact_restaurant_menu)
    print("  - Processing fact_restaurant_menu...")
    raw_menu = raw_data["menu"].copy()
    raw_menu["restaurant_sk"] = raw_menu["r_id"].map(rest_id_to_sk).fillna(0).astype(int)
    raw_menu["food_sk"] = raw_menu["f_id"].map(food_id_to_sk).fillna(0).astype(int)
    raw_menu["price"] = pd.to_numeric(raw_menu["price"], errors="coerce").fillna(0.0)
    raw_menu["cuisine"] = raw_menu["cuisine"].apply(sanitize_str).replace("", "General")
    raw_menu["menu_id"] = raw_menu["menu_id"].apply(sanitize_str)

    valid_menu = raw_menu[(raw_menu["restaurant_sk"] > 0) & (raw_menu["food_sk"] > 0)].copy()
    df_menu = valid_menu[["menu_id", "restaurant_sk", "food_sk", "cuisine", "price"]]
    print(f"    Transformed {len(df_menu):,} menu offering records.")

    print("[TRANSFORM] Data transformation completed successfully.")

    return {
        "dim_location": df_location,
        "dim_user": df_user,
        "dim_food": df_food,
        "dim_restaurant": df_restaurant,
        "fact_orders": df_orders,
        "fact_restaurant_menu": df_menu
    }

if __name__ == "__main__":
    from etl.extract import extract_raw_datasets
    raw = extract_raw_datasets()
    transformed = transform_all_data(raw)
