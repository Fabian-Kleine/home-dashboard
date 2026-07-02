import { GlassCard } from "@/components/dashboard/glass-card";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/use-translation";
import { IconSparklesFilled } from "@tabler/icons-react";

export function OutlookCard({ summary, isLoading }: { summary: string; isLoading?: boolean }) {
  const { t } = useTranslation();

  return (
    <GlassCard className="col-span-12 flex items-start gap-4 p-6">
      <div>
        <div className="flex gap-1 mb-1.5 text-base font-semibold">
          <IconSparklesFilled />
          {t.outlook.title}
        </div>
        <div
          className={cn(
            "max-w-235 text-[15px] font-semibold leading-relaxed text-muted-foreground",
            isLoading && "shimmer shimmer-spread-4"
          )}
        >
          {summary}
        </div>
      </div>
    </GlassCard>
  );
}
