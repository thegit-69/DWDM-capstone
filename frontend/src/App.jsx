import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sparkles,
  Search,
  Database,
  Layers,
  BarChart3,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react"

export default function App() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
              <Database className="size-5" />
            </div>
            <div>
              <span className="font-semibold text-slate-900">DWDM Studio</span>
              <span className="ml-2 text-xs text-slate-500 font-mono">v1.0</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1.5 bg-slate-100 text-slate-700 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Tailwind CSS v4 & shadcn/ui
            </Badge>
            <Button variant="outline" size="sm" className="hidden sm:flex text-xs">
              Documentation
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-10 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-xs mb-4">
            <Sparkles className="size-3.5 text-amber-500" />
            <span>React + Vite Frontend Scaffolded Successfully</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Analytics & Data Mining Workspace
          </h1>
          <p className="mt-2 text-base text-slate-600 max-w-2xl">
            A clean, high-performance web client configured with Tailwind CSS v4 Vite plugin and modular shadcn/ui components.
          </p>
        </div>

        {/* Feature & KPI Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="border-slate-200 bg-white transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-600">
                Core Stack
              </CardTitle>
              <Layers className="size-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">React + Vite</div>
              <p className="text-xs text-slate-500 mt-1">
                Fast HMR and ESM build tooling
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[11px] font-normal">React 19</Badge>
                <Badge variant="outline" className="text-[11px] font-normal">Vite 6</Badge>
                <Badge variant="outline" className="text-[11px] font-normal">JS / JSX</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-600">
                Styling Engine
              </CardTitle>
              <Sparkles className="size-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">Tailwind v4</div>
              <p className="text-xs text-slate-500 mt-1">
                CSS-first Vite plugin integration
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[11px] font-normal">@tailwindcss/vite</Badge>
                <Badge variant="outline" className="text-[11px] font-normal">CSS Theme Tokens</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white transition-all hover:shadow-md sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-600">
                UI Primitives
              </CardTitle>
              <BarChart3 className="size-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">shadcn/ui</div>
              <p className="text-xs text-slate-500 mt-1">
                Accessible, customizable components
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[11px] font-normal">Light Mode Theme</Badge>
                <Badge variant="outline" className="text-[11px] font-normal">Lucide Icons</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Component Playground Card */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-lg text-slate-900">Component Showcase</CardTitle>
                <CardDescription className="text-slate-500">
                  Test interactive elements and verify tailwind styles
                </CardDescription>
              </div>
              <Badge variant="secondary" className="w-fit text-slate-700 bg-slate-100">
                Ready for Development
              </Badge>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  placeholder="Search datasets, restaurants, or mining models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
                />
              </div>
              <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-xs">
                Explore Data
                <ArrowUpRight className="size-4 ml-1" />
              </Button>
            </div>

            <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-800 mb-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Setup Verification Checklist
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-slate-400" />
                  Vite with React JavaScript template configured
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-slate-400" />
                  Tailwind CSS v4 Vite plugin loaded in vite.config.js
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-slate-400" />
                  Path alias (@/*) mapped to src directory
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-slate-400" />
                  shadcn/ui Button, Card, Badge, Input & Separator ready
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
