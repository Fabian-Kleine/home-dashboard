import {
  Droplets,
  Sunrise,
  Sunset,
  Wind,
} from "lucide-react";
import type { WeatherData } from "@repo/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeatherIcon } from "@/components/dashboard/weather-icon";

function getDayOrNight(data: WeatherData): "day" | "night" {
  if (data.icon.toLowerCase().includes("night")) {
    return "night";
  }

  return "day";
}

export function WeatherCard({ data }: { data: WeatherData }) {
  const dayOrNight = getDayOrNight(data);

  return (
    <Card className="border-0 bg-gradient-to-br from-sky-950 to-slate-900 text-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-sm font-medium tracking-wide text-sky-300/80">
          Weather Forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-5xl font-bold tracking-tighter">
              {data.temperature}°
            </p>
            <p className="mt-1 text-sm text-sky-200/70">{data.condition}</p>
          </div>
          <WeatherIcon weather={data.icon} dayOrNight={dayOrNight} />
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex flex-col items-center gap-1 text-xs text-sky-200/70">
            <Droplets className="size-4" />
            <span className="font-medium text-white">{data.humidity}%</span>
            Humidity
          </div>
          <div className="flex flex-col items-center gap-1 text-xs text-sky-200/70">
            <Wind className="size-4" />
            <span className="font-medium text-white">
              {data.windSpeed} km/h
            </span>
            Wind
          </div>
          <div className="flex flex-col items-center gap-1 text-xs text-sky-200/70">
            <Sunrise className="size-4" />
            <span className="font-medium text-white">{data.sunrise}</span>
            Sunrise
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs text-sky-200/70">
          <div className="flex items-center gap-1.5">
            <Sunrise className="size-3.5" />
            {data.sunrise}
          </div>
          <div className="flex items-center gap-1.5">
            <Sunset className="size-3.5" />
            {data.sunset}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
