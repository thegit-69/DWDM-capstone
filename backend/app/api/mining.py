import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Query, HTTPException
from backend.app.schemas.schemas import AssociationRule, RecommendationResponse
from backend.app.config import settings
from backend.app.services import olap_service
from ml.recommendation import recommend_restaurants_for_customer

router = APIRouter(tags=["Data Mining, OLAP & Recommendations"])

@router.get("/association-rules", response_model=List[AssociationRule])
def get_association_rules(
    min_lift: float = Query(1.0, ge=0.0, description="Minimum rule lift threshold"),
    min_confidence: float = Query(0.0, ge=0.0, le=1.0, description="Minimum confidence threshold"),
    item_type: Optional[str] = Query(None, description="Filter by 'Menu Dishes' or 'Customer Cuisines'"),
    limit: int = Query(50, ge=1, le=500, description="Max rules to return")
):
    """Retrieves discovered FP-Growth association rules filterable by lift, confidence, and type."""
    rules_path = settings.ML_ARTIFACTS_DIR / "association_rules.json"
    if not rules_path.exists():
        raise HTTPException(status_code=503, detail="Association rules artifact not found. Please train models first.")

    with open(rules_path, "r", encoding="utf-8") as f:
        rules = json.load(f)

    # Filter rules
    filtered = []
    for r in rules:
        if r["lift"] < min_lift:
            continue
        if r["confidence"] < min_confidence:
            continue
        if item_type and r["type"].lower() != item_type.lower():
            continue
        filtered.append(r)

    # Sort by lift descending
    filtered = sorted(filtered, key=lambda x: (x["lift"], x["confidence"]), reverse=True)
    return filtered[:limit]

@router.get("/recommendations/{customer_id}", response_model=RecommendationResponse)
def get_customer_recommendations(
    customer_id: int,
    top_n: int = Query(6, ge=1, le=20, description="Number of recommendations to generate"),
    city: Optional[str] = Query(None, description="Override target city"),
    cuisine: Optional[str] = Query(None, description="Override target cuisine")
):
    """Generates explainable, hybrid restaurant recommendations tailored for a specific customer."""
    res = recommend_restaurants_for_customer(
        user_id=customer_id,
        top_n=top_n,
        filter_city=city,
        filter_cuisine=cuisine
    )
    if not res or not res.get("customer"):
        raise HTTPException(status_code=404, detail=f"Customer with ID {customer_id} not found.")

    return res

# ============================================================================
# ACADEMIC OLAP MULTIDIMENSIONAL ENDPOINTS
# ============================================================================

@router.get("/olap/rollup")
def get_olap_rollup():
    """Executes ROLL-UP OLAP operation ascending the temporal hierarchy (Year -> Quarter -> Month)."""
    return olap_service.get_rollup_hierarchy()

@router.get("/olap/drilldown")
def get_olap_drilldown(
    year: int = Query(2019, description="Target Year"),
    month: int = Query(5, ge=1, le=12, description="Target Month (1 to 12)")
):
    """Executes DRILL-DOWN OLAP operation descending into daily transaction granularity."""
    return olap_service.get_drilldown_daily(year=year, month=month)

@router.get("/olap/slice")
def get_olap_slice(
    city: str = Query("Bangalore", description="City to slice the multidimensional cube by")
):
    """Executes SLICE OLAP operation along a single dimension (Location/City)."""
    return olap_service.get_slice_city(city=city)

@router.get("/olap/dice")
def get_olap_dice(
    cities: List[str] = Query(["Bangalore", "Delhi", "Mumbai"], description="List of cities"),
    cuisines: List[str] = Query(["North Indian", "Chinese", "Biryani"], description="List of cuisines"),
    year: int = Query(2019, description="Target year")
):
    """Executes DICE OLAP operation selecting a multidimensional subcube (Cities x Cuisines x Year)."""
    return olap_service.get_dice_subcube(cities=cities, cuisines=cuisines, year=year)
