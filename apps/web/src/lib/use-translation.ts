import { useMemo } from "react";

import { useSettings, type Language } from "@/components/settings-context";
import { de, en, nl, type TranslationDict } from "@/lib/translations";

const DICTIONARIES: Record<Language, TranslationDict> = { en, de, nl };

export function useTranslation() {
  const { language } = useSettings();

  return useMemo(
    () => ({ t: DICTIONARIES[language], locale: DICTIONARIES[language].locale }),
    [language],
  );
}
