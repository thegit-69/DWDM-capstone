import React, { useState, useEffect } from "react";
import { 
  BarChart2, TrendingUp, PieChart as PieIcon, ScatterChart as ScatterIcon, 
  Activity, Layers, Calendar, Filter, AlertCircle, RefreshCw 
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, 
  ZAxis, Tooltip, CartesianGrid, Legend, Cell 
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { api } from "../lib/api";

export function VisualAnalyticsStudio() {
  const [trends, setTrends] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [cities, setCities] = useState([]);
  const [segments, setSegments] = useState(null);
  const [churnData, setChurnData] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Toggle state
  const [trendMetric, setTrendMetric] = useState("revenue"); // "revenue" | "orders"

  const loadAllVisuals = async () => {
    try {
      setLoading(true);
      setError(null);
      const [trendRes, cuiRes, cityRes, segRes, churnRes, dailyRes] = await Promise.all([
        api.getOrderTrends({ year: undefined }),
        api.getCuisines(10),
        api.getCities(10),
        api.getCustomerSegments(),
        api.getCustomerChurn(),
        api.getOlapDrilldown(2019, 5)
      ]);
      setTrends(trendRes);
      setCuisines(cuiRes);
      setCities(cityRes);
      setSegments(segRes);
      setChurnData(churnRes);
      setDailyData(dailyRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllVisuals();
  }, []);

  const formatINR = (val) => {
    if (!val) return "Rs. 0";
    if (val >= 10000000) return `Rs. ${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `Rs. ${(val / 100000).toFixed(2)} L`;
    return `Rs. ${Number(val).toLocaleString("en-IN")}`;
  };

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle />
        <AlertTitle>Failed to load Visual Analytics Studio</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-black">Visual Analytics Studio</h1>
            <Badge variant="outline" className="font-mono text-xs">All DWDM Visualizations</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Complete visual representation of Data Warehouse time series, customer clusters, churn predictors, and OLAP cubes.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAllVisuals} disabled={loading} className="h-8 text-xs font-medium">
          <RefreshCw className={`size-3 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh Charts
        </Button>
      </div>

      {/* GRAPH 1 & 2: TEMPORAL REVENUE & ORDERS + CUISINE MARKET SHARE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Monthly Trends */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-zinc-900">
                  1. Monthly Time Series Velocity (2017 - 2020)
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  Gross Revenue (INR) & Order Volume across 33 continuous months
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded border border-zinc-200">
                <button
                  onClick={() => setTrendMetric("revenue")}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                    trendMetric === "revenue" ? "bg-white text-black shadow-xs font-semibold" : "text-zinc-500"
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setTrendMetric("orders")}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded ${
                    trendMetric === "orders" ? "bg-white text-black shadow-xs font-semibold" : "text-zinc-500"
                  }`}
                >
                  Orders
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {trendMetric === "revenue" ? (
                    <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="visRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#000000" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#000000" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="year_month" stroke="#888888" fontSize={9} tickLine={false} interval={3} />
                      <YAxis stroke="#888888" fontSize={9} tickLine={false} tickFormatter={(v) => `Rs. ${(v / 1000000).toFixed(0)}M`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e4e4e7", fontSize: "11px" }}
                        formatter={(val) => [formatINR(val), "Revenue"]}
                      />
                      <Area type="monotone" dataKey="total_revenue" stroke="#000000" strokeWidth={2} fill="url(#visRevenue)" />
                    </AreaChart>
                  ) : (
                    <BarChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="year_month" stroke="#888888" fontSize={9} tickLine={false} interval={3} />
                      <YAxis stroke="#888888" fontSize={9} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e4e4e7", fontSize: "11px" }}
                        formatter={(val) => [val.toLocaleString(), "Orders"]}
                      />
                      <Bar dataKey="total_orders" fill="#18181b" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Graph 2: Top Cuisines Market Share */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-900">
              2. Cuisine Revenue Volume & Market Share
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              North Indian, Chinese, and Indian hold over 38% total delivery market share
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={cuisines.slice(0, 7)}
                    margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" stroke="#888888" fontSize={9} tickFormatter={(v) => `Rs. ${(v / 10000000).toFixed(0)}Cr`} />
                    <YAxis type="category" dataKey="primary_cuisine" stroke="#888888" fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e4e4e7", fontSize: "11px" }}
                      formatter={(val, name, props) => [
                        `${formatINR(val)} (${props.payload.revenue_share_pct}%)`,
                        "Revenue Share"
                      ]}
                    />
                    <Bar dataKey="total_revenue" fill="#000000" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* GRAPH 3 & 4: K-MEANS SCATTER & ELBOW/SILHOUETTE CURVES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 3: 2D RFM Customer Cluster Scatter Plot */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-zinc-900">
                  3. K-Means Customer RFM Clusters
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  Order Frequency (X-Axis) vs Monetary Spend in INR (Y-Axis)
                </CardDescription>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px]">
                k=4 Clusters
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading || !segments ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" dataKey="frequency" name="Orders" stroke="#888888" fontSize={9} />
                    <YAxis
                      type="number"
                      dataKey="monetary"
                      name="Spend"
                      stroke="#888888"
                      fontSize={9}
                      tickFormatter={(v) => `Rs. ${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-white border border-zinc-200 p-2 rounded shadow-xs text-xs">
                              <div className="font-semibold text-black">{d.name} (#{d.user_id})</div>
                              <div className="text-zinc-500">{d.segment}</div>
                              <div>Spend: <span className="font-mono font-semibold">Rs. {d.monetary.toLocaleString()}</span> ({d.frequency} orders)</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter name="Customers" data={segments.scatter_points} fill="#000000" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Graph 4: Elbow Inertia & Silhouette Curves */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-900">
              4. Optimal K Evaluation (Elbow Inertia Curve)
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Within-Cluster Sum of Squares (Inertia) minimizing across k = 2..6
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !segments ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={segments.evaluation} margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="k" stroke="#888888" fontSize={9} label={{ value: "Number of Clusters (K)", position: "insideBottom", offset: -2, fontSize: 10 }} />
                    <YAxis stroke="#888888" fontSize={9} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e4e4e7", fontSize: "11px" }}
                      formatter={(val, name) => [
                        name === "inertia" ? Number(val).toLocaleString() : val,
                        name === "inertia" ? "Inertia (WCSS)" : "Silhouette Score"
                      ]}
                    />
                    <Line type="monotone" dataKey="inertia" stroke="#000000" strokeWidth={2} dot={{ r: 4, fill: "#000000" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* GRAPH 5 & 6: CHURN FEATURE IMPORTANCE & DAILY DRILL-DOWN VELOCITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 5: Random Forest Gini Feature Importance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-900">
              5. Random Forest Churn Gini Feature Importance
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Relative predictive contribution of leak-free historical behavioral metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !churnData ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={churnData.feature_importances.slice(0, 7)}
                    margin={{ top: 5, right: 20, left: 75, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" stroke="#888888" fontSize={9} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <YAxis type="category" dataKey="feature" stroke="#888888" fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e4e4e7", fontSize: "11px" }}
                      formatter={(val) => [`${(val * 100).toFixed(2)}%`, "Gini Importance"]}
                    />
                    <Bar dataKey="importance" fill="#27272a" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Graph 6: Daily Drilldown Order Velocity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-900">
              6. OLAP Daily Drill-Down Velocity (May 2019)
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Day-by-day transaction volume highlighting weekday vs weekend shifts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="day" stroke="#888888" fontSize={9} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e4e4e7", fontSize: "11px" }}
                      formatter={(val, name, props) => [
                        `${val} orders (${formatINR(props.payload.daily_revenue)})`,
                        `${props.payload.day_name}`
                      ]}
                      labelFormatter={(label) => `May ${label}, 2019`}
                    />
                    <Bar dataKey="daily_orders" fill="#09090b" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* GRAPH 7 & 8: CITY REVENUE COMPARISON & CHURN RISK TIERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 7: Top Cities Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-900">
              7. Geographic City Revenue & Market Tier Comparison
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Revenue distribution across Tier-1 metros and emerging Tier-2 hubs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={cities.slice(0, 7)}
                    margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" stroke="#888888" fontSize={9} tickFormatter={(v) => `Rs. ${(v / 10000000).toFixed(0)}Cr`} />
                    <YAxis type="category" dataKey="city" stroke="#888888" fontSize={9} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e4e4e7", fontSize: "11px" }}
                      formatter={(val, name, props) => [
                        `${formatINR(val)} (${props.payload.market_tier})`,
                        "Revenue"
                      ]}
                    />
                    <Bar dataKey="total_revenue" fill="#18181b" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Graph 8: Churn Risk Tiers Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-900">
              8. Customer Churn Risk Tier Distribution
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              100,000 customers segmented by temporal predicted churn probability
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !churnData ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 flex flex-col justify-center gap-4 p-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-red-600">
                      <span className="size-2 rounded-full bg-red-600" /> High Risk (≥ 70% Prob)
                    </span>
                    <span className="font-mono text-zinc-900 font-bold">
                      {churnData.risk_tiers.high_risk.toLocaleString()} ({((churnData.risk_tiers.high_risk / 100000) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-600"
                      style={{ width: `${(churnData.risk_tiers.high_risk / 100000) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-amber-600">
                      <span className="size-2 rounded-full bg-amber-600" /> Medium Risk (40% - 70%)
                    </span>
                    <span className="font-mono text-zinc-900 font-bold">
                      {churnData.risk_tiers.medium_risk.toLocaleString()} ({((churnData.risk_tiers.medium_risk / 100000) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-600"
                      style={{ width: `${(churnData.risk_tiers.medium_risk / 100000) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <span className="size-2 rounded-full bg-emerald-600" /> Low Risk (&lt; 40%)
                    </span>
                    <span className="font-mono text-zinc-900 font-bold">
                      {churnData.risk_tiers.low_risk.toLocaleString()} ({((churnData.risk_tiers.low_risk / 100000) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600"
                      style={{ width: `${(churnData.risk_tiers.low_risk / 100000) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
