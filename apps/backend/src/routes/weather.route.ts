import { API_ROUTES } from "@repo/shared";
import { Router, type Router as ExpressRouter } from "express";
import { getWeatherData } from "../lib/weather.js";

const router: ExpressRouter = Router();

router.get(API_ROUTES.weather, async (request, response) => {
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

export default router;