import { useEffect, useState } from "react";
import { API_ROUTES, type WeatherData, type WeatherRequestParams } from "@repo/shared";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";

export const DEFAULT_WEATHER_LOCATION: WeatherRequestParams = {
  latitude: Number(import.meta.env.VITE_DEFAULT_WEATHER_LATITUDE ?? 51.5072),
  longitude: Number(import.meta.env.VITE_DEFAULT_WEATHER_LONGITUDE ?? -0.1276),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
};

export async function fetchWeather(
  location: WeatherRequestParams,
  signal?: AbortSignal
): Promise<WeatherData> {
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

  return payload as WeatherData;
}

/** Resolves the user's location via geolocation, falling back to `DEFAULT_WEATHER_LOCATION`. */
export function useWeatherLocation(maximumAgeMs: number) {
  const [location, setLocation] = useState<WeatherRequestParams>(DEFAULT_WEATHER_LOCATION);

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
      () => setLocation(DEFAULT_WEATHER_LOCATION),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: maximumAgeMs }
    );
  }, [maximumAgeMs]);

  return [location, setLocation] as const;
}
