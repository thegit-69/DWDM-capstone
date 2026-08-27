import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, Users, Utensils, Sparkles, Box, 
  BarChart2, Database, CheckCircle2, AlertCircle, RefreshCw,
  ExternalLink, Layers, ArrowUpRight, ShieldCheck, ChevronRight
} from "lucide-react";
import { ExecutiveOverview } from "./views/ExecutiveOverview";
import { CustomerIntelligence } from "./views/CustomerIntelligence";
import { RestaurantAnalytics } from "./views/RestaurantAnalytics";
import { MiningRecommendations } from "./views/MiningRecommendations";
import { OlapExplorer } from "./views/OlapExplorer";
import { VisualAnalyticsStudio } from "./views/VisualAnalyticsStudio";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { api } from "./lib/api";

const NAV_SECTIONS = [
  {
    title: "BUSINESS INTELLIGENCE",
    items: [
      { id: "overview", label: "Executive Overview", icon: LayoutDashboard, badge: "KPIs" },
      { id: "restaurants", label: "Restaurant & Food", icon: Utensils, badge: "Cuisines" },
      { id: "olap", label: "OLAP Operations", icon: Box, badge: "Cube" },
    ]
  },
  {
    title: "DATA MINING & ML",
    items: [
      { id: "customers", label: "Customer Intelligence", icon: Users, badge: "K-Means / Churn" },
      { id: "mining", label: "Mining & Recommender", icon: Sparkles, badge: "FP-Growth" },
      { id: "visuals", label: "Visual Analytics Studio", icon: BarChart2, badge: "All Charts" },
    ]
  }
];

export function App() {
  const [currentTab, setCurrentTab] = useState("overview");
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  const checkHealth = async () => {
    try {
      setHealthLoading(true);
      const res = await api.getHealth();
      setHealth(res);
    } catch (err) {
      setHealth({ status: "offline", database: "Disconnected (Backend not running)", models_loaded: false });
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-950 flex flex-col md:flex-row antialiased selection:bg-zinc-950 selection:text-white">
      {/* VERCEL-STYLE SIDEBAR */}
      <aside className="w-full md:w-64 bg-white border-r border-zinc-200 flex flex-col justify-between shrink-0 md:sticky md:top-0 md:h-screen">
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="h-16 px-5 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded bg-black flex items-center justify-center text-white font-bold text-xs tracking-tight shadow-xs">
                ZW
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs tracking-tight text-black">ZOMATO DATA WAREHOUSE</span>
                <span className="text-[10px] text-zinc-400 font-mono leading-none">DWDM Capstone System</span>
              </div>
            </div>
          </div>

          {/* Navigation Section Groups */}
          <div className="p-3 flex flex-col gap-5 overflow-y-auto">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="flex flex-col gap-1">
                <div className="px-2.5 text-[10px] font-bold text-zinc-400 tracking-wider">
                  {section.title}
                </div>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentTab(item.id)}
                        className={`flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-md transition-colors text-left ${
                          isActive
                            ? "bg-black text-white shadow-xs font-semibold"
                            : "text-zinc-600 hover:text-black hover:bg-zinc-100"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="size-4 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                            isActive ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-500"
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer: System Status & Health */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/70 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${
                health?.status === "healthy" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`} />
              <span className="text-[11px] font-medium text-zinc-800 font-mono truncate max-w-[130px]">
                {health?.status === "healthy" ? "PostgreSQL Live" : "Connecting..."}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkHealth}
              disabled={healthLoading}
              className="h-6 w-6 p-0 text-zinc-400 hover:text-black"
              title="Test Connection"
            >
              <RefreshCw className={`size-3 ${healthLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <div className="text-[10px] text-zinc-400 font-mono flex flex-col gap-0.5">
            <div>DB: <span className="text-zinc-600">zomato_dw (Port 5432)</span></div>
            <div>API: <span className="text-zinc-600">FastAPI (127.0.0.1:8000)</span></div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Minimal Bar */}
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span>DWDM Platform</span>
            <ChevronRight className="size-3 text-zinc-300" />
            <span className="font-semibold text-black capitalize">
              {NAV_SECTIONS.flatMap(s => s.items).find(i => i.id === currentTab)?.label || "Overview"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 hover:text-black bg-zinc-100 hover:bg-zinc-200/70 px-2.5 py-1 rounded transition-colors"
            >
              <span>Interactive API Docs</span>
              <ExternalLink className="size-3 text-zinc-400" />
            </a>
            <Badge variant="outline" className="font-mono text-[10px] hidden sm:inline">
              150k Orders Loaded
            </Badge>
          </div>
        </header>

        {/* View Component */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {currentTab === "overview" && <ExecutiveOverview />}
          {currentTab === "customers" && <CustomerIntelligence />}
          {currentTab === "restaurants" && <RestaurantAnalytics />}
          {currentTab === "mining" && <MiningRecommendations />}
          {currentTab === "olap" && <OlapExplorer />}
          {currentTab === "visuals" && <VisualAnalyticsStudio />}
        </main>
      </div>
    </div>
  );
}

export default App;
