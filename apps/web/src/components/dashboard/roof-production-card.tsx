import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { IsolarDailyProductionPoint } from "@repo/shared";

import { GlassCard } from "@/components/dashboard/glass-card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { buildDailyRoofProduction, roofEastShare } from "@/lib/solar-statistics";
import { useTranslation } from "@/lib/use-translation";
import { cn } from "@/lib/utils";

export function RoofProductionCard({
  dailyTotals,
  className,
}: {
  dailyTotals?: IsolarDailyProductionPoint[];
  className?: string;
}) {
  const { t, locale } = useTranslation();

  const data = useMemo(() => {
    // With live totals we know each day's real production but not its per-roof split,
    // so apportion the real total across East/West using the sample ratio.
    const source =
      dailyTotals && dailyTotals.length > 0
        ? dailyTotals.map((point) => {
            const [year = 0, month = 1, day = 1] = point.date.split("-").map(Number);
            const date = new Date(year, month - 1, day);
            const east = point.productionKwh * roofEastShare(date);
            return {
              date,
              east: Math.round(east * 10) / 10,
              west: Math.round((point.productionKwh - east) * 10) / 10,
            };
          })
        : buildDailyRoofProduction().map((point) => ({
            date: new Date(point.date),
            east: point.eastKwh,
            west: point.westKwh,
          }));

    return source.map((point) => ({
      day: point.date.toLocaleDateString(locale, { day: "numeric", month: "short" }),
      east: point.east,
      west: point.west,
    }));
  }, [dailyTotals, locale]);

  const config = {
    east: { label: t.statistics.eastRoof, color: "#16a99a" },
    west: { label: t.statistics.westRoof, color: "#2e8fe6" },
  } satisfies ChartConfig;

  return (
    <GlassCard className={cn("col-span-12 flex flex-col gap-4 p-6", className)}>
      <div>
        <div className="text-lg font-semibold">{t.statistics.dailyRoofTitle}</div>
        <div className="text-[13px] font-bold text-[#17323a]/55 dark:text-slate-300/60">
          {t.statistics.dailyRoofSubtitle}
        </div>
      </div>

      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <BarChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(value: number) => `${value} ${t.statistics.kwh}`}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="east" stackId="roof" fill="var(--color-east)" radius={[0, 0, 4, 4]} />
          <Bar dataKey="west" stackId="roof" fill="var(--color-west)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </GlassCard>
  );
}
