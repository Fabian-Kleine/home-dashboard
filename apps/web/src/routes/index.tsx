import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DashboardData } from "@repo/shared";

import { useIsolar } from "@/components/isolar-context";
import { useRegisterPageRefresh } from "@/components/page-refresh-context";
import { useTranslation } from "@/lib/use-translation";
import type { TranslationDict } from "@/lib/translations";
import { TopBar } from "@/components/top-bar";
import { WeatherHeroCard } from "@/components/dashboard/weather-hero-card";
import { ProductionStatusCard } from "@/components/dashboard/production-status-card";
import { WeatherNowCard } from "@/components/dashboard/weather-now-card";
import { SolarSystemCard } from "@/components/dashboard/solar-system-card";
import { PowerFlowCard } from "@/components/dashboard/power-flow-card";
import { OutlookCard } from "@/components/dashboard/outlook-card";
import { fetchWeather, useWeatherLocation } from "@/lib/weather";
import { buildDisplayData, computeKwhToday, FALLBACK_DASHBOARD_DATA } from "@/lib/solar";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

function greetingForHour(hour: number, greeting: TranslationDict["greeting"]) {
  if (hour < 12) return greeting.morning;
  if (hour < 18) return greeting.afternoon;
  return greeting.evening;
}

function HomePage() {
  const data = FALLBACK_DASHBOARD_DATA;
  const [location] = useWeatherLocation(REFRESH_INTERVAL_MS);
  const { isLoggedIn: isSungrowConnected, solarData, refetchSolarData } = useIsolar();
  const { t, locale } = useTranslation();

  const weatherQuery = useQuery({
    queryKey: ["weather", location.latitude, location.longitude, location.timezone],
    queryFn: async ({ signal }) => (await fetchWeather(location, signal)).current,
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: REFRESH_INTERVAL_MS - 1_000,
  });

  const handlePageRefresh = useCallback(() => {
    void weatherQuery.refetch();
    if (isSungrowConnected) {
      void refetchSolarData();
    }
  }, [weatherQuery.refetch, isSungrowConnected, refetchSolarData]);

  useRegisterPageRefresh({
    onRefresh: handlePageRefresh,
    isRefreshing: weatherQuery.isFetching,
    disabled: weatherQuery.isFetching,
    label: weatherQuery.isFetching ? t.header.refreshingData : t.header.refreshData,
  });

  useEffect(() => {
    const id = setInterval(handlePageRefresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [handlePageRefresh]);

  const now = new Date();
  const weather = weatherQuery.data;
  const isWeatherOutdated = weatherQuery.isError && weather !== undefined;

  const displayData: DashboardData = buildDisplayData(data, isSungrowConnected, solarData);
  const kwhToday = computeKwhToday(data, isSungrowConnected, solarData);

  return (
    <div className="min-h-screen w-full px-5 py-6 sm:px-8 lg:px-10">
      <TopBar
        title={greetingForHour(now.getHours(), t.greeting)}
        subtitle={
          <>
            {now.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" })}
            {" · "}
            {now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
          </>
        }
      />

      <div className="grid grid-cols-12 gap-4">
        <WeatherHeroCard
          weather={weather}
          isLoading={weatherQuery.isLoading}
          isOutdated={isWeatherOutdated}
          isRetrying={weatherQuery.isFetching}
          onRetry={handlePageRefresh}
        />

        <ProductionStatusCard
          isSungrowConnected={isSungrowConnected}
          solarData={solarData}
          productionStatus={displayData.productionStatus}
          kwhToday={kwhToday}
        />

        <WeatherNowCard
          weather={weather}
          isLoading={weatherQuery.isLoading}
          isOutdated={isWeatherOutdated}
          isRetrying={weatherQuery.isFetching}
          onRetry={handlePageRefresh}
        />

        <SolarSystemCard isSungrowConnected={isSungrowConnected} solarData={solarData} displayData={displayData} />

        <PowerFlowCard isSungrowConnected={isSungrowConnected} solarData={solarData} displayData={displayData} />

        <OutlookCard summary={data.summary} />
      </div>
    </div>
  );
}

export const Route = createFileRoute('/')({
  component: HomePage,
});
