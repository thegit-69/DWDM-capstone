import React, { useState, useEffect } from "react";
import { 
  UtensilsCrossed, MapPin, Store, Star, DollarSign, 
  TrendingUp, Search, Filter, RotateCcw, AlertCircle 
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid, Cell 
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/table";
import { Skeleton } from "../components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { api } from "../lib/api";

export function RestaurantAnalytics() {
  const [cuisines, setCuisines] = useState([]);
  const [cities, setCities] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Leaderboard filters
  const [filterCity, setFilterCity] = useState("");
  const [filterCuisine, setFilterCuisine] = useState("");
  const [sortBy, setSortBy] = useState("revenue");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cuiRes, cityRes, restRes] = await Promise.all([
          api.getCuisines(12),
          api.getCities(15),
          api.getTopRestaurants({ limit: 10, sort_by: "revenue" })
        ]);
        setCuisines(cuiRes);
        setCities(cityRes);
        setRestaurants(restRes);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleApplyFilter = async (e) => {
    if (e) e.preventDefault();
    try {
      setRestaurantsLoading(true);
      const res = await api.getTopRestaurants({
        limit: 15,
        city: filterCity || undefined,
        cuisine: filterCuisine || undefined,
        sort_by: sortBy
      });
      setRestaurants(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setRestaurantsLoading(false);
    }
  };

  const handleReset = () => {
    setFilterCity("");
    setFilterCuisine("");
    setSortBy("revenue");
    api.getTopRestaurants({ limit: 10, sort_by: "revenue" }).then(setRestaurants);
  };

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
        <AlertTitle>Failed to load Restaurant & Food Analytics</AlertTitle>
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
            <h1 className="text-xl font-bold tracking-tight text-black">Restaurant & Food Analytics</h1>
            <Badge variant="outline" className="font-mono text-xs">Cuisine Market Share & Leaderboards</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Analyzing 2,132 unique cuisines and 148,542 restaurant partners across India.
          </p>
        </div>
      </div>

      {/* SECTION 1: TOP CUISINES PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Horizontal Cuisine Revenue Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-900">
              Top Cuisines by Gross Revenue
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Ranked total sales volume in INR across all valid orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={cuisines.slice(0, 8)}
                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#888888"
                      fontSize={10}
                      tickFormatter={(v) => `Rs. ${(v / 10000000).toFixed(1)}Cr`}
                    />
                    <YAxis
                      type="category"
                      dataKey="primary_cuisine"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e4e4e7", fontSize: "11px" }}
                      formatter={(val) => [formatINR(val), "Revenue"]}
                    />
                    <Bar dataKey="total_revenue" fill="#000000" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cuisine Share Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-900">
              Cuisine Market Share & Metrics
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Share percentage, average order value, and partner counts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cuisine</TableHead>
                    <TableHead className="text-right">Share %</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">AOV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuisines.slice(0, 8).map((c) => (
                    <TableRow key={c.primary_cuisine}>
                      <TableCell className="font-medium text-xs text-black">
                        {c.primary_cuisine}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {c.revenue_share_pct}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-zinc-800">
                        {formatINR(c.total_revenue)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-zinc-500">
                        Rs. {Number(c.aov).toFixed(0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: TOP RESTAURANT LEADERBOARD */}
      <div className="flex flex-col gap-4 border-t border-zinc-200 pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              Top Restaurant Partner Leaderboard
            </h2>
            <p className="text-xs text-zinc-500">
              Filterable rankings across 148,542 restaurant branches.
            </p>
          </div>

          {/* Filter Bar */}
          <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-md px-2.5 py-1">
              <MapPin className="size-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="City (e.g. Bangalore)..."
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="bg-transparent text-xs text-zinc-800 outline-none w-32"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-md px-2.5 py-1">
              <UtensilsCrossed className="size-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Cuisine..."
                value={filterCuisine}
                onChange={(e) => setFilterCuisine(e.target.value)}
                className="bg-transparent text-xs text-zinc-800 outline-none w-28"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setTimeout(handleApplyFilter, 10);
              }}
              className="bg-white border border-zinc-200 rounded-md px-2.5 py-1.5 text-xs text-zinc-800 outline-none cursor-pointer"
            >
              <option value="revenue">Sort by Revenue</option>
              <option value="rating">Sort by Rating</option>
              <option value="orders">Sort by Orders</option>
            </select>

            <Button type="submit" size="sm" className="h-8 text-xs font-medium">
              <Filter className="size-3.5 mr-1" /> Filter
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs">
              <RotateCcw className="size-3.5" />
            </Button>
          </form>
        </div>

        {/* Leaderboard Table */}
        <Card>
          <CardContent className="p-0">
            {restaurantsLoading ? (
              <div className="p-6 flex flex-col gap-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : restaurants.length === 0 ? (
              <div className="p-12 text-center text-xs text-zinc-500">
                No restaurants found matching current filter criteria.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Restaurant Name</TableHead>
                    <TableHead>City & Tier</TableHead>
                    <TableHead>Primary Cuisine</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-right">Cost for Two</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restaurants.map((r, idx) => (
                    <TableRow key={r.restaurant_id || idx}>
                      <TableCell className="font-mono text-zinc-400 text-xs">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium text-xs text-black">
                        {r.restaurant_name}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-600">
                        <div className="flex items-center gap-1.5">
                          <span>{r.city}</span>
                          <Badge variant="outline" className="text-[9px] py-0 px-1">
                            {r.market_tier}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-600">
                        {r.primary_cuisine}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 text-xs font-semibold">
                          <Star className="size-3 text-amber-500 fill-amber-500" />
                          <span>{r.rating > 0 ? r.rating.toFixed(1) : "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-zinc-600">
                        Rs. {r.cost_for_two ? Number(r.cost_for_two).toFixed(0) : "250"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-zinc-700">
                        {r.total_orders.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold text-black">
                        {formatINR(r.total_revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
