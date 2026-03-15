import {
  Cloud,
  Droplets,
  LoaderCircle,
  Sunrise,
  Sunset,
  Wind,
} from "lucide-react";
import type { CurrentWeatherData } from "@repo/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeatherIcon } from "@/components/dashboard/weather-icon";

function formatTime(value: string) {
  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function describeWeather(weatherCode: number) {
  if (weatherCode === 0) {
    return "Clear sky";
  }

  if (weatherCode === 1 || weatherCode === 2) {
    return "Partly cloudy";
  }

  if (weatherCode === 3) {
    return "Overcast";
  }

  if (weatherCode === 45 || weatherCode === 48) {
    return "Foggy";
  }

  if ([51, 53, 55, 56, 57].includes(weatherCode)) {
    return "Drizzle";
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return "Rain showers";
  }

  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return "Snow";
  }

  if ([95, 96, 99].includes(weatherCode)) {
    return "Thunderstorm";
  }

  return "Current conditions";
}

type WeatherCardProps = {
  data: CurrentWeatherData;
  isLoading?: boolean;
  error?: string | null;
  isConnected?: boolean;
};

export function WeatherCard({
  data,
  isLoading = false,
  error = null,
  isConnected = false,
}: WeatherCardProps) {
  const statusText = isLoading
    ? "Refreshing live weather..."
    : error
      ? error
      : isConnected
        ? ""
        : "Connecting to live weather...";

  return (
    <Card className="border-0 bg-linear-to-br from-sky-950 to-slate-900 text-white shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-medium tracking-wide text-sky-300/80">
              Weather Forecast
            </CardTitle>
            <div className="mt-2 flex items-center gap-2 text-xs text-sky-200/70">
              {isLoading ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
              <span>{statusText}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className={`space-y-5 transition-opacity ${isLoading ? "opacity-75" : "opacity-100"}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-5xl font-bold tracking-tighter">
              {data.temperature.toFixed(0)}°
            </p>
            <p className="mt-1 text-sm text-sky-200/70">
              {describeWeather(data.weatherCode)}
            </p>
          </div>
          <WeatherIcon iconName={data.weatherIcon} />
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex flex-col items-center gap-1 text-xs text-sky-200/70">
            <Droplets className="size-4" />
            <span className="font-medium text-white">{data.relativeHumidity}%</span>
            Humidity
          </div>
          <div className="flex flex-col items-center gap-1 text-xs text-sky-200/70">
            <Wind className="size-4" />
            <span className="font-medium text-white">
              {data.windSpeed.toFixed(2)} km/h
            </span>
            Wind
          </div>
          <div className="flex flex-col items-center gap-1 text-xs text-sky-200/70">
            <Cloud className="size-4" />
            <span className="font-medium text-white">{data.cloudCover}%</span>
            Cloud Cover
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs text-sky-200/70">
          <div className="flex items-center gap-1.5">
            <Sunrise className="size-3.5" />
            {formatTime(data.sunrise)}
          </div>
          <div className="flex items-center gap-1.5">
            <Sunset className="size-3.5" />
            {formatTime(data.sunset)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
