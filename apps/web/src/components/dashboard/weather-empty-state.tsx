import { IconCloudOff, IconRefresh } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/use-translation";

export function WeatherEmptyState({
  onRetry,
  isRetrying,
}: {
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-[#17323a]/8 text-[#17323a]/45 dark:bg-white/10 dark:text-slate-300/60">
        <IconCloudOff className="size-5" />
      </div>
      <div className="max-w-60 text-[13px] font-bold text-[#17323a]/55 dark:text-slate-300/65">
        {t.weatherEmptyState.message}
      </div>
      <Button type="button" size="sm" onClick={onRetry} disabled={isRetrying}>
        <IconRefresh className={isRetrying ? "size-3.5 animate-spin" : "size-3.5"} />
        {isRetrying ? t.weatherEmptyState.retrying : t.weatherEmptyState.retry}
      </Button>
    </div>
  );
}
