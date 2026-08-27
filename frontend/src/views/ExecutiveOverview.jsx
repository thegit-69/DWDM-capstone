import React, { useState, useEffect } from "react";
import { 
  DollarSign, ShoppingCart, Users, Store, Star, TrendingUp, 
  Filter, RotateCcw, AlertCircle, Calendar, MapPin, UtensilsCrossed 
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { api } from "../lib/api";

export function ExecutiveOverview() {
  const [kpis, setKpis] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [selectedYear, setSelectedYear] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [kpiRes, trendRes] = await Promise.all([
        api.getOverview(),
        api.getOrderTrends({
          year: selectedYear ? parseInt(selectedYear) : undefined,
          city: cityFilter || undefined,
          cuisine: cuisineFilter || undefined
        })
      ]);
      setKpis(kpiRes);
      setTrends(trendRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleResetFilter = () => {
    setSelectedYear("");
    setCityFilter("");
    setCuisineFilter("");
    setTimeout(fetchData, 10);
  };

  const formatINR = (val) => {
    if (!val) return "Rs. 0";
    if (val >= 10000000) return `Rs. ${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `Rs. ${(val / 100000).toFixed(2)} Lakh`;
    return `Rs. ${Number(val).toLocaleString("en-IN")}`;
  };

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle />
        <AlertTitle>Failed to load Executive Overview</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-black">Executive Overview</h1>
            <Badge variant="outline" className="font-mono text-xs">
              PostgreSQL Star Schema
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Data Warehouse summary across 150,281 orders, 100,000 customers, and 148,542 restaurants.
          </p>
        </div>

        {/* Global Filter Bar */}
        <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-md px-2.5 py-1">
            <Calendar className="size-3.5 text-zinc-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-xs text-zinc-800 outline-none cursor-pointer"
            >
              <option value="">All Years (2017-2020)</option>
              <option value="2017">2017</option>
              <option value="2018">2018</option>
              <option value="2019">2019</option>
              <option value="2020">2020</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-md px-2.5 py-1">
            <MapPin className="size-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter City..."
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="bg-transparent text-xs text-zinc-800 outline-none w-28"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-md px-2.5 py-1">
            <UtensilsCrossed className="size-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter Cuisine..."
              value={cuisineFilter}
              onChange={(e) => setCuisineFilter(e.target.value)}
              className="bg-transparent text-xs text-zinc-800 outline-none w-28"
            />
          </div>

          <Button type="submit" size="sm" className="h-8 text-xs font-medium">
            <Filter className="size-3.5 mr-1" /> Apply
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleResetFilter} className="h-8 text-xs">
            <RotateCcw className="size-3.5" />
          </Button>
        </form>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {loading || !kpis ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-7 w-28" />
            </Card>
          ))
        ) : (
          <>
            <Card className="hover:border-zinc-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-zinc-500 text-xs font-medium mb-1">
                  <span>Total Revenue</span>
                  <DollarSign className="size-3.5 text-zinc-400" />
                </div>
                <div className="text-lg font-bold text-black font-mono-numbers">
                  {formatINR(kpis.total_revenue)}
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">Gross valid sales</div>
              </CardContent>
            </Card>

            <Card className="hover:border-zinc-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-zinc-500 text-xs font-medium mb-1">
                  <span>Valid Orders</span>
                  <ShoppingCart className="size-3.5 text-zinc-400" />
                </div>
                <div className="text-lg font-bold text-black font-mono-numbers">
                  {Number(kpis.total_valid_orders).toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">
                  {kpis.total_refund_orders.toLocaleString()} refunded
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-zinc-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-zinc-500 text-xs font-medium mb-1">
                  <span>Avg Order Value</span>
                  <TrendingUp className="size-3.5 text-zinc-400" />
                </div>
                <div className="text-lg font-bold text-black font-mono-numbers">
                  Rs. {Number(kpis.average_order_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">Per transaction average</div>
              </CardContent>
            </Card>

            <Card className="hover:border-zinc-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-zinc-500 text-xs font-medium mb-1">
                  <span>Active Customers</span>
                  <Users className="size-3.5 text-zinc-400" />
                </div>
                <div className="text-lg font-bold text-black font-mono-numbers">
                  {Number(kpis.active_customers).toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">
                  {( (kpis.active_customers / kpis.total_registered_customers) * 100 ).toFixed(1)}% of registered
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-zinc-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-zinc-500 text-xs font-medium mb-1">
                  <span>Restaurants</span>
                  <Store className="size-3.5 text-zinc-400" />
                </div>
                <div className="text-lg font-bold text-black font-mono-numbers">
                  {Number(kpis.active_restaurants).toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">Across 822 cities</div>
              </CardContent>
            </Card>

            <Card className="hover:border-zinc-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-zinc-500 text-xs font-medium mb-1">
                  <span>Avg Rating</span>
                  <Star className="size-3.5 text-amber-500 fill-amber-500" />
                </div>
                <div className="text-lg font-bold text-black font-mono-numbers">
                  {kpis.average_restaurant_rating.toFixed(2)} / 5.0
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">Customer rated</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Velocity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-zinc-900">
                  Monthly Revenue & Order Velocity
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  Historical monthly transaction volume and gross spend time series
                </CardDescription>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {trends.length} Data Points
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : trends.length === 0 ? (
              <div className="h-72 flex items-center justify-center text-zinc-400 text-xs">
                No time series data matching selected filters.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#000000" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#000000" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="year_month"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                      tickFormatter={(v) => `Rs. ${(v / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e4e4e7",
                        borderRadius: "6px",
                        fontSize: "11px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                      }}
                      formatter={(val, name) => [
                        name === "total_revenue" ? formatINR(val) : val.toLocaleString(),
                        name === "total_revenue" ? "Revenue" : "Orders"
                      ]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="total_revenue"
                      name="total_revenue"
                      stroke="#000000"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Orders Bar Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-900">
              Monthly Order Volume
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Count of valid orders per calendar month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="year_month"
                      stroke="#888888"
                      fontSize={9}
                      tickLine={false}
                      interval={3}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderColor: "#e4e4e7",
                        borderRadius: "6px",
                        fontSize: "11px"
                      }}
                      formatter={(val) => [val.toLocaleString(), "Orders"]}
                    />
                    <Bar dataKey="total_orders" fill="#18181b" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Star Schema Dimensional Metadata Callout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3.5 rounded-lg border border-zinc-200 bg-white">
          <div className="text-xs font-semibold text-black">Fact Grain</div>
          <div className="text-xs text-zinc-500 mt-1">
            Each row in <code className="text-zinc-800 bg-zinc-100 px-1 py-0.5 rounded">fact_orders</code> represents 1 completed food delivery transaction linked via surrogate keys.
          </div>
        </div>
        <div className="p-3.5 rounded-lg border border-zinc-200 bg-white">
          <div className="text-xs font-semibold text-black">Temporal Coverage</div>
          <div className="text-xs text-zinc-500 mt-1">
            2,192 pre-populated calendar dates (2017-01-01 to 2022-12-31) in <code className="text-zinc-800 bg-zinc-100 px-1 py-0.5 rounded">dim_date</code> for seamless multi-year aggregations.
          </div>
        </div>
        <div className="p-3.5 rounded-lg border border-zinc-200 bg-white">
          <div className="text-xs font-semibold text-black">Academic OLAP</div>
          <div className="text-xs text-zinc-500 mt-1">
            Supports Roll-up, Drill-down, Slice, Dice, and Pivot directly evaluated on PostgreSQL relational tables.
          </div>
        </div>
      </div>
    </div>
  );
}
