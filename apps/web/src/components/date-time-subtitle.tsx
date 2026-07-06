import { useEffect, useState } from "react";

import { useTranslation } from "@/lib/use-translation";

/**
 * Live-updating date + time shown under a page title. Owns its own 1-second
 * ticker so only this small node re-renders (the surrounding page doesn't).
 */
export function DateTimeSubtitle() {
  const { locale } = useTranslation();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {now.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" })}
      {" · "}
      {now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </>
  );
}
