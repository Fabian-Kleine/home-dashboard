import { cn } from "@/lib/utils";

type WeatherIconProps = {
  iconName: string;
  className?: string;
}

export function WeatherIcon({ iconName, className }: WeatherIconProps) {
  const iconFile = `${iconName}.svg`;

  return (
    <img
      src={`/weather-icons/${iconFile}`}
      alt={iconName}
      className={cn("object-contain", className)}
      loading="lazy"
      decoding="async"
    />
  );
}