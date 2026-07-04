import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { TopBar } from "@/components/top-bar";
import { MonthlyProductionCard } from "@/components/dashboard/monthly-production-card";
import { RoofProductionCard } from "@/components/dashboard/roof-production-card";
import { RoofPowerCard } from "@/components/dashboard/roof-power-card";
import { useIsolar } from "@/components/isolar-context";
import { useRegisterPageRefresh } from "@/components/page-refresh-context";
import { useTranslation } from "@/lib/use-translation";
import { fetchIsolarStatistics } from "@/lib/solar-statistics";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export const Route = createFileRoute("/solar/statistics")({
  component: SolarStatisticsPage,
});

function SolarStatisticsPage() {
  const { t } = useTranslation();
  const { isLoggedIn: isSungrowConnected } = useIsolar();

  const statisticsQuery = useQuery({
    queryKey: ["isolar-statistics"],
    queryFn: ({ signal }) => fetchIsolarStatistics(signal),
    enabled: isSungrowConnected,
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: REFRESH_INTERVAL_MS - 1_000,
  });

  const handleRefresh = useCallback(() => {
    void statisticsQuery.refetch();
  }, [statisticsQuery.refetch]);

  useRegisterPageRefresh({
    onRefresh: handleRefresh,
    isRefreshing: statisticsQuery.isFetching,
    disabled: !isSungrowConnected || statisticsQuery.isFetching,
    label: statisticsQuery.isFetching ? t.header.refreshingData : t.header.refreshData,
  });

  // Ignore any cached data once disconnected, so the charts fall back to sample data immediately on logout.
  const stats = isSungrowConnected ? statisticsQuery.data : undefined;
  const hasLiveData = Boolean(
    stats && (stats.monthly.length > 0 || stats.daily.length > 0 || stats.roofPower.length > 0),
  );

  return (
    <div className="min-h-screen w-full px-5 py-6 sm:px-8 lg:px-10">
      <TopBar
        title={t.pages.statisticsTitle}
        subtitle={hasLiveData ? t.statistics.splitNote : t.statistics.sampleNote}
      />

      <div className="grid grid-cols-12 gap-4">
        <MonthlyProductionCard data={stats?.monthly} className="lg:col-span-6" />
        <RoofProductionCard dailyTotals={stats?.daily} className="lg:col-span-6" />
        <RoofPowerCard data={stats?.roofPower} />
      </div>
    </div>
  );
}
