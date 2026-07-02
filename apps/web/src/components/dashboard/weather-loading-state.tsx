import { useTranslation } from "@/lib/use-translation";

export function WeatherLoadingState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 items-center justify-center py-6 text-[13px] font-bold text-[#17323a]/50 dark:text-slate-300/60">
      {t.weatherLoading.message}
    </div>
  );
}
