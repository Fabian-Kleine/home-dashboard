import { PRODUCTION_STATUS, type IsolarSolarData, type ProductionStatus } from "@repo/shared";

import { GlassCard } from "@/components/dashboard/glass-card";
import { IsolarEmptyState } from "@/components/dashboard/isolar-empty-state";
import { SolarDataLoadingState } from "@/components/dashboard/solar-data-loading-state";

const PRODUCTION_CONFIG: Record<ProductionStatus, { label: string; color: string; segments: number }> = {
  good: { label: "Good", color: "#12a05f", segments: 3 },
  average: { label: "Average", color: "#e79a17", segments: 2 },
  reduced: { label: "Reduced", color: "#e8794b", segments: 1 },
};

export function ProductionStatusCard({
  isSungrowConnected,
  solarData,
  productionStatus,
  kwhToday,
}: {
  isSungrowConnected: boolean;
  solarData: IsolarSolarData | undefined;
  productionStatus: ProductionStatus;
  kwhToday: number;
}) {
  const production = PRODUCTION_CONFIG[productionStatus];

  return (
    <GlassCard className="col-span-12 flex flex-col justify-between gap-4 p-6 lg:col-span-5">
      <div className="text-lg font-semibold">Production Status</div>
      {isSungrowConnected ? (
        solarData ? (
          <>
            <div>
              <div className="text-[52px] font-semibold leading-none" style={{ color: production.color }}>
                {production.label}
              </div>
              <div className="mt-1.5 text-[13.5px] font-bold text-[#17323a]/55 dark:text-slate-300/65">
                {kwhToday.toFixed(1)} kWh generated today
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-2 flex-1 rounded-full"
                    style={{ background: i < production.segments ? production.color : "var(--track-muted)" }}
                  />
                ))}
              </div>
              <div className="flex gap-2 text-[11px] font-extrabold text-[#17323a]/40 dark:text-slate-400/50">
                <span
                  className="flex-1 text-left"
                  style={productionStatus === PRODUCTION_STATUS.reduced ? { color: production.color } : undefined}
                >
                  Reduced
                </span>
                <span
                  className="flex-1 text-center"
                  style={productionStatus === PRODUCTION_STATUS.average ? { color: production.color } : undefined}
                >
                  Average
                </span>
                <span
                  className="flex-1 text-right"
                  style={productionStatus === PRODUCTION_STATUS.good ? { color: production.color } : undefined}
                >
                  Good
                </span>
              </div>
            </div>
          </>
        ) : (
          <SolarDataLoadingState />
        )
      ) : (
        <IsolarEmptyState message="Connect your Sungrow account to see production status" />
      )}
    </GlassCard>
  );
}
