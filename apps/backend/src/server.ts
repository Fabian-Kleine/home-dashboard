import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import {
  API_ROUTES,
  APP_NAME,
  SOCKET_EVENTS,
  CurrentWeatherData,
  DashboardUpdateClientPayload,
  type DashboardErrorPayload,
  type ClientConnectionPayload,
  type HealthResponse,
  type ServerMessagePayload
} from "@repo/shared";
import { Server } from "socket.io";
import { getWeatherData } from "./lib/weather.js";

const app = express();
const httpServer = createServer(app);
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

const io = new Server(httpServer, {
  cors: {
    origin: frontendOrigin,
    credentials: true
  }
});

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true
  })
);
app.use(express.json());

app.get(API_ROUTES.health, (_request, response) => {
  const payload: HealthResponse = {
    ok: true,
    service: APP_NAME,
    timestamp: new Date().toISOString()
  };

  response.json(payload);
});

app.get(API_ROUTES.weather, async (request, response) => {
  const { latitude, longitude, timezone } = request.query;

  if (!latitude || !longitude || !timezone) {
    return response.status(400).json({ error: "Missing required query parameters: latitude, longitude, timezone" });
  }

  try {
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude)) {
      return response.status(400).json({ error: "Latitude and longitude must be valid numbers" });
    }

    const weatherData = await getWeatherData(parsedLatitude, parsedLongitude, String(timezone));
    response.json(weatherData);
  } catch (error) {
    console.error("Failed to serve weather response:", error);
    response.status(502).json({ error: "Unable to fetch weather data right now" });
  }
});

io.on("connection", (socket) => {
  const payload: ServerMessagePayload = {
    message: `Connected to ${APP_NAME}`,
    connectedClients: io.engine.clientsCount
  };

  const connectionPayload = (): ClientConnectionPayload => ({
    id: socket.id,
    connectedClients: io.engine.clientsCount
  });

  socket.emit(SOCKET_EVENTS.serverMessage, payload);
  io.emit(SOCKET_EVENTS.clientConnected, connectionPayload());

  socket.on(SOCKET_EVENTS.dashboardUpdate, async (data: DashboardUpdateClientPayload) => {
    try {
      const weatherData = await getWeatherData(data.latitude, data.longitude, data.timezone);

      const currentWeatherData: CurrentWeatherData = weatherData.current;

      await new Promise((resolve) => setTimeout(resolve, 1000));

      socket.emit(SOCKET_EVENTS.dashboardWeatherUpdate, currentWeatherData);
    } catch (error) {
      console.error(`Failed to refresh weather for socket ${socket.id}:`, error);

      const payload: DashboardErrorPayload = {
        message: "Unable to refresh weather right now.",
        retryable: true,
      };

      socket.emit(SOCKET_EVENTS.dashboardError, payload);
    }
  });

  socket.on("disconnect", () => {
    io.emit(SOCKET_EVENTS.clientConnected, connectionPayload());
  });
});

const port = Number(process.env.PORT ?? 4000);

httpServer.listen(port, () => {
  console.log(`${APP_NAME} backend listening on http://localhost:${port}`);
});