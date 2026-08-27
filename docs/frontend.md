# Frontend Analytics Platform Documentation

> **Project:** Designing a Data Warehouse System for Food Delivery Customer Behavior, Churn Prediction and Restaurant Recommendation  
> **Tech Stack:** React 19 (JavaScript) + Vite + Tailwind CSS v4 + shadcn/ui + Recharts + Lucide Icons  
> **Aesthetic Direction:** Vercel-inspired minimal monochrome light theme (`#ffffff`, `#000000`, `#fafafa` background, `#eaeaea` borders, `Geist/Inter` typography).  
> **Backend Integration:** Live connection to FastAPI at `http://127.0.0.1:8000`.

---

## 1. Layout & Side Navigation Architecture

The frontend uses a persistent Vercel-style sidebar navigation (`w-64`) on the left paired with a responsive main content area on the right:

```
+----------------------------------------------------------------------------------------------------+
|  [ZW] ZOMATO DATA WAREHOUSE                  |  DWDM Platform > Executive Overview  | [API Docs]   |
+----------------------------------------------+-----------------------------------------------------+
|  BUSINESS INTELLIGENCE                       |                                                     |
|  - [Icon] Executive Overview          [KPIs] |  [ Total Revenue ]  [ Valid Orders ]  [ AOV ]       |
|  - [Icon] Restaurant & Food       [Cuisines] |  Rs. 986.56 Cr      148,670           Rs. 6,635.94  |
|  - [Icon] OLAP Operations             [Cube] |                                                     |
|                                              |  +-----------------------------------------------+  |
|  DATA MINING & ML                            |  | Monthly Revenue & Order Velocity Area Chart   |  |
|  - [Icon] Customer Intel     [K-Means/Churn] |  | (Interactive filters for Year/City/Cuisine)   |  |
|  - [Icon] Mining & Recommender  [FP-Growth]  |  +-----------------------------------------------+  |
|  - [Icon] Visual Analytics     [All Charts]  |                                                     |
|                                              |                                                     |
|  ------------------------------------------  |                                                     |
|  🟢 PostgreSQL Live (127.0.0.1:8000)         |                                                     |
+----------------------------------------------+-----------------------------------------------------+
```

---

## 2. Views & Visualization Inventory

| Route / View | Purpose & Core Capabilities | Visualizations Included |
| :--- | :--- | :--- |
| **Executive Overview** | High-level data warehouse summary across 150k orders, 100k users, and 148k restaurants. | Metric Cards, Monthly Revenue AreaChart, Order Volume BarChart with Year/City/Cuisine filters. |
| **Customer Intelligence** | Multidimensional customer behavioral intelligence & churn prediction. | K-Means 4 Cluster stats, 2D RFM ScatterPlot, Elbow Curve, Churn Confusion Matrix, Feature Importance BarChart, Customer RFM Inspector. |
| **Restaurant & Food** | Partner performance & cuisine market analytics. | Horizontal Cuisine Revenue BarChart, Market Share Table, City & Tier Ranking, Partner Leaderboard. |
| **Mining & Recommender** | Association rule mining and personalized explainable restaurant matching. | FP-Growth Association Rules Table with Lift Multipliers, Hybrid Recommendation Simulator with Human-Readable Explanation Pills. |
| **OLAP Operations** | Interactive multidimensional cube queries executed directly on PostgreSQL. | Live Roll-up (Hierarchy Tree), Drill-down (Daily velocity), Slice (Single-city), and Dice (Sub-cube). |
| **Visual Analytics Studio** | Dedicated studio gathering all 8 DWDM capstone charts together. | 1. Monthly Trends (Revenue/Orders)<br>2. Cuisine Market Share<br>3. K-Means RFM Scatter<br>4. Elbow Inertia Curve<br>5. Churn Feature Importance<br>6. Daily Drill-down Velocity<br>7. City Revenue by Tier<br>8. Churn Risk Tiers Progress |

---

## 3. Connecting Frontend and Backend Locally

1. **Start Backend Server:**
   ```powershell
   .\.venv\Scripts\uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
   ```
2. **Start Frontend Dev Server:**
   ```powershell
   cd frontend
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser. The sidebar will display a live green status indicator confirming connectivity to PostgreSQL `zomato_dw`.
