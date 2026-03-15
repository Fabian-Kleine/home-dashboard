import type { DashboardData, EnergyTimePoint } from "@repo/shared";
import { PRODUCTION_STATUS } from "@repo/shared";

function generateEnergyHistory(): EnergyTimePoint[] {
  const hours = [
    "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
  ];

  const now = new Date();
  const currentHour = now.getHours();

  return hours.map((time, i) => {
    const isFuture = i > currentHour;
    const solarCurve = Math.max(0, Math.sin(((i - 5) / 14) * Math.PI) * 4.8);
    const baseLine = 1.2 + Math.sin((i / 24) * Math.PI * 2) * 0.6;
    const consumption = isFuture ? 0 : +(baseLine + Math.random() * 0.5).toFixed(2);
    const production = isFuture ? 0 : +(solarCurve + Math.random() * 0.3).toFixed(2);
    return { time, production, consumption };
  });
}

export function getMockDashboard(): DashboardData {
  return {
    weather: {
      temperature: 21,
      humidity: 54,
      condition: "Partly Cloudy",
      icon: "cloudy-night",
      windSpeed: 12,
      sunrise: "06:18",
      sunset: "18:42",
    },
    solar: { current: 3.42, unit: "kW" },
    grid: { current: 0.87, unit: "kW" },
    battery: { current: 1.24, unit: "kW", level: 72 },
    consumption: { current: 2.18, unit: "kW" },
    productionStatus: PRODUCTION_STATUS.good,
    energyHistory: generateEnergyHistory(),
    summary:
      "Placeholder — Mostly sunny today with high solar yield expected. Current production is covering 85% of household consumption. Battery will reach full charge by 14:00. Grid dependency is minimal.",
    lastUpdated: new Date().toISOString(),
  };
}
