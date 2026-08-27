from typing import List
from fastapi import APIRouter, Query
from backend.app.schemas.schemas import CuisineItem, CityItem
from backend.app.services import olap_service

router = APIRouter(tags=["Cuisines & City Analytics"])

@router.get("/cuisines", response_model=List[CuisineItem])
def get_ranked_cuisines(
    limit: int = Query(15, ge=1, le=100, description="Number of top cuisines to return")
):
    """Retrieves ranked cuisine performance, revenue totals, and market share percentages."""
    return olap_service.get_cuisine_analytics(limit=limit)

@router.get("/cities", response_model=List[CityItem])
def get_ranked_cities(
    limit: int = Query(20, ge=1, le=200, description="Number of top cities to return")
):
    """Retrieves ranked city revenue, orders, and customer volume."""
    return olap_service.get_city_analytics(limit=limit)
