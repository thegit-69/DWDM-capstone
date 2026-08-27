import sys
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "docs_url" in data

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert data["models_loaded"] is True

def test_executive_overview_endpoint():
    response = client.get("/api/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["total_valid_orders"] > 100000
    assert data["total_revenue"] > 100000000
    assert data["active_customers"] > 50000
    assert data["average_order_value"] > 0

def test_monthly_orders_trend_endpoint():
    response = client.get("/api/orders/trend")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 20
    assert "year_month" in data[0]
    assert "total_revenue" in data[0]

def test_monthly_orders_trend_filtered():
    response = client.get("/api/orders/trend?year=2019&city=Bangalore")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_cuisines_endpoint():
    response = client.get("/api/cuisines?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 10
    assert "primary_cuisine" in data[0]
    assert "revenue_share_pct" in data[0]

def test_cities_endpoint():
    response = client.get("/api/cities?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 10
    assert "city" in data[0]
    assert "market_tier" in data[0]

def test_top_restaurants_endpoint():
    response = client.get("/api/restaurants/top?limit=5&sort_by=revenue")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5
    assert "restaurant_name" in data[0]
    assert "total_revenue" in data[0]

def test_customer_segments_endpoint():
    response = client.get("/api/customers/segments")
    assert response.status_code == 200
    data = response.json()
    assert data["n_clusters"] == 4
    assert "cluster_stats" in data
    assert len(data["scatter_points"]) > 0

def test_customer_churn_endpoint():
    response = client.get("/api/customers/churn")
    assert response.status_code == 200
    data = response.json()
    assert data["model"] == "RandomForestClassifier"
    assert "metrics" in data
    assert "baseline_comparisons" in data
    assert "feature_importances" in data
    assert "risk_tiers" in data

def test_customer_profile_endpoint():
    response = client.get("/api/customers/1")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == 1
    assert "segment" in data
    assert "churn_probability" in data
    assert "preferred_cuisines" in data

def test_association_rules_endpoint():
    response = client.get("/api/association-rules?min_lift=1.2&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert "rule_str" in data[0]
    assert "lift" in data[0]
    assert data[0]["lift"] >= 1.2

def test_recommendations_endpoint():
    response = client.get("/api/recommendations/1?top_n=3")
    assert response.status_code == 200
    data = response.json()
    assert "customer" in data
    assert data["customer"]["user_id"] == 1
    assert len(data["recommendations"]) == 3
    assert "explanation" in data["recommendations"][0]
    assert "match_score_pct" in data["recommendations"][0]

def test_olap_rollup_endpoint():
    response = client.get("/api/olap/rollup")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 30

def test_olap_drilldown_endpoint():
    response = client.get("/api/olap/drilldown?year=2019&month=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert "full_date" in data[0]

def test_olap_slice_endpoint():
    response = client.get("/api/olap/slice?city=Bangalore")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
