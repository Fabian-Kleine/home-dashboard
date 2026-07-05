import type { ProductionStatus, WeatherIcon } from "./consts";

export type HealthResponse = {
  ok: true;
  service: string;
  timestamp: string;
};

export type WeatherRequestParams = {
  longitude: number;
  latitude: number;
  timezone: string;
};

export type CurrentWeatherData = {
    temperature: number;
    relativeHumidity: number;
    apparentTemperature: number;
    precipitation: number;
    rain: number;
    weatherCode: number;
    weatherIcon: WeatherIcon;
    cloudCover: number;
    windSpeed: number;
    sunrise: string;
    sunset: string;
  };

export type WeatherData = {
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
    weatherCode: number[];
    weatherIcon: WeatherIcon[];
    temperatureMax: number[];
    temperatureMin: number[];
    daylightDuration: number[];
    sunshineDuration: number[];
    cloudCoverMean: number[];
    cloudCoverMax: number[];
    cloudCoverMin: number[];
  };
  current: CurrentWeatherData;
};

export type PowerSource = {
  current: number;
  unit: string;
};

export type EnergyTimePoint = {
  time: string;
  production: number;
  consumption: number;
};

export type IsolarLoginRequest = {
  email: string;
  password: string;
};

export type IsolarStatusResponse = {
  loggedIn: boolean;
};

export type IsolarPvString = {
  label: string;
  powerKw: number;
};

export type IsolarSolarData = {
  solarPowerKw: number;
  gridPowerKw: number;
  batteryPowerKw: number;
  batteryLevel: number;
  loadPowerKw: number;
  dailyYieldKwh: number;
  pvStrings: IsolarPvString[];
};

/** One month of total PV production. `month` is an ISO "YYYY-MM" anchor for locale-aware labelling. */
export type IsolarMonthlyProductionPoint = {
  month: string;
  productionKwh: number;
};

/**
 * One timestamp of per-roof PV output (kW) for the intraday power chart. `time` is a
 * local ISO datetime with no offset (e.g. "2024-07-24T08:15:00") — the dashboard runs
 * in the plant's own timezone, so it's formatted as-is.
 */
export type IsolarRoofPowerPoint = {
  time: string;
  east: number;
  west: number;
};

/**
 * Historical production for the Statistics page, from iSolarCloud's day/month/year and
 * minute-level measuring-point endpoints. Any list may be empty if the API returns
 * nothing usable, in which case the frontend falls back to sample data.
 */
export type IsolarStatistics = {
  monthly: IsolarMonthlyProductionPoint[];
  /** Per-roof output over the most recent full day (the minute endpoint excludes today). */
  roofPower: IsolarRoofPowerPoint[];
};

export type DashboardData = {
  weather: CurrentWeatherData;
  solar: PowerSource;
  grid: PowerSource;
  battery: PowerSource & { level: number };
  consumption: PowerSource;
  productionStatus: ProductionStatus;
  energyHistory: EnergyTimePoint[];
  summary: string;
  lastUpdated: string;
};

export type AiOverviewRequest = {
  weather: CurrentWeatherData;
  productionStatus: ProductionStatus;
  isSungrowConnected: boolean;
  solar?: IsolarSolarData;
  language: string;
};

export type AiOverviewResponse = {
  summary: string;
};

/**
 * A single normalized news item from the Tagesschau feed. The backend flattens the
 * source's verbose shape (tracking, streams, image variants, …) down to just what the
 * dashboard renders.
 */
export type NewsArticle = {
  /** Stable id from the source feed (`sophoraId`, falling back to `externalId`). */
  id: string;
  title: string;
  /** ISO 8601 publication timestamp. */
  date: string;
  /** Short kicker/region above the headline (e.g. "Schleswig-Holstein"), if present. */
  topline?: string;
  /** Teaser sentence, if present. */
  firstSentence?: string;
  /** 16:9 teaser image URL chosen from the source's variants, if present. */
  imageUrl?: string;
  imageAlt?: string;
  /** Article tags, flattened from the source's `{ tag }[]`. */
  tags: string[];
  /** Source content type, e.g. "story" or "video". */
  type: string;
  /** Whether the source flagged this as breaking news. */
  breakingNews: boolean;
  /** Web URL to open the full article/video in a browser, if available. */
  link?: string;
};

export type NewsData = {
  articles: NewsArticle[];
  /** ISO 8601 timestamp of when the backend last fetched from the source. */
  updatedAt: string;
};