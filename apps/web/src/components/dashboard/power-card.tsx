import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PowerCardProps {
  title: string;
  value: number;
  unit: string;
  icon: ReactNode;
  accent: string;
  subtitle?: string;
  extra?: ReactNode;
}

export function PowerCard({
  title,
  value,
  unit,
  icon,
  accent,
  subtitle,
  extra,
}: PowerCardProps) {
  return (
    <Card className="border-0 bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-lg">
      <CardContent className="flex flex-col gap-3 pt-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide text-slate-400">
            {title}
          </span>
          <div className={cn("rounded-lg bg-white/5 p-2", accent)}>{icon}</div>
        </div>
        <div>
          <p className="text-3xl font-bold tracking-tight">
            {value.toFixed(2)}
            <span className="ml-1 text-base font-medium text-slate-400">
              {unit}
            </span>
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
        {extra}
      </CardContent>
    </Card>
  );
}
