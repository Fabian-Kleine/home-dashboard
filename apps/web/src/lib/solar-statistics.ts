/**
 * Sample statistics data + live-report fetch for the solar Statistics page.
 *
 * Monthly total production comes live from the backend's iSolarCloud report endpoint,
 * and per-roof intraday power comes live from the minute-level endpoint (see
 * apps/backend/src/lib/isolar.ts `getSolarStatistics`). When no live data is available
 * (not connected, or the report returns nothing), the charts fall back to the sample
 * data below.
 *
 * Sample values are seeded off the calendar date so they stay stable across
 * re-renders (no flicker) while tracking a realistic northern-hemisphere curve.
 */

import { API_ROUTES, type IsolarRoofPowerPoint, type IsolarStatistics } from "@repo/shared";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";

/** Deterministic 0..1 pseudo-random from an integer seed. */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

/** Fetch live historical production totals from the backend. Throws on auth/network errors. */
export async function fetchIsolarStatistics(signal?: AbortSignal): Promise<IsolarStatistics> {
  const response = await fetch(new URL(API_ROUTES.isolarStatistics, BACKEND_URL), {
    credentials: "include",
    signal,
  });

  const payload = (await response.json()) as IsolarStatistics | { error?: string };

  if (!response.ok) {
    throw new Error("error" in payload && payload.error ? payload.error : "Unable to fetch solar statistics.");
  }

  return payload as IsolarStatistics;
}

/** Relative solar yield per calendar month (Jan…Dec) for this installation's latitude. */
const SEASONAL_WEIGHT = [0.3, 0.45, 0.66, 0.85, 1.0, 1.06, 1.05, 0.94, 0.74, 0.5, 0.33, 0.25];

export interface MonthlyProductionPoint {
  /** ISO date of the first of the month, for locale-aware labelling in the component. */
  date: string;
  productionKwh: number;
}

/** Total monthly production for the last 12 months (oldest first). */
export function buildMonthlyProduction(reference: Date = new Date()): MonthlyProductionPoint[] {
  const points: MonthlyProductionPoint[] = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    const weight = SEASONAL_WEIGHT[date.getMonth()] ?? 1;
    const jitter = 0.9 + seededRandom(date.getFullYear() * 12 + date.getMonth()) * 0.2;

    points.push({
      date: date.toISOString(),
      productionKwh: Math.round(600 * weight * jitter),
    });
  }

  return points;
}

/**
 * Sample per-roof power (kW) across yesterday at 15-minute steps — a solar bell curve
 * where the East roof peaks mid-morning and the West roof mid-afternoon. Matches the
 * live shape (per-roof power over the most recent full day) for the intraday chart.
 */
export function buildRoofPowerHistory(reference: Date = new Date()): IsolarRoofPowerPoint[] {
  const day = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() - 1);
  const weight = SEASONAL_WEIGHT[day.getMonth()] ?? 1;
  const pad = (value: number) => String(value).padStart(2, "0");
  const bell = (hour: number, peakHour: number, spread: number) =>
    Math.exp(-((hour - peakHour) ** 2) / (2 * spread * spread));

  const points: IsolarRoofPowerPoint[] = [];

  for (let step = 0; step < 96; step++) {
    const minutes = step * 15;
    const hour = minutes / 60;
    const daylight = hour > 6 && hour < 20 ? 1 : 0;
    const cloud = 0.8 + seededRandom(day.getDate() * 100 + step) * 0.2;

    const east = daylight * weight * cloud * 2.4 * bell(hour, 10.5, 2.6);
    const west = daylight * weight * cloud * 2.4 * bell(hour, 14.5, 2.6);

    points.push({
      time: `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}T${pad(Math.floor(hour))}:${pad(minutes % 60)}:00`,
      east: Math.round(east * 100) / 100,
      west: Math.round(west * 100) / 100,
    });
  }

  return points;
}
