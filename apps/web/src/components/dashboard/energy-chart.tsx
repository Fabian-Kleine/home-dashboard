import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { EnergyTimePoint } from "@repo/shared";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const chartConfig = {
  production: {
    label: "Production",
    color: "oklch(0.75 0.18 140)",
  },
  consumption: {
    label: "Consumption",
    color: "oklch(0.7 0.15 50)",
  },
} satisfies ChartConfig;

export function EnergyChart({ data }: { data: EnergyTimePoint[] }) {
  return (
    <Card className="border-0 bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-sm font-medium tracking-wide text-slate-400">
          Energy Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-[2.4/1] w-full">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
          >
            <defs>
              <linearGradient id="fillProduction" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-production)"
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-production)"
                  stopOpacity={0.02}
                />
              </linearGradient>
              <linearGradient id="fillConsumption" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-consumption)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-consumption)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
            />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
              interval={2}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
              tickFormatter={(v: number) => `${v}kW`}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="production"
              type="monotone"
              fill="url(#fillProduction)"
              stroke="var(--color-production)"
              strokeWidth={2}
            />
            <Area
              dataKey="consumption"
              type="monotone"
              fill="url(#fillConsumption)"
              stroke="var(--color-consumption)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
