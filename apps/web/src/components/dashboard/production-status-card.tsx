import { Link } from "@tanstack/react-router";
import { IconArrowRight } from "@tabler/icons-react";
import { PRODUCTION_STATUS, type IsolarSolarData, type ProductionStatus } from "@repo/shared";

import { GlassCard } from "@/components/dashboard/glass-card";
import { IsolarEmptyState } from "@/components/dashboard/isolar-empty-state";
import { SolarDataLoadingState } from "@/components/dashboard/solar-data-loading-state";
import { useTranslation } from "@/lib/use-translation";
import { cn } from "@/lib/utils";

const PRODUCTION_VISUALS: Record<ProductionStatus, { color: string; segments: number }> = {
  good: { color: "#12a05f", segments: 3 },
  average: { color: "#e79a17", segments: 2 },
  reduced: { color: "#e8794b", segments: 1 },
};

export function ProductionStatusCard({
  isSungrowConnected,
  solarData,
  productionStatus,
  kwhToday,
  showDetailsLink = false,
  className,
}: {
  isSungrowConnected: boolean;
  solarData: IsolarSolarData | undefined;
  productionStatus: ProductionStatus;
  kwhToday: number;
  showDetailsLink?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const production = { ...PRODUCTION_VISUALS[productionStatus], label: t.productionStatus[productionStatus] };

  return (
    <GlassCard className={cn("col-span-12 flex flex-col justify-between gap-4 p-6 lg:col-span-5", className)}>
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{t.productionStatus.title}</div>
        {showDetailsLink && (
          <Link to="/solar" className="group flex items-center gap-1 text-[13px] font-extrabold text-[#0f8b7f] no-underline dark:text-teal-300">
            {t.solarSystem.details}
            <IconArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
          </Link>
        )}
      </div>
      {isSungrowConnected ? (
        solarData ? (
          <>
            <div>
              <div className="text-[52px] font-semibold leading-none" style={{ color: production.color }}>
                {production.label}
              </div>
              <div className="mt-1.5 text-[13.5px] font-bold text-[#17323a]/55 dark:text-slate-300/65">
                {t.productionStatus.kwhToday(kwhToday.toFixed(1))}
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
                  {t.productionStatus.reduced}
                </span>
                <span
                  className="flex-1 text-center"
                  style={productionStatus === PRODUCTION_STATUS.average ? { color: production.color } : undefined}
                >
                  {t.productionStatus.average}
                </span>
                <span
                  className="flex-1 text-right"
                  style={productionStatus === PRODUCTION_STATUS.good ? { color: production.color } : undefined}
                >
                  {t.productionStatus.good}
                </span>
              </div>
            </div>
          </>
        ) : (
          <SolarDataLoadingState />
        )
      ) : (
        <IsolarEmptyState message={t.productionStatus.emptyState} />
      )}
    </GlassCard>
  );
}
