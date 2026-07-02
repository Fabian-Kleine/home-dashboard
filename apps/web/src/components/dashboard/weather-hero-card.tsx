import type { CurrentWeatherData } from "@repo/shared";

import { GlassCard } from "@/components/dashboard/glass-card";
import { WeatherIcon } from "@/components/dashboard/weather-icon";

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

export function WeatherHeroCard({ weather }: { weather: CurrentWeatherData }) {
  return (
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
        <div className="mt-3 text-sm font-bold text-[#17323a]/60 dark:text-slate-300/70">
          <span>Feels like {Math.round(weather.apparentTemperature)}°</span>
        </div>
      </div>
    </GlassCard>
  );
}
