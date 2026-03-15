type DayOrNight = "day" | "night";

type WeatherIconProps = {
  weather: string;
  dayOrNight: DayOrNight;
};

const weatherIconMap: Record<string, string | Record<DayOrNight, string>> = {
  clear: {
    day: "clear-day.svg",
    night: "clear-night.svg",
  },
  sunny: {
    day: "clear-day.svg",
    night: "clear-night.svg",
  },
  cloudy: {
    day: "cloudy-day.svg",
    night: "cloudy-night.svg",
  },
  overcast: "very-cloudy.svg",
  "very-cloudy": "very-cloudy.svg",
  "partly-cloudy": {
    day: "partly-cloudy-day.svg",
    night: "partly-cloudy-night.svg",
  },
  rainy: "rainy.svg",
  rain: "rainy.svg",
  drizzle: "rainy.svg",
  "partly-rainy": {
    day: "partly-rainy-day.svg",
    night: "partly-rainy-night.svg",
  },
  thunderstorm: "thunderstorm.svg",
  storm: "thunderstorm.svg",
};

function normalizeWeather(weather: string) {
  return weather.trim().toLowerCase().replace(/\s+/g, "-").replace(/-(day|night)$/, "");
}

function getIconFile(weather: string, dayOrNight: DayOrNight) {
  const normalizedWeather = normalizeWeather(weather);
  const match = weatherIconMap[normalizedWeather];

  if (typeof match === "string") {
    return match;
  }

  if (match) {
    return match[dayOrNight];
  }

  return dayOrNight === "night" ? "clear-night.svg" : "clear-day.svg";
}

export function WeatherIcon({ weather, dayOrNight }: WeatherIconProps) {
  const iconFile = getIconFile(weather, dayOrNight);

  return (
    <img
      src={`/weather-icons/${iconFile}`}
      alt={weather}
      className="size-32 object-contain"
      loading="lazy"
      decoding="async"
    />
  );
}