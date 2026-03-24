import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Gauge,
  LayoutDashboard,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  API_ROUTES,
  APP_NAME,
  type DashboardData,
  type WeatherData,
  type WeatherRequestParams,
} from "@repo/shared";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WeatherCard } from "@/components/dashboard/weather-card";
import { PowerFlowDiagram } from "@/components/dashboard/power-flow";
import { EnergyChart } from "@/components/dashboard/energy-chart";
import { ProductionBadge } from "@/components/dashboard/production-badge";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { getMockDashboard } from "@/lib/mock-data";
import { getTimeOfDayGradient } from "@/lib/time-gradient";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";
const DEFAULT_LOCATION: WeatherRequestParams = {
  latitude: Number(import.meta.env.VITE_DEFAULT_WEATHER_LATITUDE ?? 51.5072),
  longitude: Number(import.meta.env.VITE_DEFAULT_WEATHER_LONGITUDE ?? -0.1276),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to refresh weather right now.";
}

async function fetchWeather(location: WeatherRequestParams, signal?: AbortSignal) {
  const url = new URL(API_ROUTES.weather, BACKEND_URL);
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("timezone", location.timezone);

  const response = await fetch(url, {
    credentials: "include",
    signal,
  });

  const payload = (await response.json()) as WeatherData | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : "Unable to refresh weather right now."
    );
  }

  return (payload as WeatherData).current;
}

function App() {
  const [data, setData] = useState<DashboardData>(getMockDashboard);
  const [location, setLocation] = useState<WeatherRequestParams>(DEFAULT_LOCATION);
  const [connectionAlert, setConnectionAlert] = useState<string | null>(null);
  const bg = useMemo(() => getTimeOfDayGradient(), []);

  const weatherQuery = useQuery({
    queryKey: [
      "weather",
      location.latitude,
      location.longitude,
      location.timezone,
    ],
    queryFn: ({ signal }) => fetchWeather(location, signal),
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: REFRESH_INTERVAL_MS - 1_000,
  });

  const refreshing = weatherQuery.isFetching;
  const hasWeatherRequest =
    weatherQuery.dataUpdatedAt > 0 || weatherQuery.errorUpdatedAt > 0;
  const isBackendConnected = hasWeatherRequest && !weatherQuery.isError;
  const weatherError = weatherQuery.isError
    ? getErrorMessage(weatherQuery.error)
    : null;
  const isRetrying = weatherQuery.isFetching && connectionAlert !== null;

  useEffect(() => {
    if (!weatherQuery.data) {
      return;
    }

    setData((currentData) => ({
      ...currentData,
      weather: weatherQuery.data,
      lastUpdated: new Date().toISOString(),
    }));
    setConnectionAlert(null);
  }, [weatherQuery.data]);

  useEffect(() => {
    if (!weatherQuery.isError) {
      return;
    }

    setConnectionAlert("The backend weather API is unavailable.");
  }, [weatherQuery.isError]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation: WeatherRequestParams = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        };

        setLocation(nextLocation);
      },
      () => {
        setLocation(DEFAULT_LOCATION);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: REFRESH_INTERVAL_MS,
      }
    );
  }, []);

  const handleRefresh = () => {
    void weatherQuery.refetch();
  };

  const handleReconnect = () => {
    setConnectionAlert("Attempting to reach the weather API...");
    void weatherQuery.refetch();
  };

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
              {refreshing ? "Refreshing" : "Refresh"}
            </Button>
          </div>
        </header>

        {/* ── Top row: Weather + Power Flow diagram ── */}
        <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <WeatherCard
            data={data.weather}
            isLoading={refreshing}
            error={weatherError}
            isConnected={isBackendConnected}
          />

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

      <AlertDialog
        open={connectionAlert !== null}
        onOpenChange={(open) => {
          if (!open && !isRetrying) {
            setConnectionAlert(null);
          }
        }}
      >
        <AlertDialogContent>
          <div className="flex gap-2">
            <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-300 ring-1 ring-amber-400/20">
              <AlertTriangle className="size-5" />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle>Live connection unavailable</AlertDialogTitle>
              <AlertDialogDescription>
                {connectionAlert}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="secondary"
              className="bg-amber-50 text-slate-950 hover:bg-amber-100"
              onClick={handleReconnect}
              disabled={isRetrying}
            >
              <RefreshCw
                className={`size-3.5 ${isRetrying ? "animate-spin" : ""}`}
              />
              {isRetrying ? "Retrying" : "Try again"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

export default App;
