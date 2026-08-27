from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from backend.app.schemas.schemas import ExecutiveKPIs, MonthlyTrendItem, HealthResponse
from backend.app.services import olap_service
from backend.app.config import settings

router = APIRouter(tags=["Overview & System Health"])

@router.get("/health", response_model=HealthResponse)
def get_system_health():
    """Returns database connectivity and ML artifact loading status."""
    try:
        kpis = olap_service.get_executive_kpis()
        db_status = "Connected (PostgreSQL zomato_dw)" if kpis else "Disconnected"
    except Exception as e:
        db_status = f"Error: {str(e)}"

    artifacts_exist = (
        (settings.ML_ARTIFACTS_DIR / "kmeans_model.pkl").exists() and
        (settings.ML_ARTIFACTS_DIR / "churn_model.pkl").exists() and
        (settings.ML_ARTIFACTS_DIR / "association_rules.json").exists()
    )

    return HealthResponse(
        status="healthy" if "Connected" in db_status else "degraded",
        database=db_status,
        timestamp=datetime.now().isoformat(),
        models_loaded=artifacts_exist
    )

@router.get("/overview", response_model=ExecutiveKPIs)
def get_executive_overview():
    """Retrieves high-level summary KPIs from vw_executive_kpis."""
    kpis = olap_service.get_executive_kpis()
    if not kpis:
        raise HTTPException(status_code=500, detail="Unable to retrieve executive KPIs.")
    return kpis

@router.get("/orders/trend", response_model=List[MonthlyTrendItem])
def get_monthly_order_trends(
    year: Optional[int] = Query(None, description="Filter by year (e.g. 2018, 2019)"),
    city: Optional[str] = Query(None, description="Filter by city name substring"),
    cuisine: Optional[str] = Query(None, description="Filter by primary cuisine")
):
    """Retrieves monthly order and revenue time series with optional dimensional filters."""
    return olap_service.get_monthly_trends(year=year, city=city, cuisine=cuisine)
