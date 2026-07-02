import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  API_ROUTES,
  type AiOverviewRequest,
  type AiOverviewResponse,
  type CurrentWeatherData,
  type IsolarSolarData,
  type ProductionStatus,
} from "@repo/shared";

import { useSettings } from "@/components/settings-context";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";

export async function fetchAiOverview(
  request: AiOverviewRequest,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(new URL(API_ROUTES.aiOverview, BACKEND_URL), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });

  const payload = (await response.json()) as AiOverviewResponse | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in payload && payload.error ? payload.error : "Unable to generate the AI overview right now."
    );
  }

  return (payload as AiOverviewResponse).summary;
}

/** Fetches the backend's Ollama-generated outlook blurb; the backend itself caches this for 1h. */
export function useAiOverview(params: {
  weather: CurrentWeatherData | undefined;
  productionStatus: ProductionStatus;
  isSungrowConnected: boolean;
  solarData: IsolarSolarData | undefined;
  staleTimeMs: number;
}): UseQueryResult<string> {
  const { weather, productionStatus, isSungrowConnected, solarData, staleTimeMs } = params;
  const { language } = useSettings();

  return useQuery({
    queryKey: ["ai-overview", language, productionStatus, isSungrowConnected],
    queryFn: ({ signal }) =>
      fetchAiOverview(
        {
          weather: weather!,
          productionStatus,
          isSungrowConnected,
          solar: isSungrowConnected ? solarData : undefined,
          language,
        },
        signal
      ),
    enabled: weather !== undefined,
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: staleTimeMs,
  });
}
