export const APP_NAME = "Home Dashboard";

export const API_ROUTES = {
  health: "/health",
  weather: "/weather",
} as const;

export const PRODUCTION_STATUS = {
  good: "good",
  average: "average",
  reduced: "reduced",
} as const;

export type ProductionStatus = (typeof PRODUCTION_STATUS)[keyof typeof PRODUCTION_STATUS];

export const WEATHER_ICONS = [
  "clear-day",
  "clear-night",
  "partly-cloudy-day",
  "partly-cloudy-night",
  "cloudy-day",
  "cloudy-night",
  "very-cloudy",
  "partly-rainy-day",
  "partly-rainy-night",
  "rainy",
  "thunderstorm"
] as const;

export type WeatherIcon = (typeof WEATHER_ICONS)[number];