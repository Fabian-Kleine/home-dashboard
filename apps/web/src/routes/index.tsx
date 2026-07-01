import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconArrowsDiagonal,
  IconArrowsDiagonalMinimize2,
  IconCloud,
  IconDotsVertical,
  IconDroplet,
  IconLanguage,
  IconPalette,
  IconRefresh,
  IconSunrise,
  IconSunset,
  IconUmbrella,
  IconWind,
  type Icon as TablerIcon,
} from "@tabler/icons-react";
import {
  API_ROUTES,
  type DashboardData,
  type ProductionStatus,
  type WeatherData,
  type WeatherRequestParams,
} from "@repo/shared";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CircularProgress } from "@/components/ui/progress";
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
import { useRegisterPageRefresh } from "@/components/page-refresh-context";
import { useSettings, type Language, type ThemeMode } from "@/components/settings-context";
import { getMockDashboard } from "@/lib/mock-data";
import { WeatherIcon } from "@/components/dashboard/weather-icon";
import { PowerFlow } from "@/components/dashboard/power-flow";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";

const DEFAULT_LOCATION: WeatherRequestParams = {
  latitude: Number(import.meta.env.VITE_DEFAULT_WEATHER_LATITUDE ?? 51.5072),
  longitude: Number(import.meta.env.VITE_DEFAULT_WEATHER_LONGITUDE ?? -0.1276),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
};

const PRODUCTION_CONFIG: Record<ProductionStatus, { label: string; color: string; segments: number }> = {
  good: { label: "Good", color: "#12a05f", segments: 3 },
  average: { label: "Average", color: "#e79a17", segments: 2 },
  reduced: { label: "Reduced", color: "#e8794b", segments: 1 },
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

function describeWeather(weatherCode: number) {
  if (weatherCode === 0) return "Clear sky";
  if (weatherCode === 1 || weatherCode === 2) return "Partly cloudy";
  if (weatherCode === 3) return "Overcast";
  if (weatherCode === 45 || weatherCode === 48) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(weatherCode)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return "Rain showers";
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return "Snow";
  if ([95, 96, 99].includes(weatherCode)) return "Thunderstorm";
  return "Current conditions";
}

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatTime(value: string) {
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** shadcn Card styled as a frosted glassmorphism tile (design 2A). */
function GlassCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Card
      className={cn(
        "gap-0 rounded-3xl border border-white/55 bg-white/45 py-0 text-[#17323a] shadow-[0_8px_26px_rgba(20,80,90,0.1)] ring-0 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:shadow-[0_8px_26px_rgba(0,0,0,0.35)]",
        className
      )}
    >
      {children}
    </Card>
  );
}

function HomePage() {
  const [data, setData] = useState<DashboardData>(getMockDashboard);
  const [location, setLocation] = useState<WeatherRequestParams>(DEFAULT_LOCATION);
  const [connectionAlert, setConnectionAlert] = useState<string | null>(null);
  const { isFullscreen, isSupported, toggleFullscreen, container } = useFullscreen();
  const { theme, setTheme, language, setLanguage } = useSettings();

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
  }, [weatherQuery.refetch]);

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
  const production = PRODUCTION_CONFIG[data.productionStatus];
  const kwhToday = data.energyHistory.reduce((sum, point) => sum + point.production, 0);
  const gridExporting = data.grid.current >= 0;

  const metrics: { label: string; value: string; unit?: string; color: string; icon: TablerIcon }[] = [
    { label: "CLOUD", value: String(weather.cloudCover), unit: "%", color: "#2e8fe6", icon: IconCloud },
    { label: "HUMIDITY", value: String(weather.relativeHumidity), unit: "%", color: "#16a99a", icon: IconDroplet },
    { label: "WIND", value: String(Math.round(weather.windSpeed)), unit: "km/h", color: "#6a72e8", icon: IconWind },
    { label: "PRECIP", value: weather.precipitation.toFixed(1), unit: "mm", color: "#0ea5e9", icon: IconUmbrella },
    { label: "SUNRISE", value: formatTime(weather.sunrise), color: "#f2a52c", icon: IconSunrise },
    { label: "SUNSET", value: formatTime(weather.sunset), color: "#f2734f", icon: IconSunset },
  ];

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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-4">
          {/* Weather hero */}
          <GlassCard className="relative col-span-12 flex min-h-52 flex-col justify-between overflow-hidden p-7 lg:col-span-7">
            <WeatherIcon iconName={weather.weatherIcon} className="pointer-events-none absolute right-10 top-5 size-36 opacity-95" />
            <div className="relative top-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/55 px-3 py-1.5 text-[13px] font-extrabold text-[#0f7d74] dark:bg-white/10 dark:text-teal-300">
                <span className="size-2 rounded-full bg-[#16a99a]" />
                {describeWeather(weather.weatherCode)}
              </span>
            </div>
            <div className="relative">
              <div className="text-[86px] font-medium leading-[.9]">{Math.round(weather.temperature)}°</div>
              <div className="mt-3 flex gap-4 text-sm font-bold text-[#17323a]/60 dark:text-slate-300/70">
                <span>Feels like {Math.round(weather.apparentTemperature)}°</span>
                <span className="text-[#17323a]/30 dark:text-slate-400/40">|</span>
                <span>Humidity {weather.relativeHumidity}%</span>
              </div>
            </div>
          </GlassCard>

          {/* Production status */}
          <GlassCard className="col-span-12 flex flex-col justify-between gap-4 p-6 lg:col-span-5">
            <div className="text-lg font-semibold">Production Status</div>
            <div>
              <div className="text-[52px] font-semibold leading-none" style={{ color: production.color }}>
                {production.label}
              </div>
              <div className="mt-1.5 text-[13.5px] font-bold text-[#17323a]/55 dark:text-slate-300/65">
                {kwhToday.toFixed(1)} kWh generated today
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-2 flex-1 rounded-full"
                    style={{ background: i < production.segments ? production.color : "var(--track-muted)" }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[11px] font-extrabold text-[#17323a]/40 dark:text-slate-400/50">
                <span>Reduced</span>
                <span>Average</span>
                <span style={{ color: production.color }}>Good</span>
              </div>
            </div>
          </GlassCard>

          {/* Weather now */}
          <GlassCard className="col-span-12 p-6 lg:col-span-7">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-semibold">Weather now</div>
              <Link to="/weather" className="group flex items-center gap-1 text-[13px] font-extrabold text-[#0f8b7f] no-underline dark:text-teal-300">
                Details
                <IconArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="flex flex-col gap-2.5 rounded-2xl p-3.5"
                  style={{ background: `${metric.color}24` }}
                >
                  <div className="flex items-center justify-between">
                    <metric.icon className="size-6" style={{ color: metric.color }} stroke={2} />
                    <span className="text-[11px] font-extrabold text-[#17323a]/50 dark:text-slate-300/60">{metric.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold">{metric.value}</span>
                    {metric.unit && <span className="text-[13px] font-extrabold text-[#17323a]/50 dark:text-slate-300/60">{metric.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Solar system */}
          <GlassCard className="col-span-12 flex flex-col gap-4 p-6 lg:col-span-5">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Solar system</div>
              <Link to="/solar" className="group flex items-center gap-1 text-[13px] font-extrabold text-[#0f8b7f] no-underline dark:text-teal-300">
                Details
                <IconArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
              </Link>
            </div>
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center gap-1.5">
                <CircularProgress
                  value={data.battery.level}
                  size={88}
                  showLabel
                  renderLabel={(value) => `${value}%`}
                  className="stroke-[#17323a]/10 dark:stroke-white/10"
                  progressClassName="stroke-[#16a99a]"
                  labelClassName="text-lg font-semibold text-[#0f7d74] dark:text-teal-300"
                />
                <div className="text-xs font-extrabold text-[#17323a]/50 dark:text-slate-300/60">BATTERY</div>
              </div>
              <div className="flex flex-1 flex-col gap-3.5">
                <div>
                  <div className="text-[11.5px] font-extrabold text-[#17323a]/50 dark:text-slate-300/60">CURRENT USAGE</div>
                  <div className="mt-0.5 text-2xl font-semibold">{data.consumption.current.toFixed(1)} {data.consumption.unit}</div>
                </div>
                <div>
                  <div className="text-[11.5px] font-extrabold text-[#17323a]/50 dark:text-slate-300/60">
                    {gridExporting ? "GRID EXPORT" : "GRID IMPORT"}
                  </div>
                  <div className="mt-0.5 text-2xl font-semibold" style={{ color: gridExporting ? "#12a05f" : "#e8794b" }}>
                    {gridExporting ? "+" : "-"}
                    {Math.abs(data.grid.current).toFixed(1)} {data.grid.unit}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between border-t border-[#17323a]/10 pt-3.5 text-[11.5px] font-extrabold text-[#17323a]/50 dark:border-white/10 dark:text-slate-300/60">
              <span>SOLAR GENERATED</span>
              <span className="text-[#0f8b7f] dark:text-teal-300">{data.solar.current.toFixed(1)} {data.solar.unit}</span>
            </div>
          </GlassCard>

          {/* Live power flow — widget P1 */}
          <GlassCard className="col-span-12 p-7">
            <div className="mb-5 text-lg font-semibold">Live power flow</div>
            <PowerFlow data={data} />
          </GlassCard>

          {/* AI outlook */}
          <GlassCard className="col-span-12 flex items-start gap-4 p-6">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#16a99a] to-[#2e8fe6] text-[15px] font-semibold text-white">
              AI
            </div>
            <div>
              <div className="mb-1.5 text-base font-semibold">Today's outlook</div>
              <div className="max-w-235 text-[15px] font-semibold leading-relaxed text-[#17323a]/70 dark:text-slate-200/80">
                {data.summary}
              </div>
            </div>
          </GlassCard>
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
