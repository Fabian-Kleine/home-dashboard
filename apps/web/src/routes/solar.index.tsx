import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { TopBar } from "@/components/top-bar";
import { PowerFlowCard } from "@/components/dashboard/power-flow-card";
import { SolarSystemCard } from "@/components/dashboard/solar-system-card";
import { ProductionStatusCard } from "@/components/dashboard/production-status-card";
import { OutlookCard } from "@/components/dashboard/outlook-card";
import { useIsolar } from "@/components/isolar-context";
import { useRegisterPageRefresh } from "@/components/page-refresh-context";
import { useTranslation } from "@/lib/use-translation";
import { buildDisplayData, computeKwhToday, FALLBACK_DASHBOARD_DATA } from "@/lib/solar";
import { fetchWeather, useWeatherLocation } from "@/lib/weather";
import { useAiOverview } from "@/lib/ai-overview";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export const Route = createFileRoute('/solar/')({
  component: SolarLiveDataPage,
})

function SolarLiveDataPage() {
  const { t } = useTranslation();
  const { isLoggedIn: isSungrowConnected, solarData, isSolarDataLoading, refetchSolarData } = useIsolar();
  const [location] = useWeatherLocation(REFRESH_INTERVAL_MS);

  const weatherQuery = useQuery({
    queryKey: ["weather", location.latitude, location.longitude, location.timezone],
    queryFn: async ({ signal }) => (await fetchWeather(location, signal)).current,
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: REFRESH_INTERVAL_MS - 1_000,
  });

  const displayData = buildDisplayData(FALLBACK_DASHBOARD_DATA, isSungrowConnected, solarData);
  const kwhToday = computeKwhToday(FALLBACK_DASHBOARD_DATA, isSungrowConnected, solarData);

  const aiOverviewQuery = useAiOverview({
    weather: weatherQuery.data,
    productionStatus: displayData.productionStatus,
    isSungrowConnected,
    solarData,
    staleTimeMs: REFRESH_INTERVAL_MS - 1_000,
  });

  const handleRefresh = useCallback(() => {
    if (isSungrowConnected) {
      void refetchSolarData();
    }
    void weatherQuery.refetch();
    void aiOverviewQuery.refetch();
  }, [isSungrowConnected, refetchSolarData, weatherQuery.refetch, aiOverviewQuery.refetch]);

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

  const outlookSummary = aiOverviewQuery.data ?? (aiOverviewQuery.isError ? t.outlook.error : t.outlook.loading);

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

        <OutlookCard summary={outlookSummary} isLoading={aiOverviewQuery.isLoading} />
      </div>
    </div>
  );
}
