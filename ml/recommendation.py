import sys
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from backend.app.database import execute_query

def get_customer_profile(user_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves full customer profile, RFM stats, segment, churn risk, and top ordered cuisines."""
    query = """
    SELECT 
        u.user_sk,
        u.user_id,
        u.name,
        u.age,
        u.gender,
        u.occupation,
        u.monthly_income,
        u.family_size,
        u.customer_segment,
        u.churn_probability,
        u.is_churned,
        u.age_group,
        u.income_tier,
        COUNT(f.order_sk) AS total_orders,
        COALESCE(SUM(CASE WHEN f.is_valid_order THEN f.sales_amount ELSE 0 END), 0) AS total_spend,
        COALESCE(AVG(CASE WHEN f.is_valid_order THEN f.sales_amount ELSE NULL END), 0) AS avg_order_value,
        MAX(d.full_date) AS last_order_date
    FROM dim_user u
    LEFT JOIN fact_orders f ON u.user_sk = f.user_sk AND f.is_valid_order = TRUE
    LEFT JOIN dim_date d ON f.date_sk = d.date_sk
    WHERE u.user_id = %s
    GROUP BY u.user_sk, u.user_id, u.name, u.age, u.gender, u.occupation,
             u.monthly_income, u.family_size, u.customer_segment,
             u.churn_probability, u.is_churned, u.age_group, u.income_tier;
    """
    user = execute_query(query, (user_id,), fetch="one")
    if not user:
        return None

    # Get user's preferred cuisines from order history
    cuisine_query = """
    SELECT 
        r.primary_cuisine,
        COUNT(f.order_sk) AS orders_count
    FROM fact_orders f
    JOIN dim_restaurant r ON f.restaurant_sk = r.restaurant_sk
    WHERE f.user_sk = %s AND f.is_valid_order = TRUE AND r.primary_cuisine != 'General'
    GROUP BY r.primary_cuisine
    ORDER BY orders_count DESC
    LIMIT 3;
    """
    fav_cuisines = execute_query(cuisine_query, (user["user_sk"],), fetch="all")
    user["preferred_cuisines"] = [c["primary_cuisine"] for c in fav_cuisines]

    # Get user's most frequent ordering city
    city_query = """
    SELECT 
        l.city,
        COUNT(f.order_sk) AS city_orders
    FROM fact_orders f
    JOIN dim_location l ON f.location_sk = l.location_sk
    WHERE f.user_sk = %s AND f.is_valid_order = TRUE AND l.city != 'Unknown City'
    GROUP BY l.city
    ORDER BY city_orders DESC
    LIMIT 1;
    """
    top_city = execute_query(city_query, (user["user_sk"],), fetch="one")
    user["preferred_city"] = top_city["city"] if top_city else "Bangalore"

    return user

def recommend_restaurants_for_customer(
    user_id: int,
    top_n: int = 6,
    filter_city: Optional[str] = None,
    filter_cuisine: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates explainable, hybrid recommendations for a customer based on:
    1. Location Match (City)
    2. Cuisine Affinity (User's historical & demographic favorites)
    3. Quality & Popularity Score (Bayesian average rating)
    4. Price Compatibility (User AOV vs Restaurant Cost for Two)
    5. Customer Segment Affinity
    """
    profile = get_customer_profile(user_id)
    if not profile:
        return {
            "customer": None,
            "recommendations": [],
            "message": f"Customer ID {user_id} not found."
        }

    target_city = filter_city or profile.get("preferred_city") or "Bangalore"
    preferred_cuisines = profile.get("preferred_cuisines") or []
    if filter_cuisine:
        preferred_cuisines = [filter_cuisine] + [c for c in preferred_cuisines if c != filter_cuisine]
    elif not preferred_cuisines:
        # Default popular fallback
        preferred_cuisines = ["North Indian", "Chinese", "Biryani"]

    user_aov = float(profile.get("avg_order_value") or 500)
    customer_segment = profile.get("customer_segment") or "Regular Diners"

    # Fetch candidate restaurants in target city
    cand_query = """
    SELECT 
        r.restaurant_sk,
        r.restaurant_id,
        r.name,
        r.city,
        l.market_tier,
        r.rating,
        r.rating_count,
        r.cost_for_two,
        r.cost_tier,
        r.primary_cuisine,
        r.all_cuisines,
        r.address
    FROM dim_restaurant r
    JOIN dim_location l ON r.location_sk = l.location_sk
    WHERE r.city ILIKE %s AND r.restaurant_sk > 0
    ORDER BY r.rating DESC, r.rating_count DESC
    LIMIT 250;
    """
    candidates = execute_query(cand_query, (f"%{target_city}%",), fetch="all")

    if not candidates:
        # Fallback to top rated overall if city had few results
        cand_query = """
        SELECT 
            r.restaurant_sk,
            r.restaurant_id,
            r.name,
            r.city,
            l.market_tier,
            r.rating,
            r.rating_count,
            r.cost_for_two,
            r.cost_tier,
            r.primary_cuisine,
            r.all_cuisines,
            r.address
        FROM dim_restaurant r
        JOIN dim_location l ON r.location_sk = l.location_sk
        WHERE r.restaurant_sk > 0
        ORDER BY r.rating DESC, r.rating_count DESC
        LIMIT 100;
        """
        candidates = execute_query(cand_query, fetch="all")

    scored_restaurants = []

    for r in candidates:
        r_cuisine = str(r["primary_cuisine"])
        r_all_cuis = str(r["all_cuisines"])
        r_rating = float(r["rating"] or 0.0)
        r_rcount = int(r["rating_count"] or 0)
        r_cost = float(r["cost_for_two"] or 250.0)

        # 1. Cuisine Score (0.0 to 1.0)
        cuisine_score = 0.2
        is_top_cuisine = False
        if preferred_cuisines:
            if r_cuisine.lower() in [c.lower() for c in preferred_cuisines]:
                cuisine_score = 1.0
                is_top_cuisine = True
            elif any(c.lower() in r_all_cuis.lower() for c in preferred_cuisines):
                cuisine_score = 0.75
                is_top_cuisine = True

        # 2. Quality & Popularity Score (Bayesian Weighted Rating)
        # Weighted rating = (v/(v+m))*R + (m/(v+m))*C where m=50, C=3.5
        m = 50
        C = 3.5
        v = min(r_rcount, 1000)
        if r_rating > 0:
            bayesian_rating = (v / (v + m)) * r_rating + (m / (v + m)) * C
        else:
            bayesian_rating = 3.0
        quality_score = min(max((bayesian_rating - 2.0) / 3.0, 0.0), 1.0)

        # 3. Price Compatibility Score
        # Match user AOV with cost for two
        cost_diff = abs(r_cost - user_aov)
        price_score = max(0.0, 1.0 - (cost_diff / max(user_aov, 1000)))

        # 4. Total Combined Hybrid Score
        final_score = (
            (cuisine_score * 0.40) +
            (quality_score * 0.35) +
            (price_score * 0.25)
        )

        # Generate Transparent Explanation
        reasons = []
        if is_top_cuisine:
            reasons.append(f"Matches your favorite cuisine ({r_cuisine})")
        if r_rating >= 4.0:
            reasons.append(f"Top-rated with {r_rating:.1f}/5 stars ({r_rcount:,}+ ratings)")
        elif r_rating > 0:
            reasons.append(f"Rated {r_rating:.1f}/5 stars")
        if price_score >= 0.70:
            reasons.append(f"Fits your typical budget (Rs. {r_cost:.0f} for two)")
        reasons.append(f"Located in {r['city']}")

        explanation_text = " • ".join(reasons)

        scored_restaurants.append({
            "restaurant_id": r["restaurant_id"],
            "name": r["name"],
            "city": r["city"],
            "primary_cuisine": r["primary_cuisine"],
            "all_cuisines": r["all_cuisines"],
            "rating": r_rating,
            "rating_count": r_rcount,
            "cost_for_two": r_cost,
            "cost_tier": r["cost_tier"],
            "match_score_pct": round(final_score * 100, 1),
            "explanation": explanation_text,
            "reasons": reasons
        })

    # Sort by match score
    scored_restaurants = sorted(scored_restaurants, key=lambda x: x["match_score_pct"], reverse=True)
    top_recommendations = scored_restaurants[:top_n]

    return {
        "customer": {
            "user_id": profile["user_id"],
            "name": profile["name"],
            "age": profile["age"],
            "gender": profile["gender"],
            "occupation": profile["occupation"],
            "segment": profile["customer_segment"],
            "churn_probability": float(profile["churn_probability"]),
            "is_churned": profile["is_churned"],
            "total_orders": int(profile["total_orders"]),
            "total_spend": float(profile["total_spend"]),
            "avg_order_value": float(profile["avg_order_value"]),
            "preferred_city": target_city,
            "preferred_cuisines": preferred_cuisines
        },
        "target_city": target_city,
        "recommendations": top_recommendations
    }

if __name__ == "__main__":
    res = recommend_restaurants_for_customer(user_id=1, top_n=3)
    print(f"Customer: {res['customer']['name']} ({res['customer']['segment']})")
    print(f"Top Recommended Restaurants:")
    for r in res["recommendations"]:
        print(f" - {r['name']} ({r['primary_cuisine']}, {r['city']}) | Match: {r['match_score_pct']}%")
        print(f"   Reason: {r['explanation']}")
