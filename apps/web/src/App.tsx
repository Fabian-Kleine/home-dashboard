import { useCallback, useMemo, useState } from "react";
import {
  Gauge,
  LayoutDashboard,
  RefreshCw,
  Zap,
} from "lucide-react";
import type { DashboardData } from "@repo/shared";
import { APP_NAME } from "@repo/shared";

import { Button } from "@/components/ui/button";
import { WeatherCard } from "@/components/dashboard/weather-card";
import { PowerFlowDiagram } from "@/components/dashboard/power-flow";
import { EnergyChart } from "@/components/dashboard/energy-chart";
import { ProductionBadge } from "@/components/dashboard/production-badge";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { getMockDashboard } from "@/lib/mock-data";
import { getTimeOfDayGradient } from "@/lib/time-gradient";

function App() {
  const [data, setData] = useState<DashboardData>(getMockDashboard);
  const [refreshing, setRefreshing] = useState(false);
  const bg = useMemo(() => getTimeOfDayGradient(), []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setData(getMockDashboard());
      setRefreshing(false);
    }, 600);
  }, []);

  return (
    <main
      className="min-h-screen w-full text-white antialiased"
      style={bg.style}
    >
      <div className="mx-auto flex w-full flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <LayoutDashboard className="size-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                {APP_NAME}
              </h1>
              <p className="text-xs text-slate-500">
                Last updated{" "}
                {new Date(data.lastUpdated).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ProductionBadge status={data.productionStatus} />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </header>

        {/* ── Top row: Weather + Power Flow diagram ── */}
        <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <WeatherCard data={data.weather} />

          <div className="rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/5 backdrop-blur">
            <p className="mb-1 text-xs font-medium tracking-wide text-slate-400">
              Power Flow
            </p>
            <PowerFlowDiagram data={data} />
          </div>
        </section>

        {/* ── Total consumption strip ── */}
        <section className="flex flex-wrap items-center gap-6 rounded-2xl bg-slate-800/50 px-6 py-4 ring-1 ring-white/5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-rose-500/10">
              <Zap className="size-5 text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Consumption</p>
              <p className="text-2xl font-bold tracking-tight">
                {data.consumption.current.toFixed(2)}
                <span className="ml-1 text-sm font-medium text-slate-500">
                  {data.consumption.unit}
                </span>
              </p>
            </div>
          </div>

          <div className="hidden h-8 w-px bg-white/10 sm:block" />

          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <Gauge className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Self-Sufficiency</p>
              <p className="text-2xl font-bold tracking-tight">
                {Math.min(
                  100,
                  Math.round(
                    ((data.solar.current + data.battery.current) /
                      Math.max(data.consumption.current, 0.01)) *
                      100
                  )
                )}
                <span className="ml-0.5 text-sm font-medium text-slate-500">
                  %
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* ── Chart + Summary ── */}
        <section className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <EnergyChart data={data.energyHistory} />
          <SummaryCard text={data.summary} />
        </section>
      </div>
    </main>
  );
}

export default App
