import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { IsolarRoofPowerPoint } from "@repo/shared";

import { GlassCard } from "@/components/dashboard/glass-card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { buildRoofPowerHistory } from "@/lib/solar-statistics";
import { useTranslation } from "@/lib/use-translation";
import { cn } from "@/lib/utils";

export function RoofPowerCard({
  data: liveData,
  className,
}: {
  data?: IsolarRoofPowerPoint[];
  className?: string;
}) {
  const { t, locale } = useTranslation();

  const data = useMemo(() => {
    const source = liveData && liveData.length > 0 ? liveData : buildRoofPowerHistory();
    return source.map((point) => ({
      label: new Date(point.time).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
      east: point.east,
      west: point.west,
    }));
  }, [liveData, locale]);

  const config = {
    east: { label: t.statistics.eastRoof, color: "#16a99a" },
    west: { label: t.statistics.westRoof, color: "#2e8fe6" },
  } satisfies ChartConfig;

  return (
    <GlassCard className={cn("col-span-12 flex flex-col gap-4 p-6", className)}>
      <div>
        <div className="text-lg font-semibold">{t.statistics.roofPowerTitle}</div>
        <div className="text-[13px] font-bold text-[#17323a]/55 dark:text-slate-300/60">
          {t.statistics.roofPowerSubtitle}
        </div>
      </div>

      <ChartContainer config={config} className="aspect-auto h-72 w-full">
        <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
          <defs>
            <linearGradient id="fillEastPower" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-east)" stopOpacity={0.6} />
              <stop offset="95%" stopColor="var(--color-east)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillWestPower" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-west)" stopOpacity={0.6} />
              <stop offset="95%" stopColor="var(--color-west)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={48}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(value: number) => `${value} ${t.statistics.kw}`}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            dataKey="east"
            type="natural"
            stackId="roof"
            stroke="var(--color-east)"
            strokeWidth={2}
            fill="url(#fillEastPower)"
          />
          <Area
            dataKey="west"
            type="natural"
            stackId="roof"
            stroke="var(--color-west)"
            strokeWidth={2}
            fill="url(#fillWestPower)"
          />
        </AreaChart>
      </ChartContainer>
    </GlassCard>
  );
}
