import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "auto" | "system" | "light" | "dark";
export type Language = "en" | "de";

type SettingsContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  language: Language;
  setLanguage: (language: Language) => void;
};

const THEME_STORAGE_KEY = "aurora.theme";
const LANGUAGE_STORAGE_KEY = "aurora.language";
const NIGHT_START_HOUR = 19;
const DAY_START_HOUR = 7;

const SettingsContext = createContext<SettingsContextValue | null>(null);

function isNightByTimeOfDay(date: Date) {
  const hour = date.getHours();
  return hour < DAY_START_HOUR || hour >= NIGHT_START_HOUR;
}

function resolveIsDark(theme: ThemeMode) {
  if (theme === "light") return false;
  if (theme === "dark") return true;
  if (theme === "system") return window.matchMedia("(prefers-color-scheme: dark)").matches;
  return isNightByTimeOfDay(new Date());
}

function readStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "auto" || stored === "system" || stored === "light" || stored === "dark" ? stored : "auto";
}

function readStoredLanguage(): Language {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "en" || stored === "de" ? stored : "en";
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readStoredTheme);
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    const applyTheme = () => {
      document.documentElement.classList.toggle("dark", resolveIsDark(theme));
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
  }, [theme]);

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
