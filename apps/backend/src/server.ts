import cors from "cors";
import express from "express";
import {
  API_ROUTES,
  APP_NAME,
  type HealthResponse,
} from "@repo/shared";
import { getWeatherData } from "./lib/weather.js";
import weatherRoute from "./routes/weather.route.js";

const app = express();
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";

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

app.use(weatherRoute);

const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => {
  console.log(`${APP_NAME} backend listening on http://localhost:${port}`);
});