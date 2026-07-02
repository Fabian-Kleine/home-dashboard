import { Link } from "@tanstack/react-router";
import {
  IconArrowRight,
  IconCloud,
  IconDroplet,
  IconSunrise,
  IconSunset,
  IconUmbrella,
  IconWind,
  type Icon as TablerIcon,
} from "@tabler/icons-react";
import type { CurrentWeatherData } from "@repo/shared";

import { GlassCard } from "@/components/dashboard/glass-card";

function formatTime(value: string) {
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function WeatherNowCard({ weather }: { weather: CurrentWeatherData }) {
  const metrics: { label: string; value: string; unit?: string; color: string; icon: TablerIcon }[] = [
    { label: "CLOUD", value: String(weather.cloudCover), unit: "%", color: "#2e8fe6", icon: IconCloud },
    { label: "HUMIDITY", value: String(weather.relativeHumidity), unit: "%", color: "#16a99a", icon: IconDroplet },
    { label: "WIND", value: String(Math.round(weather.windSpeed)), unit: "km/h", color: "#6a72e8", icon: IconWind },
    { label: "PRECIP", value: weather.precipitation.toFixed(1), unit: "mm", color: "#0ea5e9", icon: IconUmbrella },
    { label: "SUNRISE", value: formatTime(weather.sunrise), color: "#f2a52c", icon: IconSunrise },
    { label: "SUNSET", value: formatTime(weather.sunset), color: "#f2734f", icon: IconSunset },
  ];

  return (
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
  );
}
