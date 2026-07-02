import { IconAlertTriangle } from "@tabler/icons-react";

import { useTranslation } from "@/lib/use-translation";

export function WeatherOutdatedBadge({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-extrabold text-amber-600 dark:bg-amber-400/15 dark:text-amber-300 ${className ?? ""}`}
    >
      <IconAlertTriangle className="size-3.5" />
      {t.weatherOutdatedBadge.label}
    </span>
  );
}
