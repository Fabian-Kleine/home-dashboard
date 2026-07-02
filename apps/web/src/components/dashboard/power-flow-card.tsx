import type { DashboardData, IsolarSolarData } from "@repo/shared";

import { GlassCard } from "@/components/dashboard/glass-card";
import { IsolarEmptyState } from "@/components/dashboard/isolar-empty-state";
import { PowerFlow } from "@/components/dashboard/power-flow";
import { SolarDataLoadingState } from "@/components/dashboard/solar-data-loading-state";

export function PowerFlowCard({
  isSungrowConnected,
  solarData,
  displayData,
}: {
  isSungrowConnected: boolean;
  solarData: IsolarSolarData | undefined;
  displayData: DashboardData;
}) {
  return (
    <GlassCard className="col-span-12 p-7">
      <div className="mb-5 text-lg font-semibold">Live power flow</div>
      {isSungrowConnected ? (
        solarData ? (
          <PowerFlow data={displayData} />
        ) : (
          <SolarDataLoadingState />
        )
      ) : (
        <IsolarEmptyState message="Connect your Sungrow account to see live power flow" />
      )}
    </GlassCard>
  );
}
