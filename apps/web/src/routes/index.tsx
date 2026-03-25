import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Maximize2,
  Minimize2,
  RefreshCw,
} from "lucide-react";
import {
  API_ROUTES,
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
import { useFullscreen } from "@/components/fullscreen-context";
import { getMockDashboard } from "@/lib/mock-data";
import { WidgetGrid, WidgetHeading } from '@/components/widgets/widget-base';
import {
  BatteryWidget,
  ConsumptionWidget,
  GridWidget,
  ProductionWidget,
  SolarProductionWidget,
  SolarSystemWidgetCompact,
} from '@/components/widgets/solar-widget';
import { CloudCoverageWidget, HumidityWidget, RainWidget, SunriseWidget, SunsetWidget, WeatherWidget, WindWidget } from '@/components/widgets/weather-widget';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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

function HomePage() {
  const [data, setData] = useState<DashboardData>(getMockDashboard);
  const [location, setLocation] = useState<WeatherRequestParams>(DEFAULT_LOCATION);
  const [connectionAlert, setConnectionAlert] = useState<string | null>(null);
  const { isFullscreen, isSupported, toggleFullscreen } = useFullscreen();

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

  const handleReconnect = () => {
    setConnectionAlert("Attempting to reach the weather API...");
    void weatherQuery.refetch();
  };

  return (
    <>
      <div className='fixed flex items-center gap-2 right-2 top-2 sm:right-5'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-lg"
              onClick={() => void toggleFullscreen()}
              disabled={!isSupported}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 /> : <Maximize2 />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isSupported ? (isFullscreen ? "Exit fullscreen" : "Enter fullscreen") : "Fullscreen unavailable"}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-lg" onClick={() => void weatherQuery.refetch()} disabled={weatherQuery.isFetching}>
              <RefreshCw className={`${weatherQuery.isFetching ? "animate-spin" : ""}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh weather data</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-4">
        <div className="w-full px-4 text-3xl font-medium tracking-tighter text-white sm:px-8 lg:px-12">
          Home
        </div>

        <div className="space-y-2">
          <WidgetHeading to="/">
            Weather
          </WidgetHeading>
          <WidgetGrid>
            <WeatherWidget gridArea={{ rowSpan: 2 }} data={data.weather} />
            <div
              className="grid gap-3"
              style={{ gridRow: "span 2" }}
            >
              <CloudCoverageWidget gridArea={{}} data={data.weather} />
              <HumidityWidget gridArea={{}} data={data.weather} />
            </div>
            <div
              className="grid gap-3"
              style={{ gridRow: "span 2" }}
            >
              <WindWidget gridArea={{}} data={data.weather} />
              <RainWidget gridArea={{}} data={data.weather} />
            </div>
            <div
              className="grid gap-3"
              style={{ gridRow: "span 2" }}
            >
              <SunriseWidget gridArea={{}} data={data.weather} />
              <SunsetWidget gridArea={{}} data={data.weather} />
            </div>
          </WidgetGrid>
        </div>

        <div className="space-y-2">
          <WidgetHeading to="/">
            Solar System
          </WidgetHeading>
          <WidgetGrid>
            <SolarSystemWidgetCompact gridArea={{ rowSpan: 2 }} data={data} />
            <BatteryWidget gridArea={{ rowSpan: 2 }} data={data} />
            <div
              className="grid gap-3"
              style={{ gridRow: "span 2" }}
            >
              <ProductionWidget gridArea={{}} data={data} />
              <SolarProductionWidget gridArea={{}} data={data} />
            </div>
            <div
              className="grid gap-3"
              style={{ gridRow: "span 2" }}
            >
              <ConsumptionWidget gridArea={{}} data={data} />
              <GridWidget gridArea={{}} data={data} />
            </div>
          </WidgetGrid>
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
    </>
  );
}

export const Route = createFileRoute('/')({
  component: HomePage,
});
