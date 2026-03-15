import type { WeatherData, WeatherIcon } from "@repo/shared";
import { fetchWeatherApi } from "openmeteo";

const WEATHER_FETCH_RETRIES = 2;
const WEATHER_FETCH_RETRY_DELAY_MS = 750;
const LOCAL_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
});

const defaultWeatherParams = {
    daily: ["sunrise", "sunset", "weather_code", "temperature_2m_max", "temperature_2m_min", "daylight_duration", "sunshine_duration", "cloud_cover_mean", "cloud_cover_max", "cloud_cover_min"],
    current: ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "precipitation", "rain", "weather_code", "cloud_cover", "wind_speed_10m"],
    forecast_days: 1,
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorCode(error: unknown): string | undefined {
    if (typeof error !== "object" || error === null) {
        return undefined;
    }

    const errorWithCause = error as { code?: unknown; cause?: { code?: unknown } };

    if (typeof errorWithCause.code === "string") {
        return errorWithCause.code;
    }

    if (typeof errorWithCause.cause?.code === "string") {
        return errorWithCause.cause.code;
    }

    return undefined;
}

function shouldRetryWeatherRequest(error: unknown): boolean {
    const errorCode = getErrorCode(error);

    return errorCode === "ECONNRESET" || errorCode === "ETIMEDOUT";
}

function formatLocalTime(date: Date): string {
    return LOCAL_TIME_FORMATTER.format(date);
}

function getMinutesFromTimeString(value: string): number {
    const [hourText, minuteText] = value.split(":");
    const hour = Number(hourText);
    const minute = Number(minuteText);

    if (hourText === undefined || minuteText === undefined || Number.isNaN(hour) || Number.isNaN(minute)) {
        throw new Error(`Invalid time string: ${value}`);
    }

    return hour * 60 + minute;
}

function getCurrentMinutesInTimezone(timezone: string): number {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
    }).formatToParts(new Date());

    const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
    const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

    return hour * 60 + minute;
}

export async function getWeatherData(latitude: number, longitude: number, timezone: string): Promise<WeatherData> {
    const params = {
        ...defaultWeatherParams,
        latitude,
        longitude,
        timezone,
    };

    const url = process.env.OPENMETEO_URL || "https://api.open-meteo.com/v1/forecast";

    for (let attempt = 0; attempt <= WEATHER_FETCH_RETRIES; attempt += 1) {
        try {
            const responses = await fetchWeatherApi(url, params);

            const response = responses[0];
            const current = response?.current();
            const daily = response?.daily();

            if (!response || !current || !daily) {
                throw new Error("Invalid weather API response");
            }

            const utcOffsetSeconds = response.utcOffsetSeconds();
            const sunrise = daily.variables(0)!;
            const sunset = daily.variables(1)!;
            const toNumberArray = (values: Float32Array<ArrayBufferLike> | null): number[] => Array.from(values ?? []);

            const weatherData = {
                current: {
                    time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
                    temperature_2m: current.variables(0)!.value(),
                    relative_humidity_2m: current.variables(1)!.value(),
                    apparent_temperature: current.variables(2)!.value(),
                    precipitation: current.variables(3)!.value(),
                    rain: current.variables(4)!.value(),
                    weather_code: current.variables(5)!.value(),
                    cloud_cover: current.variables(6)!.value(),
                    wind_speed_10m: current.variables(7)!.value(),
                },
                daily: {
                    time: Array.from(
                        { length: (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval() },
                        (_, index) => new Date((Number(daily.time()) + index * daily.interval() + utcOffsetSeconds) * 1000)
                    ),
                    sunrise: [...Array(sunrise.valuesInt64Length())].map(
                        (_, index) => new Date((Number(sunrise.valuesInt64(index)) + utcOffsetSeconds) * 1000)
                    ),
                    sunset: [...Array(sunset.valuesInt64Length())].map(
                        (_, index) => new Date((Number(sunset.valuesInt64(index)) + utcOffsetSeconds) * 1000)
                    ),
                    weather_code: toNumberArray(daily.variables(2)!.valuesArray()),
                    temperature_2m_max: toNumberArray(daily.variables(3)!.valuesArray()),
                    temperature_2m_min: toNumberArray(daily.variables(4)!.valuesArray()),
                    daylight_duration: toNumberArray(daily.variables(5)!.valuesArray()),
                    sunshine_duration: toNumberArray(daily.variables(6)!.valuesArray()),
                    cloud_cover_mean: toNumberArray(daily.variables(7)!.valuesArray()),
                    cloud_cover_max: toNumberArray(daily.variables(8)!.valuesArray()),
                    cloud_cover_min: toNumberArray(daily.variables(9)!.valuesArray()),
                },
            };

            return {
                current: {
                    temperature: weatherData.current.temperature_2m,
                    relativeHumidity: weatherData.current.relative_humidity_2m,
                    apparentTemperature: weatherData.current.apparent_temperature,
                    precipitation: weatherData.current.precipitation,
                    rain: weatherData.current.rain,
                    weatherCode: weatherData.current.weather_code,
                    weatherIcon: getWeatherIcon(
                        weatherData.current.weather_code,
                        weatherData.daily.sunrise[0] ? formatLocalTime(weatherData.daily.sunrise[0]) : formatLocalTime(weatherData.current.time),
                        weatherData.daily.sunset[0] ? formatLocalTime(weatherData.daily.sunset[0]) : formatLocalTime(weatherData.current.time),
                        timezone,
                    ),
                    cloudCover: weatherData.current.cloud_cover,
                    windSpeed: weatherData.current.wind_speed_10m,
                    sunrise: weatherData.daily.sunrise[0] ? formatLocalTime(weatherData.daily.sunrise[0]) : formatLocalTime(weatherData.current.time),
                    sunset: weatherData.daily.sunset[0] ? formatLocalTime(weatherData.daily.sunset[0]) : formatLocalTime(weatherData.current.time),
                },
                daily: {
                    sunrise: weatherData.daily.sunrise.map((value) => formatLocalTime(value)),
                    sunset: weatherData.daily.sunset.map((value) => formatLocalTime(value)),
                    weatherCode: weatherData.daily.weather_code,
                    temperatureMax: weatherData.daily.temperature_2m_max,
                    temperatureMin: weatherData.daily.temperature_2m_min,
                    daylightDuration: weatherData.daily.daylight_duration,
                    sunshineDuration: weatherData.daily.sunshine_duration,
                    cloudCoverMean: weatherData.daily.cloud_cover_mean,
                    cloudCoverMax: weatherData.daily.cloud_cover_max,
                    cloudCoverMin: weatherData.daily.cloud_cover_min,
                },
            };
        } catch (error) {
            const shouldRetry = attempt < WEATHER_FETCH_RETRIES && shouldRetryWeatherRequest(error);

            if (shouldRetry) {
                console.warn(`Weather API request failed on attempt ${attempt + 1}. Retrying...`, error);
                await delay(WEATHER_FETCH_RETRY_DELAY_MS * (attempt + 1));
                continue;
            }

            console.error("Error fetching weather data:", error);
            throw error;
        }
    }

    throw new Error("Weather API request failed");
}

// openmeteo weather codes mapping
type WeatherIconBase = WeatherIcon | "clear" | "partly-cloudy" | "cloudy" | "partly-rainy";

export const openMeteoToIconName: Record<number, WeatherIconBase> = {
  // Clear / mostly clear / partly cloudy
  0: "clear", // Clear sky
  1: "partly-cloudy", // Mainly clear
  2: "partly-cloudy", // Partly cloudy
  3: "cloudy", // Overcast

  // Fog
  45: "very-cloudy", // Fog
  48: "very-cloudy", // Depositing rime fog

  // Drizzle (light/moderate -> partly-rainy, heavier/freezing -> rainy)
  51: "partly-rainy", // Drizzle: light
  53: "partly-rainy", // Drizzle: moderate
  55: "rainy", // Drizzle: dense
  56: "rainy", // Freezing drizzle: light
  57: "rainy", // Freezing drizzle: dense

  // Rain
  61: "rainy", // Rain: slight
  63: "rainy", // Rain: moderate
  65: "rainy", // Rain: heavy
  66: "rainy", // Freezing rain: light
  67: "rainy", // Freezing rain: heavy

  // Snow
  71: "very-cloudy", // Snow fall: slight
  73: "very-cloudy", // Snow fall: moderate
  75: "very-cloudy", // Snow fall: heavy
  77: "very-cloudy", // Snow grains
  85: "very-cloudy", // Snow showers: slight
  86: "very-cloudy", // Snow showers: heavy

  // Showers
  80: "partly-rainy", // Rain showers: slight
  81: "partly-rainy", // Rain showers: moderate
  82: "rainy", // Rain showers: violent/very heavy

  // Thunderstorms
  95: "thunderstorm", // Thunderstorm: slight/moderate
  96: "thunderstorm", // Thunderstorm with slight hail
  99: "thunderstorm", // Thunderstorm with heavy hail
};

export function getWeatherIcon(weatherCode: number, sunrise: string, sunset: string, timezone: string): WeatherIcon {
    const iconBase = openMeteoToIconName[weatherCode] || "clear";
    const currentMinutes = getCurrentMinutesInTimezone(timezone);
    const sunriseMinutes = getMinutesFromTimeString(sunrise);
    const sunsetMinutes = getMinutesFromTimeString(sunset);
    const isNight = currentMinutes < sunriseMinutes || currentMinutes > sunsetMinutes;

    if (iconBase === "clear") {
        return isNight ? "clear-night" : "clear-day";
    } else if (iconBase === "partly-cloudy") {
        return isNight ? "partly-cloudy-night" : "partly-cloudy-day";
    } else if (iconBase === "partly-rainy") {
        return isNight ? "partly-rainy-night" : "partly-rainy-day";
    } else if (iconBase === "cloudy") {
        return isNight ? "cloudy-night" : "cloudy-day";
    } else {
        return iconBase;
    }
}