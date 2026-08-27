import React, { useState, useEffect } from "react";
import { 
  Layers, ArrowUpRight, ArrowDownRight, Scissors, Grid, 
  RotateCw, Play, AlertCircle, Calendar, MapPin, UtensilsCrossed 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/table";
import { Skeleton } from "../components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { api } from "../lib/api";

export function OlapExplorer() {
  const [activeTab, setActiveTab] = useState("rollup");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Drilldown params
  const [drillYear, setDrillYear] = useState(2019);
  const [drillMonth, setDrillMonth] = useState(5);

  // Slice params
  const [sliceCity, setSliceCity] = useState("Bangalore");

  // Dice params
  const [diceYear, setDiceYear] = useState(2019);

  useEffect(() => {
    runOperation(activeTab);
  }, [activeTab]);

  const runOperation = async (op) => {
    try {
      setLoading(true);
      setError(null);
      let res = [];
      if (op === "rollup") {
        res = await api.getOlapRollup();
      } else if (op === "drilldown") {
        res = await api.getOlapDrilldown(drillYear, drillMonth);
      } else if (op === "slice") {
        res = await api.getOlapSlice(sliceCity);
      } else if (op === "dice") {
        res = await api.getOlapDice(["Bangalore", "Delhi", "Mumbai"], ["North Indian", "Chinese", "Biryani"], diceYear);
      }
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (val) => {
    if (!val) return "Rs. 0";
    if (val >= 10000000) return `Rs. ${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `Rs. ${(val / 100000).toFixed(2)} L`;
    return `Rs. ${Number(val).toLocaleString("en-IN")}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-black">Multidimensional OLAP Operations</h1>
            <Badge variant="outline" className="font-mono text-xs">Live SQL Engine</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Interactive multidimensional cube queries: Roll-up, Drill-down, Slice, and Dice executed directly on PostgreSQL.
          </p>
        </div>
      </div>

      {/* Operation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="rollup" className="text-xs">
            <ArrowUpRight className="size-3.5 mr-1.5" /> 1. Roll-up
          </TabsTrigger>
          <TabsTrigger value="drilldown" className="text-xs">
            <ArrowDownRight className="size-3.5 mr-1.5" /> 2. Drill-down
          </TabsTrigger>
          <TabsTrigger value="slice" className="text-xs">
            <Scissors className="size-3.5 mr-1.5" /> 3. Slice
          </TabsTrigger>
          <TabsTrigger value="dice" className="text-xs">
            <Grid className="size-3.5 mr-1.5" /> 4. Dice
          </TabsTrigger>
        </TabsList>

        {/* 1. ROLL-UP */}
        <TabsContent value="rollup" className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-zinc-900">
                    ROLL-UP: Hierarchical Summarization (Year → Quarter → Month)
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Ascending the concept hierarchy using SQL <code className="text-zinc-800 bg-zinc-100 px-1 py-0.5 rounded">GROUP BY ROLLUP(d.year, d.quarter_name, d.month_name)</code>
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => runOperation("rollup")} className="h-8 text-xs">
                  <RotateCw className="size-3 mr-1" /> Re-query
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 flex flex-col gap-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Quarter</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Orders Count</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                      <TableHead className="text-right">Average Order Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.slice(0, 15).map((row, i) => {
                      const isGrandTotal = !row.year && !row.quarter_name && !row.month_name;
                      const isYearTotal = row.year && !row.quarter_name && !row.month_name;
                      const isQuarterTotal = row.year && row.quarter_name && !row.month_name;

                      let rowClass = "";
                      if (isGrandTotal) rowClass = "bg-zinc-200/80 font-bold";
                      else if (isYearTotal) rowClass = "bg-zinc-100/90 font-semibold";
                      else if (isQuarterTotal) rowClass = "bg-zinc-50 font-medium";

                      return (
                        <TableRow key={i} className={rowClass}>
                          <TableCell className="font-mono text-xs">
                            {row.year || <Badge variant="secondary" className="text-[10px]">ALL YEARS</Badge>}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {row.quarter_name || (row.year ? <Badge variant="outline" className="text-[10px]">ALL QUARTERS</Badge> : "—")}
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.month_name || (row.quarter_name ? <Badge variant="outline" className="text-[10px]">ALL MONTHS</Badge> : "—")}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {row.total_orders.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold">
                            {formatINR(row.total_revenue)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-zinc-600">
                            Rs. {Number(row.aov).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. DRILL-DOWN */}
        <TabsContent value="drilldown" className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold text-zinc-900">
                    DRILL-DOWN: Granular Daily Velocity
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Descending from Month level into individual calendar day records with weekday/weekend indicators.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={drillYear}
                    onChange={(e) => {
                      setDrillYear(parseInt(e.target.value));
                      api.getOlapDrilldown(parseInt(e.target.value), drillMonth).then(setData);
                    }}
                    className="bg-white border border-zinc-200 rounded px-2 py-1 text-xs outline-none"
                  >
                    <option value="2018">2018</option>
                    <option value="2019">2019</option>
                    <option value="2020">2020</option>
                  </select>
                  <select
                    value={drillMonth}
                    onChange={(e) => {
                      setDrillMonth(parseInt(e.target.value));
                      api.getOlapDrilldown(drillYear, parseInt(e.target.value)).then(setData);
                    }}
                    className="bg-white border border-zinc-200 rounded px-2 py-1 text-xs outline-none"
                  >
                    <option value="1">January</option>
                    <option value="3">March</option>
                    <option value="5">May</option>
                    <option value="10">October</option>
                    <option value="12">December</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 flex flex-col gap-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Day Name</TableHead>
                      <TableHead>Weekend?</TableHead>
                      <TableHead className="text-right">Daily Orders</TableHead>
                      <TableHead className="text-right">Daily Revenue</TableHead>
                      <TableHead className="text-right">Daily AOV</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.slice(0, 15).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{row.full_date}</TableCell>
                        <TableCell className="text-xs text-zinc-700">{row.day_name}</TableCell>
                        <TableCell>
                          <Badge variant={row.is_weekend ? "secondary" : "outline"} className="text-[10px]">
                            {row.is_weekend ? "Weekend" : "Weekday"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">{row.daily_orders}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold">{formatINR(row.daily_revenue)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-zinc-600">Rs. {Number(row.daily_aov).toFixed(0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. SLICE */}
        <TabsContent value="slice" className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold text-zinc-900">
                    SLICE: Single-Dimensional Selection (City = '{sliceCity}')
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Fixing a single dimension to project a 2-D sub-table of cuisine sales within the selected market.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={sliceCity}
                    onChange={(e) => {
                      setSliceCity(e.target.value);
                      api.getOlapSlice(e.target.value).then(setData);
                    }}
                    className="bg-white border border-zinc-200 rounded px-2.5 py-1 text-xs outline-none"
                  >
                    <option value="Bangalore">Bangalore</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Kolkata">Kolkata</option>
                    <option value="Ahmedabad">Ahmedabad</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 flex flex-col gap-2">
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Primary Cuisine</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                      <TableHead className="text-right">Avg Order Value</TableHead>
                      <TableHead className="text-right">Restaurant Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-xs text-black">{row.primary_cuisine}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{row.total_orders.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold">{formatINR(row.total_revenue)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-zinc-600">Rs. {Number(row.avg_order_value).toFixed(0)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-zinc-500">{row.restaurant_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. DICE */}
        <TabsContent value="dice" className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold text-zinc-900">
                    DICE: Multi-Dimensional Sub-Cube (Cities × Cuisines × Year)
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Simultaneous constraints applied across Location (3 cities), Cuisine (3 categories), and Time ({diceYear}).
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={diceYear}
                    onChange={(e) => {
                      setDiceYear(parseInt(e.target.value));
                      api.getOlapDice(["Bangalore", "Delhi", "Mumbai"], ["North Indian", "Chinese", "Biryani"], parseInt(e.target.value)).then(setData);
                    }}
                    className="bg-white border border-zinc-200 rounded px-2.5 py-1 text-xs outline-none"
                  >
                    <option value="2018">2018</option>
                    <option value="2019">2019</option>
                    <option value="2020">2020</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 flex flex-col gap-2">
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>City</TableHead>
                      <TableHead>Primary Cuisine</TableHead>
                      <TableHead>Year & Quarter</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.slice(0, 15).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-xs text-black">{row.city}</TableCell>
                        <TableCell className="text-xs text-zinc-700">{row.primary_cuisine}</TableCell>
                        <TableCell className="text-xs font-mono">{row.year} - {row.quarter_name}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{row.orders_count}</TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold">{formatINR(row.total_revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
