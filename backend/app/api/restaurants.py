from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from backend.app.schemas.schemas import RestaurantItem
from backend.app.services import olap_service
from backend.app.database import execute_query

router = APIRouter(tags=["Restaurant Analytics"])

@router.get("/restaurants/top", response_model=List[RestaurantItem])
def get_top_restaurants(
    limit: int = Query(10, ge=1, le=100, description="Max restaurants to return"),
    city: Optional[str] = Query(None, description="Filter by city name substring"),
    cuisine: Optional[str] = Query(None, description="Filter by primary cuisine substring"),
    sort_by: str = Query("revenue", pattern="^(revenue|rating|orders)$", description="Sort by revenue, rating, or orders")
):
    """Retrieves ranked top restaurants with flexible dimensional filtering."""
    return olap_service.get_top_restaurants(limit=limit, city=city, cuisine=cuisine, sort_by=sort_by)

@router.get("/restaurants/{restaurant_id}", response_model=RestaurantItem)
def get_restaurant_detail(restaurant_id: int):
    """Retrieves full metrics and profile for a specific restaurant."""
    query = """
    SELECT * FROM vw_top_restaurants
    WHERE restaurant_id = %s
    LIMIT 1;
    """
    res = execute_query(query, (restaurant_id,), fetch="one")
    if not res:
        raise HTTPException(status_code=404, detail=f"Restaurant with ID {restaurant_id} not found.")
    return res
