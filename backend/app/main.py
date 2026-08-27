from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.api.overview import router as overview_router
from backend.app.api.cuisines import router as cuisines_router
from backend.app.api.restaurants import router as restaurants_router
from backend.app.api.customers import router as customers_router
from backend.app.api.mining import router as mining_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle event handler for FastAPI startup and shutdown."""
    print("=" * 60)
    print("Starting Zomato Data Warehouse & ML Analytics API")
    print(f"PostgreSQL Database: {settings.POSTGRES_DB} on {settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}")
    print(f"ML Artifacts Directory: {settings.ML_ARTIFACTS_DIR}")
    print("=" * 60)
    yield
    print("Shutting down Zomato Analytics API...")

app = FastAPI(
    title="Zomato DWDM Capstone Analytics API",
    description=(
        "Production RESTful API serving Data Warehouse OLAP cubes, Customer Segmentation (K-Means), "
        "Leak-Free Churn Prediction (Random Forest), Market Basket Analysis (FP-Growth), "
        "and Explainable Restaurant Recommendations."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for Frontend Integration (React + Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(overview_router, prefix="/api")
app.include_router(cuisines_router, prefix="/api")
app.include_router(restaurants_router, prefix="/api")
app.include_router(customers_router, prefix="/api")
app.include_router(mining_router, prefix="/api")

@app.get("/")
def root():
    return {
        "project": "Designing a Data Warehouse System for Food Delivery Customer Behavior, Churn Prediction and Restaurant Recommendation",
        "status": "online",
        "docs_url": "/docs",
        "openapi_url": "/openapi.json",
        "health_check": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=settings.BACKEND_RELOAD
    )
