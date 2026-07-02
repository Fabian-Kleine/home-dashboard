import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect } from "react";

import { TopBar } from "@/components/top-bar";
import { PowerFlowCard } from "@/components/dashboard/power-flow-card";
import { SolarSystemCard } from "@/components/dashboard/solar-system-card";
import { ProductionStatusCard } from "@/components/dashboard/production-status-card";
import { OutlookCard } from "@/components/dashboard/outlook-card";
import { useIsolar } from "@/components/isolar-context";
import { useRegisterPageRefresh } from "@/components/page-refresh-context";
import { useTranslation } from "@/lib/use-translation";
import { buildDisplayData, computeKwhToday, FALLBACK_DASHBOARD_DATA } from "@/lib/solar";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export const Route = createFileRoute('/solar')({
  component: SolarPage,
})

function SolarPage() {
  const { t } = useTranslation();
  const { isLoggedIn: isSungrowConnected, solarData, isSolarDataLoading, refetchSolarData } = useIsolar();

  const handleRefresh = useCallback(() => {
    if (isSungrowConnected) {
      void refetchSolarData();
    }
  }, [isSungrowConnected, refetchSolarData]);

  useRegisterPageRefresh({
    onRefresh: handleRefresh,
    isRefreshing: isSolarDataLoading,
    disabled: !isSungrowConnected || isSolarDataLoading,
    label: isSolarDataLoading ? t.header.refreshingData : t.header.refreshData,
  });

  useEffect(() => {
    const id = setInterval(handleRefresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [handleRefresh]);

  const displayData = buildDisplayData(FALLBACK_DASHBOARD_DATA, isSungrowConnected, solarData);
  const kwhToday = computeKwhToday(FALLBACK_DASHBOARD_DATA, isSungrowConnected, solarData);

  return (
    <div className="min-h-screen w-full px-5 py-6 sm:px-8 lg:px-10">
      <TopBar title={t.pages.solarTitle} />

      <div className="grid grid-cols-12 gap-4">
        <PowerFlowCard isSungrowConnected={isSungrowConnected} solarData={solarData} displayData={displayData} />

        <SolarSystemCard
          isSungrowConnected={isSungrowConnected}
          solarData={solarData}
          displayData={displayData}
          showDetailsLink={false}
          className="lg:col-span-6"
        />

        <ProductionStatusCard
          isSungrowConnected={isSungrowConnected}
          solarData={solarData}
          productionStatus={displayData.productionStatus}
          kwhToday={kwhToday}
          className="lg:col-span-6"
        />

        <OutlookCard summary={FALLBACK_DASHBOARD_DATA.summary} />
      </div>
    </div>
  );
}
