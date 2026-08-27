import sys
import time
import json
import psycopg2

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from backend.app.config import settings
from backend.app.database import execute_query
from backend.app.services import olap_service

def deploy_views():
    print("Deploying analytical SQL views to PostgreSQL...")
    conn = psycopg2.connect(**settings.PSYCOPG2_CONN_DICT)
    conn.autocommit = True
    cur = conn.cursor()

    views_file = settings.SQL_SCRIPTS_DIR / "views.sql"
    with open(views_file, "r", encoding="utf-8") as f:
        cur.execute(f.read())

    cur.close()
    conn.close()
    print("[OK] SQL views deployed successfully.")

def test_olap_suite():
    deploy_views()

    print("\n" + "=" * 70)
    print("RUNNING OLAP ANALYTICAL OPERATIONS & QUERY BENCHMARKS")
    print("=" * 70)

    # 1. Executive KPIs
    t0 = time.time()
    kpis = olap_service.get_executive_kpis()
    t_kpis = (time.time() - t0) * 1000
    print(f"\n1. EXECUTIVE SUMMARY KPIS ({t_kpis:.2f} ms):")
    print(f"   - Total Valid Orders      : {kpis.get('total_valid_orders'):,}")
    print(f"   - Total Revenue (INR)     : Rs. {kpis.get('total_revenue'):,.2f}")
    print(f"   - Average Order Value     : Rs. {kpis.get('average_order_value'):,.2f}")
    print(f"   - Active Customers        : {kpis.get('active_customers'):,} / {kpis.get('total_registered_customers'):,} registered")
    print(f"   - Active Restaurants      : {kpis.get('active_restaurants'):,} / {kpis.get('total_restaurants'):,} total")
    print(f"   - Average Rating          : {kpis.get('average_restaurant_rating')} / 5.0")

    # 2. Roll-up
    t0 = time.time()
    rollup = olap_service.get_rollup_hierarchy()
    t_rollup = (time.time() - t0) * 1000
    print(f"\n2. ROLL-UP OLAP OPERATION ({t_rollup:.2f} ms):")
    print(f"   Returned {len(rollup)} aggregate hierarchy rows (Year -> Quarter -> Month).")
    for r in rollup[:6]:
        yr = str(r.get('year') or "ALL YEARS")
        qtr = str(r.get('quarter_name') or "ALL QTRS")
        mo = str(r.get('month_name') or "ALL MONTHS")
        rev = float(r.get('total_revenue') or 0)
        ords = int(r.get('total_orders') or 0)
        print(f"   [{yr:10s} | {qtr:8s} | {mo:12s}] -> Orders: {ords:6,d} | Revenue: Rs. {rev:12,.2f}")

    # 3. Drill-Down
    t0 = time.time()
    drilldown = olap_service.get_drilldown_daily(2019, 5)
    t_drill = (time.time() - t0) * 1000
    print(f"\n3. DRILL-DOWN OLAP OPERATION (May 2019 Daily) ({t_drill:.2f} ms):")
    print(f"   Returned {len(drilldown)} daily velocity rows.")
    for d in drilldown[:3]:
        full_d = str(d.get('full_date'))
        day_n = str(d.get('day_name'))
        d_ord = int(d.get('daily_orders') or 0)
        d_rev = float(d.get('daily_revenue') or 0)
        print(f"   {full_d} ({day_n:9s}) -> Orders: {d_ord:4d} | Revenue: Rs. {d_rev:,.2f}")

    # 4. Slice
    t0 = time.time()
    slice_bng = olap_service.get_slice_city("bangalore")
    t_slice = (time.time() - t0) * 1000
    print(f"\n4. SLICE OLAP OPERATION (City = 'Bangalore') ({t_slice:.2f} ms):")
    for s in slice_bng[:4]:
        cuis = str(s.get('primary_cuisine') or "General")
        ords = int(s.get('total_orders') or 0)
        rev = float(s.get('total_revenue') or 0)
        print(f"   - Cuisine: {cuis:15s} | Orders: {ords:5,d} | Revenue: Rs. {rev:10,.2f}")

    # 5. Dice
    t0 = time.time()
    dice_sub = olap_service.get_dice_subcube(["bangalore", "delhi", "mumbai"], ["North Indian", "Chinese", "Biryani"], 2019)
    t_dice = (time.time() - t0) * 1000
    print(f"\n5. DICE OLAP OPERATION (3 Cities x 3 Cuisines in 2019) ({t_dice:.2f} ms):")
    print(f"   Subcube cells returned: {len(dice_sub)}")
    for dc in dice_sub[:4]:
        city_n = str(dc.get('city'))
        cuis_n = str(dc.get('primary_cuisine'))
        qtr_n = str(dc.get('quarter_name'))
        ord_c = int(dc.get('orders_count') or 0)
        rev_c = float(dc.get('total_revenue') or 0)
        print(f"   - {city_n:10s} | {cuis_n:12s} | {qtr_n} -> Orders: {ord_c} | Rev: Rs. {rev_c:,.2f}")

    # 6. Cuisine Analytics
    t0 = time.time()
    cuisines = olap_service.get_cuisine_analytics(5)
    t_cuis = (time.time() - t0) * 1000
    print(f"\n6. TOP CUISINES MARKET SHARE ({t_cuis:.2f} ms):")
    for c in cuisines:
        cuis_n = str(c.get('primary_cuisine'))
        rev_c = float(c.get('total_revenue') or 0)
        share = float(c.get('revenue_share_pct') or 0)
        print(f"   - {cuis_n:15s} | Revenue: Rs. {rev_c:12,.2f} ({share}% market share)")

    # 7. Top Restaurants
    t0 = time.time()
    top_rests = olap_service.get_top_restaurants(5)
    t_rests = (time.time() - t0) * 1000
    print(f"\n7. TOP 5 RESTAURANTS BY REVENUE ({t_rests:.2f} ms):")
    for r in top_rests:
        r_name = str(r.get('restaurant_name') or "")[:25]
        city_n = str(r.get('city') or "")
        rating = float(r.get('rating') or 0)
        rev = float(r.get('total_revenue') or 0)
        print(f"   - {r_name:25s} ({city_n:12s}) | Rating: {rating:.1f} | Rev: Rs. {rev:,.2f}")

    # 8. Customer RFM
    t0 = time.time()
    rfm_sample = execute_query("SELECT * FROM vw_customer_rfm LIMIT 3;", fetch="all")
    t_rfm = (time.time() - t0) * 1000
    print(f"\n8. CUSTOMER RFM PROFILE EXTRACTION ({t_rfm:.2f} ms):")
    for u in rfm_sample:
        u_id = int(u.get('user_id') or 0)
        u_name = str(u.get('name') or "")[:18]
        freq = int(u.get('frequency') or 0)
        mon = float(u.get('monetary') or 0)
        rec = int(u.get('recency_days') or 0)
        print(f"   - Customer {u_id:6d} ({u_name:18s}) | Freq: {freq} | Monetary: Rs. {mon:,.2f} | Recency: {rec} days")

    print("\n" + "=" * 70)
    print("[SUCCESS] ALL OLAP ANALYTICAL QUERIES EXECUTED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    test_olap_suite()
