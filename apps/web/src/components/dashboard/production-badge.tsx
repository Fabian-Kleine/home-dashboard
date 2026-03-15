import { Leaf, TrendingDown, TrendingUp } from "lucide-react";
import type { ProductionStatus } from "@repo/shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  ProductionStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  good: {
    label: "Good production",
    icon: <TrendingUp className="size-3" />,
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  average: {
    label: "Average production",
    icon: <Leaf className="size-3" />,
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  reduced: {
    label: "Reduced production",
    icon: <TrendingDown className="size-3" />,
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
};

export function ProductionBadge({ status }: { status: ProductionStatus }) {
  const cfg = statusConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 px-3 py-1 text-xs font-medium", cfg.className)}
    >
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}
