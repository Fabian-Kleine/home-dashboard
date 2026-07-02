import { Link } from "@tanstack/react-router";
import { IconArrowRight } from "@tabler/icons-react";
import type { DashboardData, IsolarSolarData } from "@repo/shared";

import { GlassCard } from "@/components/dashboard/glass-card";
import { IsolarEmptyState } from "@/components/dashboard/isolar-empty-state";
import { SolarDataLoadingState } from "@/components/dashboard/solar-data-loading-state";
import { CircularProgress } from "@/components/ui/progress";
import { useTranslation } from "@/lib/use-translation";

export function SolarSystemCard({
  isSungrowConnected,
  solarData,
  displayData,
}: {
  isSungrowConnected: boolean;
  solarData: IsolarSolarData | undefined;
  displayData: DashboardData;
}) {
  const { t } = useTranslation();
  const gridExporting = displayData.grid.current >= 0;

  return (
    <GlassCard className="col-span-12 flex flex-col gap-4 p-6 lg:col-span-5">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{t.solarSystem.title}</div>
        <Link to="/solar" className="group flex items-center gap-1 text-[13px] font-extrabold text-[#0f8b7f] no-underline dark:text-teal-300">
          {t.solarSystem.details}
          <IconArrowRight className='size-4 transition-transform group-hover:translate-x-1' />
        </Link>
      </div>
      {isSungrowConnected ? (
        solarData ? (
          <>
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-center gap-1.5">
                <CircularProgress
                  value={displayData.battery.level}
                  size={88}
                  showLabel
                  renderLabel={(value) => `${value}%`}
                  className="stroke-[#17323a]/10 dark:stroke-white/10"
                  progressClassName="stroke-[#16a99a]"
                  labelClassName="text-lg font-semibold text-[#0f7d74] dark:text-teal-300"
                />
                <div className="text-xs font-extrabold text-[#17323a]/50 dark:text-slate-300/60">{t.solarSystem.battery}</div>
              </div>
              <div className="flex flex-1 flex-col gap-3.5">
                <div>
                  <div className="text-[11.5px] font-extrabold text-[#17323a]/50 dark:text-slate-300/60">{t.solarSystem.currentUsage}</div>
                  <div className="mt-0.5 text-2xl font-semibold">{displayData.consumption.current.toFixed(1)} {displayData.consumption.unit}</div>
                </div>
                <div>
                  <div className="text-[11.5px] font-extrabold text-[#17323a]/50 dark:text-slate-300/60">
                    {gridExporting ? t.solarSystem.gridExport : t.solarSystem.gridImport}
                  </div>
                  <div className="mt-0.5 text-2xl font-semibold" style={{ color: gridExporting ? "#12a05f" : "#e8794b" }}>
                    {gridExporting ? "+" : "-"}
                    {Math.abs(displayData.grid.current).toFixed(1)} {displayData.grid.unit}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between border-t border-[#17323a]/10 pt-3.5 text-[11.5px] font-extrabold text-[#17323a]/50 dark:border-white/10 dark:text-slate-300/60">
              <span>{t.solarSystem.solarGenerated}</span>
              <span className="text-[#0f8b7f] dark:text-teal-300">{displayData.solar.current.toFixed(1)} {displayData.solar.unit}</span>
            </div>
            {solarData.pvStrings.length > 0 && (
              <div className="flex flex-col gap-2.5">
                {solarData.pvStrings.map((pvString) => {
                  const maxPvPowerKw = Math.max(...solarData.pvStrings.map((s) => s.powerKw), 0.1);
                  const widthPercent = Math.max(4, Math.round((pvString.powerKw / maxPvPowerKw) * 100));

                  return (
                    <div key={pvString.label} className="flex flex-col gap-1">
                      <div className="flex items-baseline justify-between text-[13px] font-bold text-[#17323a]/70 dark:text-slate-300/75">
                        <span>{pvString.label}</span>
                        <span>{pvString.powerKw.toFixed(1)} kW</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[#17323a]/10 dark:bg-white/10">
                        <div className="h-full rounded-full bg-[#2e8fe6]" style={{ width: `${widthPercent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <SolarDataLoadingState />
        )
      ) : (
        <IsolarEmptyState message={t.solarSystem.emptyState} />
      )}
    </GlassCard>
  );
}
