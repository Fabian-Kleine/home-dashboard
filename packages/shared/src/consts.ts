export const APP_NAME = "Home Dashboard";
export const SOCKET_EVENTS = {
  clientConnected: "client:connected",
  serverMessage: "server:message",
  dashboardUpdate: "dashboard:update",
  dashboardWeatherUpdate: "dashboard:weatherUpdate",
  dashboardError: "dashboard:error",
} as const;

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