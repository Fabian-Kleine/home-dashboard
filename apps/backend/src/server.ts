import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import {
  API_ROUTES,
  APP_NAME,
  SOCKET_EVENTS,
  type ClientConnectionPayload,
  type HealthResponse,
  type ServerMessagePayload
} from "@repo/shared";
import { Server } from "socket.io";

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

  socket.on("disconnect", () => {
    io.emit(SOCKET_EVENTS.clientConnected, connectionPayload());
  });
});

const port = Number(process.env.PORT ?? 4000);

httpServer.listen(port, () => {
  console.log(`${APP_NAME} backend listening on http://localhost:${port}`);
});