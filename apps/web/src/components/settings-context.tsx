import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getCookie, setCookie } from "@/lib/cookies";
import { useSunTimes } from "@/lib/weather";

export type ThemeMode = "auto" | "system" | "light" | "dark";
export type Language = "en" | "de" | "nl";

type SunTimes = { sunrise?: string; sunset?: string };

type SettingsContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  language: Language;
  setLanguage: (language: Language) => void;
};

const THEME_STORAGE_KEY = "aurora.theme";
const LANGUAGE_STORAGE_KEY = "aurora.language";
const LANGUAGE_COOKIE = "aurora_language";
const LANGUAGE_COOKIE_MAX_AGE_DAYS = 365;
const NIGHT_START_HOUR = 19;
const DAY_START_HOUR = 7;
const SUN_TIMES_MAX_AGE_MS = 5 * 60 * 1000;

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "de" || value === "nl";
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function isNightByTimeOfDay(date: Date) {
  const hour = date.getHours();
  return hour < DAY_START_HOUR || hour >= NIGHT_START_HOUR;
}

/** Parses a local `"HH:MM"` clock string into minutes-since-midnight, or null if malformed. */
function parseTimeToMinutes(value: string): number | null {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (hourText === undefined || minuteText === undefined || Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  return hour * 60 + minute;
}

/** Whether it's currently night per real sunrise/sunset, or null when times are missing/unparseable. */
function isNightBySunTimes(date: Date, sunTimes: SunTimes): boolean | null {
  if (!sunTimes.sunrise || !sunTimes.sunset) return null;

  const sunriseMinutes = parseTimeToMinutes(sunTimes.sunrise);
  const sunsetMinutes = parseTimeToMinutes(sunTimes.sunset);
  if (sunriseMinutes === null || sunsetMinutes === null) return null;

  const nowMinutes = date.getHours() * 60 + date.getMinutes();
  return nowMinutes < sunriseMinutes || nowMinutes >= sunsetMinutes;
}

function resolveIsDark(theme: ThemeMode, sunTimes: SunTimes) {
  if (theme === "light") return false;
  if (theme === "dark") return true;
  if (theme === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches;

  // "auto": follow the real sun when we have it, otherwise fall back to fixed hours.
  const now = new Date();
  return isNightBySunTimes(now, sunTimes) ?? isNightByTimeOfDay(now);
}

function readStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "auto" || stored === "system" || stored === "light" || stored === "dark" ? stored : "auto";
}

function readStoredLanguage(): Language {
  const cookieValue = getCookie(LANGUAGE_COOKIE);
  if (isLanguage(cookieValue)) return cookieValue;

  // Fall back to the legacy localStorage-only value for users who set a language before the cookie migration.
  const legacyValue = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (isLanguage(legacyValue)) return legacyValue;

  return "en";
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);
  const { sunrise, sunset } = useSunTimes(SUN_TIMES_MAX_AGE_MS);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    setCookie(LANGUAGE_COOKIE, next, LANGUAGE_COOKIE_MAX_AGE_DAYS);
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      document.documentElement.classList.toggle("dark", resolveIsDark(theme, { sunrise, sunset }));
    };

    applyTheme();

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", applyTheme);
      return () => media.removeEventListener("change", applyTheme);
    }

    if (theme === "auto") {
      const interval = setInterval(applyTheme, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [theme, sunrise, sunset]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({ theme, setTheme, language, setLanguage }),
    [theme, setTheme, language, setLanguage],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider.");
  }

  return context;
}
