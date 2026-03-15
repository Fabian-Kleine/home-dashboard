export const APP_NAME = "Home Dashboard";
export const SOCKET_EVENTS = {
  clientConnected: "client:connected",
  serverMessage: "server:message",
  dashboardUpdate: "dashboard:update",
} as const;

export const API_ROUTES = {
  health: "/health",
  dashboard: "/dashboard",
} as const;

export const PRODUCTION_STATUS = {
  good: "good",
  average: "average",
  reduced: "reduced",
} as const;

export type ProductionStatus = (typeof PRODUCTION_STATUS)[keyof typeof PRODUCTION_STATUS];