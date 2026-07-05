import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { API_ROUTES, type NewsData } from "@repo/shared";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";

export async function fetchNews(signal?: AbortSignal): Promise<NewsData> {
  const response = await fetch(new URL(API_ROUTES.news, BACKEND_URL), {
    credentials: "include",
    signal,
  });

  const payload = (await response.json()) as NewsData | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in payload && payload.error ? payload.error : "Unable to load news right now."
    );
  }

  return payload as NewsData;
}

/**
 * Fetches the backend's normalized Tagesschau feed. The backend caches upstream for 15
 * minutes, so a shared `["news"]` query key lets the home widget and news page dedupe.
 */
export function useNews(staleTimeMs: number): UseQueryResult<NewsData> {
  return useQuery({
    queryKey: ["news"],
    queryFn: ({ signal }) => fetchNews(signal),
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: staleTimeMs,
  });
}

/** Localized "5 min ago"-style label, degrading to an absolute date for older items. */
export function formatRelativeTime(dateStr: string, locale: string): string {
  const timestamp = new Date(dateStr).getTime();
  if (Number.isNaN(timestamp)) return "";

  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (absSeconds < 60) return rtf.format(diffSeconds, "second");
  if (absSeconds < 60 * 60) return rtf.format(Math.round(diffSeconds / 60), "minute");
  if (absSeconds < 60 * 60 * 24) return rtf.format(Math.round(diffSeconds / 3600), "hour");

  return new Date(timestamp).toLocaleDateString(locale, { day: "numeric", month: "short" });
}
