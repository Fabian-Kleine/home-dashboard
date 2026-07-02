import { IconCloud } from "@tabler/icons-react";
import type { WeatherData } from "@repo/shared";

import { GlassCard } from "@/components/dashboard/glass-card";
import { describeWeather } from "@/components/dashboard/weather-hero-card";
import { WeatherEmptyState } from "@/components/dashboard/weather-empty-state";
import { WeatherIcon } from "@/components/dashboard/weather-icon";
import { WeatherLoadingState } from "@/components/dashboard/weather-loading-state";
import { WeatherOutdatedBadge } from "@/components/dashboard/weather-outdated-badge";
import { useTranslation } from "@/lib/use-translation";

function parseLocalDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function WeatherForecastCard({
  daily,
  isLoading,
  isOutdated,
  isRetrying,
  onRetry,
}: {
  daily: WeatherData["daily"] | undefined;
  isLoading: boolean;
  isOutdated: boolean;
  isRetrying: boolean;
  onRetry: () => void;
}) {
  const { t, locale } = useTranslation();

  if (!daily || daily.time.length === 0) {
    return (
      <GlassCard className="col-span-12 flex min-h-40 flex-col p-6 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
        <div className="mb-4 text-lg font-semibold">{t.weatherForecast.title}</div>
        {isLoading ? <WeatherLoadingState /> : <WeatherEmptyState onRetry={onRetry} isRetrying={isRetrying} />}
      </GlassCard>
    );
  }

  return (
    <GlassCard className="col-span-12 flex flex-col p-6 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
      <div className="mb-4 flex items-center gap-2">
        <div className="text-lg font-semibold">{t.weatherForecast.title}</div>
        {isOutdated && <WeatherOutdatedBadge />}
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        {daily.time.map((date, index) => (
          <div
            key={date}
            className="flex items-center gap-3 rounded-2xl bg-white/25 px-3.5 py-2.5 dark:bg-white/10"
          >
            <div className="w-16 shrink-0 text-[13px] font-extrabold text-[#17323a]/70 dark:text-slate-300/75">
              {index === 0
                ? t.weatherForecast.today
                : parseLocalDate(date).toLocaleDateString(locale, { weekday: "short" })}
            </div>
            <WeatherIcon iconName={daily.weatherIcon[index] ?? "clear-day"} className="size-9 shrink-0" />
            <div className="min-w-0 flex-1 truncate text-[13px] font-bold text-[#17323a]/60 dark:text-slate-300/70">
              {describeWeather(daily.weatherCode[index] ?? 0, t.weatherHero)}
            </div>
            <div className="hidden shrink-0 items-center gap-1 text-[13px] font-bold text-[#17323a]/50 dark:text-slate-300/60 sm:flex">
              <IconCloud className="size-4" />
              {Math.round(daily.cloudCoverMean[index] ?? 0)}%
            </div>
            <div className="flex shrink-0 items-baseline gap-1.5">
              <span className="w-8 text-right text-sm font-semibold">{Math.round(daily.temperatureMax[index] ?? 0)}°</span>
              <span className="w-8 text-right text-[13px] font-bold text-[#17323a]/50 dark:text-slate-300/60">
                {Math.round(daily.temperatureMin[index] ?? 0)}°
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
