import type { ProductionStatus } from "./consts";

export type HealthResponse = {
  ok: true;
  service: string;
  timestamp: string;
};

export type ServerMessagePayload = {
  message: string;
  connectedClients: number;
};

export type ClientConnectionPayload = {
  id: string;
  connectedClients: number;
};

export type WeatherData = {
  temperature: number;
  humidity: number;
  condition: string;
  icon: string;
  windSpeed: number;
  sunrise: string;
  sunset: string;
};

export type PowerSource = {
  current: number;
  unit: string;
};

export type EnergyTimePoint = {
  time: string;
  production: number;
  consumption: number;
};

export type DashboardData = {
  weather: WeatherData;
  solar: PowerSource;
  grid: PowerSource;
  battery: PowerSource & { level: number };
  consumption: PowerSource;
  productionStatus: ProductionStatus;
  energyHistory: EnergyTimePoint[];
  summary: string;
  lastUpdated: string;
};