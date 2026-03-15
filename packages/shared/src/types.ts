import type { ProductionStatus, WeatherIcon } from "./consts";

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

export type DashboardUpdateClientPayload = {
  longitude: number;
  latitude: number;
  timezone: string;
}

export type DashboardErrorPayload = {
  message: string;
  retryable: boolean;
};

export type CurrentWeatherData = {
    temperature: number;
    relativeHumidity: number;
    apparentTemperature: number;
    precipitation: number;
    rain: number;
    weatherCode: number;
    weatherIcon: WeatherIcon;
    cloudCover: number;
    windSpeed: number;
    sunrise: string;
    sunset: string;
  };

export type WeatherData = {
  daily: {
    sunrise: string[];
    sunset: string[];
    weatherCode: number[];
    temperatureMax: number[];
    temperatureMin: number[];
    daylightDuration: number[];
    sunshineDuration: number[];
    cloudCoverMean: number[];
    cloudCoverMax: number[];
    cloudCoverMin: number[];
  };
  current: CurrentWeatherData;
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
  weather: CurrentWeatherData;
  solar: PowerSource;
  grid: PowerSource;
  battery: PowerSource & { level: number };
  consumption: PowerSource;
  productionStatus: ProductionStatus;
  energyHistory: EnergyTimePoint[];
  summary: string;
  lastUpdated: string;
};