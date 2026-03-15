import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Gauge,
  LayoutDashboard,
  RefreshCw,
  Zap,
} from "lucide-react";
import {
  APP_NAME,
  SOCKET_EVENTS,
  type CurrentWeatherData,
  type DashboardData,
  type DashboardErrorPayload,
  type DashboardUpdateClientPayload,
} from "@repo/shared";
import { io, type Socket } from "socket.io-client";

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
const REQUEST_TIMEOUT_MS = 15 * 1000;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";
const DEFAULT_LOCATION: DashboardUpdateClientPayload = {
  latitude: Number(import.meta.env.VITE_DEFAULT_WEATHER_LATITUDE ?? 51.5072),
  longitude: Number(import.meta.env.VITE_DEFAULT_WEATHER_LONGITUDE ?? -0.1276),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
};

function App() {
  const [data, setData] = useState<DashboardData>(getMockDashboard);
  const [refreshing, setRefreshing] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [connectionAlert, setConnectionAlert] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const bg = useMemo(() => getTimeOfDayGradient(), []);
  const socketRef = useRef<Socket | null>(null);
  const locationRef = useRef<DashboardUpdateClientPayload>(DEFAULT_LOCATION);
  const requestTimeoutRef = useRef<number | null>(null);
  const requestInFlightRef = useRef(false);

  const clearRequestTimeout = () => {
    if (requestTimeoutRef.current !== null) {
      window.clearTimeout(requestTimeoutRef.current);
      requestTimeoutRef.current = null;
    }
  };

  const markSocketDisconnected = (message: string) => {
    setIsSocketConnected(false);
    setIsReconnecting(false);
    requestInFlightRef.current = false;
    clearRequestTimeout();
    setRefreshing(false);
    setConnectionAlert(message);
  };

  const requestWeatherUpdate = (
    nextLocation?: Partial<DashboardUpdateClientPayload>
  ) => {
    const socket = socketRef.current;

    if (!socket?.connected) {
      setWeatherError("Live weather is offline.");
      setRefreshing(false);
      requestInFlightRef.current = false;
      return;
    }

    const payload = {
      ...locationRef.current,
      ...nextLocation,
    } satisfies DashboardUpdateClientPayload;

    locationRef.current = payload;
    requestInFlightRef.current = true;
    setRefreshing(true);
    setWeatherError(null);
    clearRequestTimeout();
    requestTimeoutRef.current = window.setTimeout(() => {
      requestInFlightRef.current = false;
      setRefreshing(false);
      setWeatherError("Weather refresh timed out.");
    }, REQUEST_TIMEOUT_MS);

    socket.emit(SOCKET_EVENTS.dashboardUpdate, payload);
  };

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsSocketConnected(true);
      setIsReconnecting(false);
      setConnectionAlert(null);
      setWeatherError(null);
      requestWeatherUpdate();
    });

    socket.on("disconnect", () => {
      markSocketDisconnected("The live IO connection was terminated.");
    });

    socket.on("connect_error", () => {
      markSocketDisconnected("The live IO connection was terminated.");
      setWeatherError("Unable to connect to live weather.");
    });

    socket.on(
      SOCKET_EVENTS.dashboardWeatherUpdate,
      (weather: CurrentWeatherData) => {
        requestInFlightRef.current = false;
        clearRequestTimeout();
        setData((currentData) => ({
          ...currentData,
          weather,
          lastUpdated: new Date().toISOString(),
        }));
        setRefreshing(false);
        setWeatherError(null);
      }
    );

    socket.on(SOCKET_EVENTS.dashboardError, (payload: DashboardErrorPayload) => {
      requestInFlightRef.current = false;
      clearRequestTimeout();
      setRefreshing(false);
      setWeatherError(payload.message);
    });

    return () => {
      requestInFlightRef.current = false;
      clearRequestTimeout();
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation: DashboardUpdateClientPayload = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        };

        locationRef.current = nextLocation;

        if (socketRef.current?.connected) {
          requestWeatherUpdate(nextLocation);
        }
      },
      () => {
        locationRef.current = DEFAULT_LOCATION;
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: REFRESH_INTERVAL_MS,
      }
    );
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!requestInFlightRef.current) {
        requestWeatherUpdate();
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const handleRefresh = () => {
    requestWeatherUpdate();
  };

  const handleReconnect = () => {
    const socket = socketRef.current;

    if (!socket) {
      return;
    }

    setIsReconnecting(true);
    setConnectionAlert("Attempting to restore the live IO connection...");
    socket.connect();
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
              disabled={refreshing || !isSocketConnected}
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
            isConnected={isSocketConnected}
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
          if (!open && !isReconnecting) {
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
              disabled={isSocketConnected || isReconnecting}
            >
              <RefreshCw
                className={`size-3.5 ${isReconnecting ? "animate-spin" : ""}`}
              />
              {isReconnecting ? "Reconnecting" : "Try reconnecting"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

export default App
