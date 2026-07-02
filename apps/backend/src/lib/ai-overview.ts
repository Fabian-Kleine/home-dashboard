import type { AiOverviewRequest } from "@repo/shared";
import { Ollama } from "ollama";
import { TtlCache } from "./cache.js";

const OVERVIEW_CACHE_TTL_MS = 60 * 60 * 1000;
const overviewCache = new TtlCache<string>(OVERVIEW_CACHE_TTL_MS);

function getOllamaClient(): Ollama {
  const apiKey = process.env.OLLAMA_API_KEY;

  return new Ollama({
    host: process.env.OLLAMA_URL || "https://ollama.com",
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
  });
}

function getOllamaModel(): string {
  return process.env.OLLAMA_MODEL || "gpt-oss:20b-cloud";
}

/**
 * Bucket the volatile readings before hashing them into a cache key, so the dashboard's
 * 5-minute refresh cycle mostly hits the cache instead of re-prompting the model — a new
 * overview is only generated when conditions change meaningfully, or the 1h TTL expires.
 */
function buildCacheKey(request: AiOverviewRequest): string {
  const { weather, productionStatus, isSungrowConnected, solar, language } = request;

  return JSON.stringify({
    language,
    productionStatus,
    isSungrowConnected,
    temperature: Math.round(weather.temperature),
    weatherCode: weather.weatherCode,
    cloudCover: Math.round(weather.cloudCover / 10) * 10,
    solarPowerKw: solar ? Math.round(solar.solarPowerKw * 2) / 2 : undefined,
    gridPowerKw: solar ? Math.round(solar.gridPowerKw * 2) / 2 : undefined,
    loadPowerKw: solar ? Math.round(solar.loadPowerKw * 2) / 2 : undefined,
    batteryLevel: solar ? Math.round(solar.batteryLevel / 5) * 5 : undefined,
  });
}

function buildPrompt(request: AiOverviewRequest): string {
  const { weather, productionStatus, isSungrowConnected, solar, language } = request;

  const dataLines = [
    `Weather: ${weather.temperature.toFixed(1)}°C, feels like ${weather.apparentTemperature.toFixed(1)}°C, ${weather.cloudCover}% cloud cover, wind ${weather.windSpeed.toFixed(1)} km/h, sunrise ${weather.sunrise}, sunset ${weather.sunset}.`,
    `Solar production status: ${productionStatus}.`,
  ];

  if (isSungrowConnected && solar) {
    dataLines.push(
      `Live solar system: production ${solar.solarPowerKw.toFixed(2)} kW, household load ${solar.loadPowerKw.toFixed(2)} kW, grid power ${solar.gridPowerKw.toFixed(2)} kW (positive = exporting to the grid), battery ${solar.batteryLevel.toFixed(0)}% at ${solar.batteryPowerKw.toFixed(2)} kW, ${solar.dailyYieldKwh.toFixed(1)} kWh yielded so far today.`
    );
  } else {
    dataLines.push("The solar system is not currently connected, so no live production data is available.");
  }

  return [
    "You are writing a short outlook blurb for a home dashboard that shows weather and solar production data.",
    "Using the data below, write 2-3 concise sentences summarizing today's outlook: mention the weather, how solar production is tracking, and anything notable about the battery or grid usage.",
    "Write plain prose only — no markdown, no headings, no bullet points. Describe the numbers naturally instead of repeating them verbatim.",
    `Respond in this language: ${language}.`,
    "",
    ...dataLines,
  ].join("\n");
}

export async function getAiOverview(request: AiOverviewRequest): Promise<string> {
  const cacheKey = buildCacheKey(request);

  return overviewCache.getOrSet(cacheKey, async () => {
    const client = getOllamaClient();
    const response = await client.chat({
      model: getOllamaModel(),
      messages: [{ role: "user", content: buildPrompt(request) }],
      stream: false,
    });

    return response.message.content.trim();
  });
}
