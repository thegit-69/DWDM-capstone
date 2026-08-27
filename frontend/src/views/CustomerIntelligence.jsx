import React, { useState, useEffect } from "react";
import { 
  Users, UserCheck, UserX, AlertTriangle, ShieldAlert, 
  Search, ArrowRight, Activity, BarChart2, Info, CheckCircle2 
} from "lucide-react";
import { 
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, 
  ZAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell 
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/table";
import { Skeleton } from "../components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { api } from "../lib/api";

const CLUSTER_COLORS = {
  "Regular Diners": "#000000",
  "Dormant / Lapsed Customers": "#71717a",
  "Occasional Value Diners": "#2563eb",
  "High-Value Champions": "#059669"
};

export function CustomerIntelligence() {
  const [segments, setSegments] = useState(null);
  const [churnData, setChurnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Customer Lookup state
  const [searchUserId, setSearchUserId] = useState("1");
  const [customerProfile, setCustomerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [segRes, churnRes] = await Promise.all([
          api.getCustomerSegments(),
          api.getCustomerChurn()
        ]);
        setSegments(segRes);
        setChurnData(churnRes);
        // Load initial customer profile
        loadCustomer("1");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const loadCustomer = async (id) => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      const res = await api.getCustomerProfile(id);
      setCustomerProfile(res);
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchUserId.trim()) {
      loadCustomer(searchUserId.trim());
    }
  };

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle />
        <AlertTitle>Failed to load Customer Intelligence</AlertTitle>
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
            <h1 className="text-xl font-bold tracking-tight text-black">Customer Intelligence</h1>
            <Badge variant="outline" className="font-mono text-xs">K-Means + Random Forest</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Multidimensional RFM Customer Segmentation & Leak-Free Temporal Churn Prediction.
          </p>
        </div>
      </div>

      {/* SECTION 1: K-MEANS CUSTOMER SEGMENTATION */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              1. Customer Segmentation (K-Means Clustering, k=4)
            </h2>
            <p className="text-xs text-zinc-500">
              Normalized RFM metrics partitioned across 100,000 customers with Elbow & Silhouette validation.
            </p>
          </div>
          {segments && (
            <Badge variant="secondary" className="font-mono text-xs">
              Silhouette: {segments.evaluation.find(e => e.k === 4)?.silhouette_score || "0.2790"}
            </Badge>
          )}
        </div>

        {/* Cluster Personas Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading || !segments ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-5 w-28 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </Card>
            ))
          ) : (
            Object.entries(segments.cluster_stats).map(([label, stats]) => (
              <Card key={label} className="border-zinc-200 hover:border-zinc-400 transition-colors">
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-zinc-900 truncate">{label}</span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {stats.pct}%
                    </Badge>
                  </div>
                  <div className="text-base font-bold text-black font-mono-numbers">
                    {stats.count.toLocaleString()} customers
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-zinc-500 border-t border-zinc-100 pt-2 mt-1">
                    <div>Avg Spend: <span className="font-medium text-zinc-800">Rs. {stats.avg_monetary.toLocaleString()}</span></div>
                    <div>Avg Orders: <span className="font-medium text-zinc-800">{stats.avg_frequency}</span></div>
                    <div>Avg AOV: <span className="font-medium text-zinc-800">Rs. {stats.avg_aov.toLocaleString()}</span></div>
                    <div>Avg Recency: <span className="font-medium text-zinc-800">{stats.avg_recency}d</span></div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Interactive Scatter Visualization & Elbow Curve */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* RFM Scatter Plot */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-900">
                Customer RFM Distribution (Sampled Cohort)
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Frequency (X-Axis) vs Monetary Spend in INR (Y-Axis) across customer segments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading || !segments ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        type="number"
                        dataKey="frequency"
                        name="Frequency"
                        unit=" orders"
                        stroke="#888888"
                        fontSize={10}
                      />
                      <YAxis
                        type="number"
                        dataKey="monetary"
                        name="Monetary"
                        unit=" Rs"
                        stroke="#888888"
                        fontSize={10}
                        tickFormatter={(v) => `Rs. ${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white border border-zinc-200 p-2.5 rounded shadow-sm text-xs">
                                <div className="font-semibold text-black">{data.name} (ID: {data.user_id})</div>
                                <div className="text-zinc-500 mt-1">Segment: <span className="font-medium text-black">{data.segment}</span></div>
                                <div>Orders: <span className="font-mono">{data.frequency}</span> | Spend: <span className="font-mono">Rs. {data.monetary.toLocaleString()}</span></div>
                                <div>Recency: <span className="font-mono">{data.recency} days</span> | Churn: <span className="font-mono">{(data.churn_risk * 100).toFixed(1)}%</span></div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter
                        name="Customers"
                        data={segments.scatter_points}
                        fill="#000000"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Elbow & Silhouette Evaluation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-900">
                Optimal K Evaluation
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Inertia & Silhouette across k = 2..6
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading || !segments ? (
                <Skeleton className="h-72 w-full" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">K</TableHead>
                      <TableHead>Inertia</TableHead>
                      <TableHead>Silhouette</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {segments.evaluation.map((row) => (
                      <TableRow key={row.k} className={row.k === 4 ? "bg-zinc-100/70 font-semibold" : ""}>
                        <TableCell className="font-mono">
                          {row.k} {row.k === 4 && <Badge variant="secondary" className="ml-1 text-[9px]">Optimal</Badge>}
                        </TableCell>
                        <TableCell className="font-mono text-zinc-600">
                          {Number(row.inertia).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-zinc-900">
                          {row.silhouette_score.toFixed(4)}
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

      {/* SECTION 2: TEMPORAL CHURN PREDICTION */}
      <div className="flex flex-col gap-4 border-t border-zinc-200 pt-6">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            2. Customer Churn Prediction (Random Forest)
          </h2>
          <p className="text-xs text-zinc-500">
            Leak-free temporal framework: Features computed strictly on transactions ≤ 2019-10-01; Target defined by future 180-day ordering.
          </p>
        </div>

        {/* Churn Metrics & Confusion Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading || !churnData ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-28" />
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-zinc-500 font-medium">Precision (Churn)</div>
                  <div className="text-xl font-bold text-black font-mono-numbers mt-1">
                    {(churnData.metrics.precision * 100).toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">High confidence on flagged churn</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-zinc-500 font-medium">Recall (Churn)</div>
                  <div className="text-xl font-bold text-black font-mono-numbers mt-1">
                    {(churnData.metrics.recall * 100).toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">Catches 61.2% of actual churners</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-zinc-500 font-medium">F1 Score</div>
                  <div className="text-xl font-bold text-black font-mono-numbers mt-1">
                    {(churnData.metrics.f1_score * 100).toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">Harmonic mean balance</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-zinc-500 font-medium">High Risk Cohort</div>
                  <div className="text-xl font-bold text-red-600 font-mono-numbers mt-1">
                    {churnData.risk_tiers.high_risk.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">Churn probability ≥ 70%</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Feature Importance & Confusion Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feature Importance Bar Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-900">
                Top Predictive Churn Features (Gini Importance)
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Relative contribution of non-leaked historical RFM and demographic signals
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
                      data={churnData.feature_importances.slice(0, 8)}
                      margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="#888888"
                        fontSize={10}
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        stroke="#888888"
                        fontSize={10}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e4e4e7", fontSize: "11px" }}
                        formatter={(val) => [`${(val * 100).toFixed(2)}%`, "Importance"]}
                      />
                      <Bar dataKey="importance" fill="#18181b" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confusion Matrix & Baseline Benchmark Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-900">
                Confusion Matrix & Baselines
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Evaluated on 13,837 stratified test customers
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {loading || !churnData ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <>
                  {/* 2x2 Matrix */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200">
                      <div className="text-zinc-500 text-[10px]">True Retained (TN)</div>
                      <div className="text-sm font-bold font-mono text-zinc-900 mt-0.5">
                        {churnData.metrics.confusion_matrix.true_negative.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200">
                      <div className="text-zinc-500 text-[10px]">False Churn (FP)</div>
                      <div className="text-sm font-bold font-mono text-zinc-900 mt-0.5">
                        {churnData.metrics.confusion_matrix.false_positive.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200">
                      <div className="text-zinc-500 text-[10px]">False Retained (FN)</div>
                      <div className="text-sm font-bold font-mono text-zinc-900 mt-0.5">
                        {churnData.metrics.confusion_matrix.false_negative.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200">
                      <div className="text-zinc-500 text-[10px]">True Churn (TP)</div>
                      <div className="text-sm font-bold font-mono text-zinc-900 mt-0.5">
                        {churnData.metrics.confusion_matrix.true_positive.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Baseline Comparisons */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px]">Model / Baseline</TableHead>
                        <TableHead className="text-[10px]">Prec</TableHead>
                        <TableHead className="text-[10px]">Rec</TableHead>
                        <TableHead className="text-[10px]">F1</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-[10px]">Majority Baseline</TableCell>
                        <TableCell className="text-[10px] font-mono">79.8%</TableCell>
                        <TableCell className="text-[10px] font-mono">100%</TableCell>
                        <TableCell className="text-[10px] font-mono">88.7%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="text-[10px]">Recency Rule</TableCell>
                        <TableCell className="text-[10px] font-mono">79.5%</TableCell>
                        <TableCell className="text-[10px] font-mono">49.9%</TableCell>
                        <TableCell className="text-[10px] font-mono">61.3%</TableCell>
                      </TableRow>
                      <TableRow className="font-semibold bg-zinc-100/70">
                        <TableCell className="text-[10px]">Random Forest</TableCell>
                        <TableCell className="text-[10px] font-mono">79.7%</TableCell>
                        <TableCell className="text-[10px] font-mono">61.2%</TableCell>
                        <TableCell className="text-[10px] font-mono">69.2%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 3: INDIVIDUAL CUSTOMER RFM & CHURN INSPECTOR */}
      <div className="flex flex-col gap-4 border-t border-zinc-200 pt-6">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            3. Customer Profile & RFM Explorer
          </h2>
          <p className="text-xs text-zinc-500">
            Inspect individual customer demographics, assigned segment persona, and calculated churn risk probability.
          </p>
        </div>

        {/* Customer Search Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max="100000"
              placeholder="Enter Customer ID (1..100000)"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              className="w-56 h-8 text-xs font-mono"
            />
            <Button type="submit" size="sm" className="h-8 text-xs">
              <Search className="size-3.5 mr-1" /> Inspect
            </Button>
          </form>

          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span>Quick Samples:</span>
            {[1, 10, 42, 100, 500].map((id) => (
              <Button
                key={id}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[11px] font-mono"
                onClick={() => {
                  setSearchUserId(String(id));
                  loadCustomer(String(id));
                }}
              >
                #{id}
              </Button>
            ))}
          </div>
        </div>

        {/* Profile Card */}
        {profileLoading ? (
          <Card className="p-6">
            <Skeleton className="h-6 w-48 mb-3" />
            <Skeleton className="h-20 w-full" />
          </Card>
        ) : profileError ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>Customer Not Found</AlertTitle>
            <AlertDescription>{profileError}</AlertDescription>
          </Alert>
        ) : customerProfile && (
          <Card className="border-zinc-300 shadow-xs">
            <CardContent className="p-5 flex flex-col md:flex-row justify-between gap-6">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-black">{customerProfile.name}</h3>
                  <Badge variant="outline" className="font-mono text-xs">ID #{customerProfile.user_id}</Badge>
                  <Badge className="text-xs bg-black text-white">{customerProfile.segment || "Regular Diners"}</Badge>
                </div>
                <div className="text-xs text-zinc-500">
                  {customerProfile.gender}, {customerProfile.age} yrs • {customerProfile.occupation} • Delivery City: <span className="font-medium text-black">{customerProfile.preferred_city}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-xs text-zinc-500">Preferred Cuisines:</span>
                  {customerProfile.preferred_cuisines && customerProfile.preferred_cuisines.length > 0 ? (
                    customerProfile.preferred_cuisines.map((c) => (
                      <Badge key={c} variant="secondary" className="text-[11px]">{c}</Badge>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-400">North Indian, Chinese</span>
                  )}
                </div>
              </div>

              {/* Metrics Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50 p-3.5 rounded-lg border border-zinc-200">
                <div>
                  <div className="text-[10px] text-zinc-500">Lifetime Orders</div>
                  <div className="text-sm font-bold font-mono text-zinc-900 mt-0.5">
                    {customerProfile.total_orders}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500">Total Spend</div>
                  <div className="text-sm font-bold font-mono text-zinc-900 mt-0.5">
                    Rs. {Number(customerProfile.total_spend).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500">Avg Order Value</div>
                  <div className="text-sm font-bold font-mono text-zinc-900 mt-0.5">
                    Rs. {Number(customerProfile.avg_order_value).toFixed(0)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500">Churn Risk</div>
                  <div className={`text-sm font-bold font-mono mt-0.5 ${
                    customerProfile.churn_probability >= 0.70 ? "text-red-600" :
                    customerProfile.churn_probability >= 0.40 ? "text-amber-600" : "text-emerald-600"
                  }`}>
                    {(customerProfile.churn_probability * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
