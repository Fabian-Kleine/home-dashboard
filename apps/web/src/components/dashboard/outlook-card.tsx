import { GlassCard } from "@/components/dashboard/glass-card";

export function OutlookCard({ summary }: { summary: string }) {
  return (
    <GlassCard className="col-span-12 flex items-start gap-4 p-6">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#16a99a] to-[#2e8fe6] text-[15px] font-semibold text-white">
        AI
      </div>
      <div>
        <div className="mb-1.5 text-base font-semibold">Today's outlook</div>
        <div className="max-w-235 text-[15px] font-semibold leading-relaxed text-[#17323a]/70 dark:text-slate-200/80">
          {summary}
        </div>
      </div>
    </GlassCard>
  );
}
