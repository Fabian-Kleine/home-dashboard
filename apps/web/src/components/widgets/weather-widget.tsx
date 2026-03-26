import type { CurrentWeatherData } from "@repo/shared";
import {
    IconCloudFilled,
    IconDropletFilled,
    IconSunrise,
    IconSunset,
    IconUmbrellaFilled,
    IconWindsockFilled,
} from "@tabler/icons-react";
import { IconWidgetBase, WidgetBase, type WidgetGridArea } from "./widget-base";
import { WeatherIcon } from "../dashboard/weather-icon";

interface WeatherWidgetProps {
    gridArea: WidgetGridArea;
    data: CurrentWeatherData;
}

function formatTime(value: string) {
  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function describeWeather(weatherCode: number) {
    if (weatherCode === 0) {
        return "Clear sky";
    }

    if (weatherCode === 1 || weatherCode === 2) {
        return "Partly cloudy";
    }

    if (weatherCode === 3) {
        return "Overcast";
    }

    if (weatherCode === 45 || weatherCode === 48) {
        return "Foggy";
    }

    if ([51, 53, 55, 56, 57].includes(weatherCode)) {
        return "Drizzle";
    }

    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
        return "Rain showers";
    }

    if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
        return "Snow";
    }

    if ([95, 96, 99].includes(weatherCode)) {
        return "Thunderstorm";
    }

    return "Current conditions";
}

export function WeatherWidget({ gridArea, data }: WeatherWidgetProps) {
    const now = new Date();
    const [sunriseHour, sunriseMinute] = data.sunrise.split(":").map(Number);
    const [sunsetHour, sunsetMinute] = data.sunset.split(":").map(Number);
    
    const sunrise = new Date();
    sunrise.setHours(sunriseHour as number, sunriseMinute as number, 0, 0);
    
    const sunset = new Date();
    sunset.setHours(sunsetHour as number, sunsetMinute as number, 0, 0);

    const isDaytime = now >= sunrise && now < sunset;

    const dayGradient = "bg-[radial-gradient(circle_at_left_bottom,_rgba(100,180,220,0.9),_rgba(100,180,220,0.3)_40%,_transparent)]";
    const nightGradient = "bg-[radial-gradient(circle_at_left_bottom,_rgba(20,40,100,0.9),_rgba(20,40,100,0.3)_40%,_transparent)]";

    const gradientClasses = isDaytime ? dayGradient : nightGradient;

    return (
        <WidgetBase gridArea={gridArea} className={gradientClasses}>
            <div className="flex h-full min-w-0 items-center justify-between gap-2 sm:gap-3">
                <WeatherIcon iconName={data.weatherIcon} className="relative -left-2 shrink-0 size-20 sm:-left-3 sm:size-28" />
                <div className="min-w-0 flex flex-col items-end text-right">
                    <div className="text-3xl sm:text-4xl font-bold leading-none">{Math.round(data.temperature)}°C</div>
                    <div className="mt-1 text-xs sm:text-sm text-white/85 truncate">{describeWeather(data.weatherCode)}</div>
                </div>
            </div>
        </WidgetBase>
    );
}

export function CloudCoverageWidget({ gridArea, data }: WeatherWidgetProps) {
    return (
        <IconWidgetBase
            gridArea={gridArea}
            icon={IconCloudFilled}
            iconClassName="text-white"
            title="Cloud Coverage"
            description={`${data.cloudCover}%`}
        />
    );
}

export function HumidityWidget({ gridArea, data }: WeatherWidgetProps) {
    return (
        <IconWidgetBase
            gridArea={gridArea}
            icon={IconDropletFilled}
            iconClassName="text-blue-400"
            title="Humidity"
            description={`${data.relativeHumidity}%`}
        />
    );
}

export function WindWidget({ gridArea, data }: WeatherWidgetProps) {
    return (
        <IconWidgetBase
            gridArea={gridArea}
            icon={IconWindsockFilled}
            iconClassName="text-red-300"
            title="Wind Speed"
            description={`${data.windSpeed.toFixed(1)} km/h`}
        />
    );
}

export function RainWidget({ gridArea, data }: WeatherWidgetProps) {
    return (
        <IconWidgetBase
            gridArea={gridArea}
            icon={IconUmbrellaFilled}
            iconClassName="text-sky-400"
            title="Precipitation"
            description={`${data.precipitation.toFixed(1)} mm`}
        />
    );
}

export function SunriseWidget({ gridArea, data }: WeatherWidgetProps) {
    return (
        <IconWidgetBase
            gridArea={gridArea}
            icon={IconSunrise}
            iconClassName="text-yellow-300"
            title="Sunrise"
            description={formatTime(data.sunrise)}
        />
    );
}

export function SunsetWidget({ gridArea, data }: WeatherWidgetProps) {
    return (
        <IconWidgetBase
            gridArea={gridArea}
            icon={IconSunset}
            iconClassName="text-orange-300"
            title="Sunset"
            description={formatTime(data.sunset)}
        />
    );
}