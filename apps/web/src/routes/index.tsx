import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
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
import { useTranslation } from "@/lib/use-translation";
import type { TranslationDict } from "@/lib/translations";
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

/** Fallback values for the parts of DashboardData that aren't sourced from a live query (Sungrow numbers are overridden once connected; these are only rendered before then, behind the Sungrow empty states). */
const FALLBACK_DASHBOARD_DATA: DashboardData = {
  weather: {
    temperature: 0,
    relativeHumidity: 0,
    apparentTemperature: 0,
    precipitation: 0,
    rain: 0,
    weatherCode: 0,
    weatherIcon: "clear-day",
    cloudCover: 0,
    windSpeed: 0,
    sunrise: "",
    sunset: "",
  },
  solar: { current: 0, unit: "kW" },
  grid: { current: 0, unit: "kW" },
  battery: { current: 0, unit: "kW", level: 0 },
  consumption: { current: 0, unit: "kW" },
  productionStatus: PRODUCTION_STATUS.reduced,
  energyHistory: [],
  summary:
    "Placeholder — Mostly sunny today with high solar yield expected. Current production is covering 85% of household consumption. Battery will reach full charge by 14:00. Grid dependency is minimal.",
  lastUpdated: new Date().toISOString(),
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

function greetingForHour(hour: number, greeting: TranslationDict["greeting"]) {
  if (hour < 12) return greeting.morning;
  if (hour < 18) return greeting.afternoon;
  return greeting.evening;
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
  const data = FALLBACK_DASHBOARD_DATA;
  const [location, setLocation] = useState<WeatherRequestParams>(DEFAULT_LOCATION);
  const { isFullscreen, isSupported, toggleFullscreen, container } = useFullscreen();
  const { theme, setTheme, language, setLanguage } = useSettings();
  const { isLoggedIn: isSungrowConnected, openLoginDialog, logout: disconnectSungrow, solarData, refetchSolarData } = useIsolar();
  const { t, locale } = useTranslation();

  const weatherQuery = useQuery({
    queryKey: ["weather", location.latitude, location.longitude, location.timezone],
    queryFn: ({ signal }) => fetchWeather(location, signal),
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: REFRESH_INTERVAL_MS - 1_000,
  });

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
    label: weatherQuery.isFetching ? t.header.refreshingData : t.header.refreshData,
  });

  useEffect(() => {
    const id = setInterval(handlePageRefresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [handlePageRefresh]);

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

  const now = new Date();
  const weather = weatherQuery.data;
  const isWeatherOutdated = weatherQuery.isError && weather !== undefined;

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
    <div className="min-h-screen w-full px-5 py-6 sm:px-8 lg:px-10">
      <header className="mb-5 flex items-center justify-between gap-4 px-1">
        <div className="min-w-0">
          <div className="truncate text-2xl font-semibold tracking-tight">{greetingForHour(now.getHours(), t.greeting)}</div>
          <div className="mt-0.5 text-[13.5px] font-bold text-[#17323a]/60 dark:text-slate-300/70">
            {now.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" })}
            {" · "}
            {now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handlePageRefresh}
            disabled={weatherQuery.isFetching}
            aria-label={weatherQuery.isFetching ? t.header.refreshingData : t.header.refreshData}
            className="flex size-10 items-center justify-center rounded-2xl border border-white/40 bg-white/25 text-[#17323a]/55 backdrop-blur-md transition-colors hover:bg-white/45 hover:text-[#0f7d74] disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-slate-300/70 dark:hover:bg-white/15 dark:hover:text-teal-300"
          >
            <IconRefresh className={cn("size-4.5", weatherQuery.isFetching && "animate-spin")} />
          </button>
          {isSupported && (
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              aria-label={isFullscreen ? t.header.exitFullscreen : t.header.enterFullscreen}
              className="flex size-10 items-center justify-center rounded-2xl border border-white/40 bg-white/25 text-[#17323a]/55 backdrop-blur-md transition-colors hover:bg-white/45 hover:text-[#0f7d74] dark:border-white/10 dark:bg-white/10 dark:text-slate-300/70 dark:hover:bg-white/15 dark:hover:text-teal-300"
            >
              {isFullscreen ? <IconArrowsDiagonalMinimize2 className="size-4.5" /> : <IconArrowsDiagonal className="size-4.5" />}
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t.header.moreOptions}
                className="flex size-10 items-center justify-center rounded-2xl border border-white/40 bg-white/25 text-[#17323a]/55 backdrop-blur-md transition-colors hover:bg-white/45 hover:text-[#0f7d74] aria-expanded:bg-white/45 aria-expanded:text-[#0f7d74] dark:border-white/10 dark:bg-white/10 dark:text-slate-300/70 dark:hover:bg-white/15 dark:hover:text-teal-300 dark:aria-expanded:bg-white/15 dark:aria-expanded:text-teal-300"
              >
                <IconDotsVertical className="size-4.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" container={container ?? undefined}>
              <DropdownMenuItem onSelect={handlePageRefresh} disabled={weatherQuery.isFetching}>
                <IconRefresh className={cn(weatherQuery.isFetching && "animate-spin")} />
                {weatherQuery.isFetching ? t.header.refreshingData : t.header.refreshData}
              </DropdownMenuItem>
              {isSupported && (
                <DropdownMenuItem onSelect={() => void toggleFullscreen()}>
                  {isFullscreen ? <IconArrowsDiagonalMinimize2 /> : <IconArrowsDiagonal />}
                  {isFullscreen ? t.header.exitFullscreen : t.header.enterFullscreen}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <IconLanguage />
                  {t.header.language}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={language}
                    onValueChange={(value) => setLanguage(value as Language)}
                  >
                    <DropdownMenuRadioItem value="de">Deutsch</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="nl">Nederlands</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <IconPalette />
                  {t.header.theme}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={theme}
                    onValueChange={(value) => setTheme(value as ThemeMode)}
                  >
                    <DropdownMenuRadioItem value="auto">{t.theme.auto}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">{t.theme.system}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="light">{t.theme.light}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">{t.theme.dark}</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => (isSungrowConnected ? disconnectSungrow() : openLoginDialog())}
              >
                {isSungrowConnected ? <IconLogout /> : <IconPlugConnected />}
                {isSungrowConnected ? t.sungrow.logout : t.sungrow.connect}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4">
        <WeatherHeroCard
          weather={weather}
          isLoading={weatherQuery.isLoading}
          isOutdated={isWeatherOutdated}
          isRetrying={weatherQuery.isFetching}
          onRetry={handlePageRefresh}
        />

        <ProductionStatusCard
          isSungrowConnected={isSungrowConnected}
          solarData={solarData}
          productionStatus={displayData.productionStatus}
          kwhToday={kwhToday}
        />

        <WeatherNowCard
          weather={weather}
          isLoading={weatherQuery.isLoading}
          isOutdated={isWeatherOutdated}
          isRetrying={weatherQuery.isFetching}
          onRetry={handlePageRefresh}
        />

        <SolarSystemCard isSungrowConnected={isSungrowConnected} solarData={solarData} displayData={displayData} />

        <PowerFlowCard isSungrowConnected={isSungrowConnected} solarData={solarData} displayData={displayData} />

        <OutlookCard summary={data.summary} />
      </div>
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: HomePage,
});
