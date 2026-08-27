from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# ============================================================================
# EXECUTIVE & OVERVIEW SCHEMAS
# ============================================================================

class ExecutiveKPIs(BaseModel):
    total_valid_orders: int
    total_refund_orders: int
    total_transactions: int
    total_revenue: float
    average_order_value: float
    active_customers: int
    total_registered_customers: int
    active_restaurants: int
    total_restaurants: int
    average_restaurant_rating: float

class MonthlyTrendItem(BaseModel):
    year: int
    month: int
    month_name: str
    quarter_name: str
    year_month: str
    total_orders: int
    total_revenue: float
    aov: float
    active_users: int
    active_restaurants: Optional[int] = None

class HealthResponse(BaseModel):
    status: str
    database: str
    timestamp: str
    models_loaded: bool

# ============================================================================
# CUISINE & CITY SCHEMAS
# ============================================================================

class CuisineItem(BaseModel):
    primary_cuisine: str
    total_orders: int
    total_revenue: float
    revenue_share_pct: float
    aov: float
    avg_rating: Optional[float] = None
    avg_cost_for_two: Optional[float] = None
    restaurant_count: int

class CityItem(BaseModel):
    location_sk: int
    city: str
    market_tier: str
    total_orders: int
    total_revenue: float
    aov: float
    unique_customers: int
    active_restaurants: int

# ============================================================================
# RESTAURANT SCHEMAS
# ============================================================================

class RestaurantItem(BaseModel):
    restaurant_sk: int
    restaurant_id: int
    restaurant_name: str
    city: str
    market_tier: str
    primary_cuisine: Optional[str] = "General"
    rating: float
    rating_category: Optional[str] = "Unrated"
    rating_count: int
    cost_for_two: float
    cost_tier: Optional[str] = "Budget"
    total_orders: int
    total_revenue: float
    aov: float

# ============================================================================
# CUSTOMER INTELLIGENCE SCHEMAS (CLUSTERING & CHURN)
# ============================================================================

class ClusterStats(BaseModel):
    count: int
    pct: float
    avg_frequency: float
    avg_monetary: float
    avg_aov: float
    avg_recency: float
    avg_age: float

class CustomerSegmentsResponse(BaseModel):
    n_clusters: int
    features: List[str]
    cluster_labels: Dict[str, str]
    evaluation: List[Dict[str, Any]]
    cluster_stats: Dict[str, ClusterStats]
    scatter_points: List[Dict[str, Any]]

class ChurnMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: float
    confusion_matrix: Dict[str, int]

class ChurnResponse(BaseModel):
    model: str
    historical_cutoff_date: str
    feature_window: str
    prediction_window: str
    target_definition: str
    cohort_size: int
    train_size: int
    test_size: int
    class_distribution: Dict[str, Any]
    target_leakage_audit: str
    metrics: ChurnMetrics
    baseline_comparisons: Dict[str, Any]
    feature_importances: List[Dict[str, Any]]
    risk_tiers: Dict[str, int]

class CustomerProfile(BaseModel):
    user_id: int
    name: str
    age: int
    gender: str
    occupation: str
    segment: Optional[str] = None
    churn_probability: Optional[float] = None
    is_churned: Optional[bool] = None
    total_orders: int
    total_spend: float
    avg_order_value: float
    preferred_city: str
    preferred_cuisines: List[str]

# ============================================================================
# DATA MINING & RECOMMENDATION SCHEMAS
# ============================================================================

class AssociationRule(BaseModel):
    antecedents: List[str]
    consequents: List[str]
    antecedent_str: str
    consequent_str: str
    rule_str: str
    support: float
    confidence: float
    lift: float
    leverage: Optional[float] = 0.0
    type: str

class RecommendedRestaurant(BaseModel):
    restaurant_id: int
    name: str
    city: str
    primary_cuisine: str
    all_cuisines: str
    rating: float
    rating_count: int
    cost_for_two: float
    cost_tier: str
    match_score_pct: float
    explanation: str
    reasons: List[str]

class RecommendationResponse(BaseModel):
    customer: Optional[CustomerProfile] = None
    target_city: str
    recommendations: List[RecommendedRestaurant]
    message: Optional[str] = None
