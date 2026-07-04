import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { IsolarMonthlyProductionPoint } from "@repo/shared";

import { GlassCard } from "@/components/dashboard/glass-card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { buildMonthlyProduction } from "@/lib/solar-statistics";
import { useTranslation } from "@/lib/use-translation";
import { cn } from "@/lib/utils";

export function MonthlyProductionCard({
  data: liveData,
  className,
}: {
  data?: IsolarMonthlyProductionPoint[];
  className?: string;
}) {
  const { t, locale } = useTranslation();

  const data = useMemo(() => {
    const source =
      liveData && liveData.length > 0
        ? liveData.map((point) => {
            const [year = 0, month = 1] = point.month.split("-").map(Number);
            return { date: new Date(year, month - 1, 1), production: point.productionKwh };
          })
        : buildMonthlyProduction().map((point) => ({
            date: new Date(point.date),
            production: point.productionKwh,
          }));

    return source.map((point) => ({
      month: point.date.toLocaleDateString(locale, { month: "short" }),
      production: Math.round(point.production),
    }));
  }, [liveData, locale]);

  const config = {
    production: { label: t.statistics.production, color: "#16a99a" },
  } satisfies ChartConfig;

  return (
    <GlassCard className={cn("col-span-12 flex flex-col gap-4 p-6", className)}>
      <div>
        <div className="text-lg font-semibold">{t.statistics.monthlyTitle}</div>
        <div className="text-[13px] font-bold text-[#17323a]/55 dark:text-slate-300/60">
          {t.statistics.monthlySubtitle}
        </div>
      </div>

      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
          <defs>
            <linearGradient id="fillMonthlyProduction" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-production)" stopOpacity={0.6} />
              <stop offset="95%" stopColor="var(--color-production)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(value: number) => `${value} ${t.statistics.kwh}`}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Area
            dataKey="production"
            type="natural"
            stroke="var(--color-production)"
            strokeWidth={2}
            fill="url(#fillMonthlyProduction)"
          />
        </AreaChart>
      </ChartContainer>
    </GlassCard>
  );
}
