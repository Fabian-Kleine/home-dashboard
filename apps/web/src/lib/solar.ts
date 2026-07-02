import { PRODUCTION_STATUS, type DashboardData, type IsolarSolarData, type ProductionStatus } from "@repo/shared";

/** Fallback values for the parts of DashboardData that aren't sourced from a live query (Sungrow numbers are overridden once connected; these are only rendered before then, behind the Sungrow empty states). */
export const FALLBACK_DASHBOARD_DATA: DashboardData = {
  weather: {
    temperature: 0,
    relativeHumidity: 0,
    apparentTemperature: 0,
    precipitation: 0,
    rain: 0,
    weatherCode: 0,
    weatherIcon: "clear-day",
    cloudCover: 0,
    windSpeed: 0,
    sunrise: "",
    sunset: "",
  },
  solar: { current: 0, unit: "kW" },
  grid: { current: 0, unit: "kW" },
  battery: { current: 0, unit: "kW", level: 0 },
  consumption: { current: 0, unit: "kW" },
  productionStatus: PRODUCTION_STATUS.reduced,
  energyHistory: [],
  summary:
    "Placeholder — Mostly sunny today with high solar yield expected. Current production is covering 85% of household consumption. Battery will reach full charge by 14:00. Grid dependency is minimal.",
  lastUpdated: new Date().toISOString(),
};

/** No direct "status" field exists on iSolarCloud's real-time data, so derive one from how much of current load solar is covering. */
export function deriveProductionStatus(solarKw: number, loadKw: number): ProductionStatus {
  if (loadKw <= 0) return solarKw > 0 ? PRODUCTION_STATUS.good : PRODUCTION_STATUS.reduced;
  const ratio = solarKw / loadKw;
  if (ratio >= 0.8) return PRODUCTION_STATUS.good;
  if (ratio >= 0.4) return PRODUCTION_STATUS.average;
  return PRODUCTION_STATUS.reduced;
}

export function buildDisplayData(
  base: DashboardData,
  isSungrowConnected: boolean,
  solarData: IsolarSolarData | undefined
): DashboardData {
  if (!isSungrowConnected || !solarData) return base;

  return {
    ...base,
    solar: { current: solarData.solarPowerKw, unit: "kW" },
    grid: { current: solarData.gridPowerKw, unit: "kW" },
    battery: { current: solarData.batteryPowerKw, unit: "kW", level: Math.round(solarData.batteryLevel) },
    consumption: { current: solarData.loadPowerKw, unit: "kW" },
    productionStatus: deriveProductionStatus(solarData.solarPowerKw, solarData.loadPowerKw),
  };
}

export function computeKwhToday(
  base: DashboardData,
  isSungrowConnected: boolean,
  solarData: IsolarSolarData | undefined
): number {
  if (isSungrowConnected && solarData) return solarData.dailyYieldKwh;
  return base.energyHistory.reduce((sum, point) => sum + point.production, 0);
}
