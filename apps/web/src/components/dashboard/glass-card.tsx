import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/** shadcn Card styled as a frosted glassmorphism tile (design 2A). */
export function GlassCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Card
      className={cn(
        "gap-0 rounded-3xl border border-white/55 bg-white/45 py-0 text-[#17323a] shadow-[0_8px_26px_rgba(20,80,90,0.1)] ring-0 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:shadow-[0_8px_26px_rgba(0,0,0,0.35)]",
        className
      )}
    >
      {children}
    </Card>
  );
}
