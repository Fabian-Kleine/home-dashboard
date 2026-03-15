type WeatherIconProps = {
  iconName: string;
}

export function WeatherIcon({ iconName }: WeatherIconProps) {
  const iconFile = `${iconName}.svg`;

  return (
    <img
      src={`/weather-icons/${iconFile}`}
      alt={iconName}
      className="size-32 object-contain"
      loading="lazy"
      decoding="async"
    />
  );
}