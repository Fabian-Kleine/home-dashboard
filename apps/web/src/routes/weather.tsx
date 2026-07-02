import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { TopBar } from "@/components/top-bar";
import { WeatherHeroCard } from "@/components/dashboard/weather-hero-card";
import { WeatherNowCard } from "@/components/dashboard/weather-now-card";
import { WeatherForecastCard } from "@/components/dashboard/weather-forecast-card";
import { useRegisterPageRefresh } from "@/components/page-refresh-context";
import { useTranslation } from "@/lib/use-translation";
import { fetchWeather, useWeatherLocation } from "@/lib/weather";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export const Route = createFileRoute('/weather')({
  component: WeatherPage,
})

function WeatherPage() {
  const { t } = useTranslation();
  const [location] = useWeatherLocation(REFRESH_INTERVAL_MS);

  const weatherQuery = useQuery({
    queryKey: ["weather-full", location.latitude, location.longitude, location.timezone],
    queryFn: ({ signal }) => fetchWeather(location, signal),
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: REFRESH_INTERVAL_MS - 1_000,
  });

  const handleRefresh = useCallback(() => {
    void weatherQuery.refetch();
  }, [weatherQuery.refetch]);

  useRegisterPageRefresh({
    onRefresh: handleRefresh,
    isRefreshing: weatherQuery.isFetching,
    disabled: weatherQuery.isFetching,
    label: weatherQuery.isFetching ? t.header.refreshingData : t.header.refreshData,
  });

  useEffect(() => {
    const id = setInterval(handleRefresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [handleRefresh]);

  const weatherData = weatherQuery.data;
  const isOutdated = weatherQuery.isError && weatherData !== undefined;

  return (
    <div className="min-h-screen w-full px-5 py-6 sm:px-8 lg:px-10">
      <TopBar title={t.pages.weatherTitle} />

      <div className="grid grid-cols-12 gap-4">
        <WeatherHeroCard
          weather={weatherData?.current}
          isLoading={weatherQuery.isLoading}
          isOutdated={isOutdated}
          isRetrying={weatherQuery.isFetching}
          onRetry={handleRefresh}
        />

        <WeatherNowCard
          weather={weatherData?.current}
          isLoading={weatherQuery.isLoading}
          isOutdated={isOutdated}
          isRetrying={weatherQuery.isFetching}
          onRetry={handleRefresh}
        />

        <WeatherForecastCard
          daily={weatherData?.daily}
          isLoading={weatherQuery.isLoading}
          isOutdated={isOutdated}
          isRetrying={weatherQuery.isFetching}
          onRetry={handleRefresh}
        />
      </div>
    </div>
  );
}
