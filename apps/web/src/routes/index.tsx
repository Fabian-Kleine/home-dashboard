import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IconAlertTriangle,
  IconArrowsDiagonal,
  IconArrowsDiagonalMinimize2,
  IconDotsVertical,
  IconLanguage,
  IconLogout,
  IconPalette,
  IconPlugConnected,
  IconRefresh,
} from "@tabler/icons-react";
import {
  API_ROUTES,
  PRODUCTION_STATUS,
  type DashboardData,
  type ProductionStatus,
  type WeatherData,
  type WeatherRequestParams,
} from "@repo/shared";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFullscreen } from "@/components/fullscreen-context";
import { useIsolar } from "@/components/isolar-context";
import { useRegisterPageRefresh } from "@/components/page-refresh-context";
import { useSettings, type Language, type ThemeMode } from "@/components/settings-context";
import { getMockDashboard } from "@/lib/mock-data";
import { WeatherHeroCard } from "@/components/dashboard/weather-hero-card";
import { ProductionStatusCard } from "@/components/dashboard/production-status-card";
import { WeatherNowCard } from "@/components/dashboard/weather-now-card";
import { SolarSystemCard } from "@/components/dashboard/solar-system-card";
import { PowerFlowCard } from "@/components/dashboard/power-flow-card";
import { OutlookCard } from "@/components/dashboard/outlook-card";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";

const DEFAULT_LOCATION: WeatherRequestParams = {
  latitude: Number(import.meta.env.VITE_DEFAULT_WEATHER_LATITUDE ?? 51.5072),
  longitude: Number(import.meta.env.VITE_DEFAULT_WEATHER_LONGITUDE ?? -0.1276),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
};

async function fetchWeather(location: WeatherRequestParams, signal?: AbortSignal) {
  const url = new URL(API_ROUTES.weather, BACKEND_URL);
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("timezone", location.timezone);

  const response = await fetch(url, { credentials: "include", signal });
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

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** No direct "status" field exists on iSolarCloud's real-time data, so derive one from how much of current load solar is covering. */
function deriveProductionStatus(solarKw: number, loadKw: number): ProductionStatus {
  if (loadKw <= 0) return solarKw > 0 ? PRODUCTION_STATUS.good : PRODUCTION_STATUS.reduced;
  const ratio = solarKw / loadKw;
  if (ratio >= 0.8) return PRODUCTION_STATUS.good;
  if (ratio >= 0.4) return PRODUCTION_STATUS.average;
  return PRODUCTION_STATUS.reduced;
}

function HomePage() {
  const [data, setData] = useState<DashboardData>(getMockDashboard);
  const [location, setLocation] = useState<WeatherRequestParams>(DEFAULT_LOCATION);
  const [connectionAlert, setConnectionAlert] = useState<string | null>(null);
  const { isFullscreen, isSupported, toggleFullscreen, container } = useFullscreen();
  const { theme, setTheme, language, setLanguage } = useSettings();
  const { isLoggedIn: isSungrowConnected, openLoginDialog, logout: disconnectSungrow, solarData, refetchSolarData } = useIsolar();

  const weatherQuery = useQuery({
    queryKey: ["weather", location.latitude, location.longitude, location.timezone],
    queryFn: ({ signal }) => fetchWeather(location, signal),
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: REFRESH_INTERVAL_MS - 1_000,
  });

  const isRetrying = weatherQuery.isFetching && connectionAlert !== null;

  const handlePageRefresh = useCallback(() => {
    void weatherQuery.refetch();
    if (isSungrowConnected) {
      void refetchSolarData();
    }
  }, [weatherQuery.refetch, isSungrowConnected, refetchSolarData]);

  useRegisterPageRefresh({
    onRefresh: handlePageRefresh,
    isRefreshing: weatherQuery.isFetching,
    disabled: weatherQuery.isFetching,
    label: weatherQuery.isFetching ? "Refreshing data" : "Refresh data",
  });

  useEffect(() => {
    if (!weatherQuery.data) return;

    setData((currentData) => ({
      ...currentData,
      weather: weatherQuery.data,
      lastUpdated: new Date().toISOString(),
    }));
    setConnectionAlert(null);
  }, [weatherQuery.data]);

  useEffect(() => {
    if (!weatherQuery.isError) return;
    setConnectionAlert("The backend weather API is unavailable.");
  }, [weatherQuery.isError]);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        });
      },
      () => setLocation(DEFAULT_LOCATION),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: REFRESH_INTERVAL_MS }
    );
  }, []);

  const handleReconnect = () => {
    setConnectionAlert("Attempting to reach the weather API...");
    void weatherQuery.refetch();
  };

  const now = new Date();
  const weather = data.weather;

  const displayData: DashboardData =
    isSungrowConnected && solarData
      ? {
        ...data,
        solar: { current: solarData.solarPowerKw, unit: "kW" },
        grid: { current: solarData.gridPowerKw, unit: "kW" },
        battery: { current: solarData.batteryPowerKw, unit: "kW", level: Math.round(solarData.batteryLevel) },
        consumption: { current: solarData.loadPowerKw, unit: "kW" },
        productionStatus: deriveProductionStatus(solarData.solarPowerKw, solarData.loadPowerKw),
      }
      : data;

  const kwhToday =
    isSungrowConnected && solarData
      ? solarData.dailyYieldKwh
      : data.energyHistory.reduce((sum, point) => sum + point.production, 0);

  return (
    <>
      <div className="min-h-screen w-full px-5 py-6 sm:px-8 lg:px-10">
        <header className="mb-5 flex items-center justify-between gap-4 px-1">
          <div className="min-w-0">
            <div className="truncate text-2xl font-semibold tracking-tight">{greetingForHour(now.getHours())}</div>
            <div className="mt-0.5 text-[13.5px] font-bold text-[#17323a]/60 dark:text-slate-300/70">
              {now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              {" · "}
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handlePageRefresh}
              disabled={weatherQuery.isFetching}
              aria-label={weatherQuery.isFetching ? "Refreshing data" : "Refresh data"}
              className="flex size-10 items-center justify-center rounded-2xl border border-white/40 bg-white/25 text-[#17323a]/55 backdrop-blur-md transition-colors hover:bg-white/45 hover:text-[#0f7d74] disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-slate-300/70 dark:hover:bg-white/15 dark:hover:text-teal-300"
            >
              <IconRefresh className={cn("size-4.5", weatherQuery.isFetching && "animate-spin")} />
            </button>
            {isSupported && (
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                className="flex size-10 items-center justify-center rounded-2xl border border-white/40 bg-white/25 text-[#17323a]/55 backdrop-blur-md transition-colors hover:bg-white/45 hover:text-[#0f7d74] dark:border-white/10 dark:bg-white/10 dark:text-slate-300/70 dark:hover:bg-white/15 dark:hover:text-teal-300"
              >
                {isFullscreen ? <IconArrowsDiagonalMinimize2 className="size-4.5" /> : <IconArrowsDiagonal className="size-4.5" />}
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="More options"
                  className="flex size-10 items-center justify-center rounded-2xl border border-white/40 bg-white/25 text-[#17323a]/55 backdrop-blur-md transition-colors hover:bg-white/45 hover:text-[#0f7d74] aria-expanded:bg-white/45 aria-expanded:text-[#0f7d74] dark:border-white/10 dark:bg-white/10 dark:text-slate-300/70 dark:hover:bg-white/15 dark:hover:text-teal-300 dark:aria-expanded:bg-white/15 dark:aria-expanded:text-teal-300"
                >
                  <IconDotsVertical className="size-4.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" container={container ?? undefined}>
                <DropdownMenuItem onSelect={handlePageRefresh} disabled={weatherQuery.isFetching}>
                  <IconRefresh className={cn(weatherQuery.isFetching && "animate-spin")} />
                  {weatherQuery.isFetching ? "Refreshing data" : "Refresh data"}
                </DropdownMenuItem>
                {isSupported && (
                  <DropdownMenuItem onSelect={() => void toggleFullscreen()}>
                    {isFullscreen ? <IconArrowsDiagonalMinimize2 /> : <IconArrowsDiagonal />}
                    {isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <IconLanguage />
                    Language
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={language}
                      onValueChange={(value) => setLanguage(value as Language)}
                    >
                      <DropdownMenuRadioItem value="de">Deutsch</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <IconPalette />
                    Theme
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={theme}
                      onValueChange={(value) => setTheme(value as ThemeMode)}
                    >
                      <DropdownMenuRadioItem value="auto">Auto</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => (isSungrowConnected ? disconnectSungrow() : openLoginDialog())}
                >
                  {isSungrowConnected ? <IconLogout /> : <IconPlugConnected />}
                  {isSungrowConnected ? "Log out from Sungrow" : "Connect Sungrow account"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-4">
          <WeatherHeroCard weather={weather} />

          <ProductionStatusCard
            isSungrowConnected={isSungrowConnected}
            solarData={solarData}
            productionStatus={displayData.productionStatus}
            kwhToday={kwhToday}
          />

          <WeatherNowCard weather={weather} />

          <SolarSystemCard isSungrowConnected={isSungrowConnected} solarData={solarData} displayData={displayData} />

          <PowerFlowCard isSungrowConnected={isSungrowConnected} solarData={solarData} displayData={displayData} />

          <OutlookCard summary={data.summary} />
        </div>
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
              <IconAlertTriangle className="size-5" />
            </div>
            <AlertDialogHeader>
              <AlertDialogTitle>Live connection unavailable</AlertDialogTitle>
              <AlertDialogDescription>{connectionAlert}</AlertDialogDescription>
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
              <IconRefresh className={`size-3.5 ${isRetrying ? "animate-spin" : ""}`} />
              {isRetrying ? "Retrying" : "Try again"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export const Route = createFileRoute('/')({
  component: HomePage,
});
