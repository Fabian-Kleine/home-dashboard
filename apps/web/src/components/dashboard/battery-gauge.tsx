import { cn } from "@/lib/utils";

export function BatteryGauge({ level }: { level: number }) {
  const color =
    level > 60 ? "bg-emerald-500" : level > 25 ? "bg-amber-400" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Charge</span>
        <span className="font-medium text-white">{level}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  );
}
