import React, { useState, useEffect } from "react";
import { 
  Sparkles, Layers, Sliders, Search, Star, MapPin, 
  UtensilsCrossed, AlertCircle, CheckCircle, ArrowRight 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../components/ui/table";
import { Skeleton } from "../components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { api } from "../lib/api";

export function MiningRecommendations() {
  // Association Rules State
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [minLift, setMinLift] = useState(1.2);
  const [minConfidence, setMinConfidence] = useState(0.5);
  const [itemType, setItemType] = useState("");

  // Recommendation State
  const [userId, setUserId] = useState("1");
  const [targetCity, setTargetCity] = useState("");
  const [targetCuisine, setTargetCuisine] = useState("");
  const [recResult, setRecResult] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState(null);

  useEffect(() => {
    fetchRules();
    fetchRecommendations("1");
  }, []);

  const fetchRules = async () => {
    try {
      setRulesLoading(true);
      const res = await api.getAssociationRules({
        min_lift: parseFloat(minLift) || 1.0,
        min_confidence: parseFloat(minConfidence) || 0.0,
        item_type: itemType || undefined,
        limit: 15
      });
      setRules(res);
    } catch (err) {
      console.error(err);
    } finally {
      setRulesLoading(false);
    }
  };

  const fetchRecommendations = async (id = userId) => {
    try {
      setRecLoading(true);
      setRecError(null);
      const res = await api.getRecommendations(id, {
        top_n: 4,
        city: targetCity || undefined,
        cuisine: targetCuisine || undefined
      });
      setRecResult(res);
    } catch (err) {
      setRecError(err.message);
    } finally {
      setRecLoading(false);
    }
  };

  const handleApplyRules = (e) => {
    e.preventDefault();
    fetchRules();
  };

  const handleRecSubmit = (e) => {
    e.preventDefault();
    if (userId.trim()) {
      fetchRecommendations(userId.trim());
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-black">Mining & Explainable Recommendations</h1>
            <Badge variant="outline" className="font-mono text-xs">FP-Growth + Hybrid Scoring</Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Discovering frequent itemsets across menus and generating transparent recommendations for customers.
          </p>
        </div>
      </div>

      {/* SECTION 1: FP-GROWTH ASSOCIATION RULES */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              1. Market Basket Analysis (FP-Growth Algorithm)
            </h2>
            <p className="text-xs text-zinc-500">
              Co-occurring food dishes across 12,013 restaurant menus and user multi-order cuisine combinations.
            </p>
          </div>

          {/* Rule Filters */}
          <form onSubmit={handleApplyRules} className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-md px-2.5 py-1">
              <span className="text-xs text-zinc-500">Min Lift:</span>
              <input
                type="number"
                step="0.1"
                min="1.0"
                value={minLift}
                onChange={(e) => setMinLift(e.target.value)}
                className="bg-transparent text-xs text-zinc-800 outline-none w-14 font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-md px-2.5 py-1">
              <span className="text-xs text-zinc-500">Min Conf:</span>
              <input
                type="number"
                step="0.05"
                min="0.0"
                max="1.0"
                value={minConfidence}
                onChange={(e) => setMinConfidence(e.target.value)}
                className="bg-transparent text-xs text-zinc-800 outline-none w-14 font-mono"
              />
            </div>

            <Button type="submit" size="sm" className="h-8 text-xs font-medium">
              Filter Rules
            </Button>
          </form>
        </div>

        {/* Association Rules Table */}
        <Card>
          <CardContent className="p-0">
            {rulesLoading ? (
              <div className="p-6 flex flex-col gap-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : rules.length === 0 ? (
              <div className="p-12 text-center text-xs text-zinc-500">
                No association rules matching the lift/confidence thresholds.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Antecedent (If Bought)</TableHead>
                    <TableHead className="w-8 text-center"></TableHead>
                    <TableHead>Consequent (Also Bought)</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Support</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                    <TableHead className="text-right">Lift</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-zinc-400 text-xs">{idx + 1}</TableCell>
                      <TableCell className="font-medium text-xs text-zinc-900">
                        {r.antecedent_str}
                      </TableCell>
                      <TableCell className="text-center text-zinc-400">
                        <ArrowRight className="size-3 inline" />
                      </TableCell>
                      <TableCell className="font-medium text-xs text-black">
                        {r.consequent_str}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] py-0">
                          {r.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-zinc-600">
                        {(r.support * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-zinc-600">
                        {(r.confidence * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-black text-white font-mono text-[10px]">
                          {r.lift.toFixed(2)}x
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: EXPLAINABLE RECOMMENDATION SIMULATOR */}
      <div className="flex flex-col gap-4 border-t border-zinc-200 pt-6">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            2. Explainable Restaurant Recommendation Engine
          </h2>
          <p className="text-xs text-zinc-500">
            Hybrid Multi-Signal Recommender combining Location Match (40%), Bayesian Quality Rating (35%), and Budget Compatibility (25%).
          </p>
        </div>

        {/* Customer Selector & Overrides */}
        <Card className="bg-zinc-50 border-zinc-200">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <form onSubmit={handleRecSubmit} className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-zinc-700">Customer ID:</span>
              <Input
                type="number"
                min="1"
                max="100000"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-32 h-8 text-xs font-mono bg-white"
              />

              <Input
                type="text"
                placeholder="Override City (optional)"
                value={targetCity}
                onChange={(e) => setTargetCity(e.target.value)}
                className="w-40 h-8 text-xs bg-white"
              />

              <Input
                type="text"
                placeholder="Override Cuisine"
                value={targetCuisine}
                onChange={(e) => setTargetCuisine(e.target.value)}
                className="w-36 h-8 text-xs bg-white"
              />

              <Button type="submit" size="sm" className="h-8 text-xs">
                Generate Recommendations
              </Button>
            </form>

            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span>Quick Picks:</span>
              {[
                { id: "1", name: "Claire (#1)" },
                { id: "10", name: "Tony (#10)" },
                { id: "42", name: "Diana (#42)" }
              ].map((c) => (
                <Button
                  key={c.id}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[11px] bg-white"
                  onClick={() => {
                    setUserId(c.id);
                    setTargetCity("");
                    setTargetCuisine("");
                    fetchRecommendations(c.id);
                  }}
                >
                  {c.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Context & Generated Recommendations */}
        {recLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </Card>
            ))}
          </div>
        ) : recError ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Recommendation Error</AlertTitle>
            <AlertDescription>{recError}</AlertDescription>
          </Alert>
        ) : recResult && recResult.customer && (
          <div className="flex flex-col gap-4">
            {/* Customer Summary Bar */}
            <div className="p-3 bg-white border border-zinc-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-black">{recResult.customer.name}</span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  Segment: {recResult.customer.segment}
                </Badge>
                <span className="text-zinc-500">
                  Target City: <strong className="text-zinc-900">{recResult.target_city}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 text-zinc-500">
                <span>Avg Order Value: <strong className="text-zinc-900 font-mono">Rs. {Number(recResult.customer.avg_order_value).toFixed(0)}</strong></span>
                <span>Churn Risk: <strong className="text-zinc-900 font-mono">{(recResult.customer.churn_probability * 100).toFixed(1)}%</strong></span>
              </div>
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recResult.recommendations.map((r, i) => (
                <Card key={r.restaurant_id || i} className="border-zinc-200 hover:border-zinc-400 transition-colors shadow-xs">
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-black">{r.name}</h4>
                        <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                          <span className="font-medium text-zinc-800">{r.primary_cuisine}</span>
                          <span>•</span>
                          <span>{r.city}</span>
                        </div>
                      </div>
                      <Badge className="bg-black text-white font-mono text-xs px-2 py-0.5">
                        {r.match_score_pct}% Match
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-600">
                      <div className="flex items-center gap-1 font-semibold text-zinc-900">
                        <Star className="size-3 text-amber-500 fill-amber-500" />
                        <span>{r.rating.toFixed(1)}</span>
                        <span className="text-zinc-400 font-normal">({r.rating_count.toLocaleString()} ratings)</span>
                      </div>
                      <span>•</span>
                      <span>Rs. {Number(r.cost_for_two).toFixed(0)} for two</span>
                    </div>

                    {/* Transparent Human-Readable Explanation */}
                    <div className="p-2.5 rounded bg-zinc-50 border border-zinc-200/80 text-xs">
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                        Recommendation Explanation:
                      </div>
                      <div className="text-zinc-700 leading-relaxed">
                        {r.explanation}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
