import { IconPlugConnectedX } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { useIsolar } from "@/components/isolar-context";
import { useTranslation } from "@/lib/use-translation";

export function IsolarEmptyState({ message }: { message?: string }) {
  const { openLoginDialog } = useIsolar();
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-[#17323a]/8 text-[#17323a]/45 dark:bg-white/10 dark:text-slate-300/60">
        <IconPlugConnectedX className="size-5" />
      </div>
      <div className="max-w-60 text-[13px] font-bold text-[#17323a]/55 dark:text-slate-300/65">
        {message ?? t.isolarEmptyState.defaultMessage}
      </div>
      <Button type="button" size="sm" onClick={openLoginDialog}>
        {t.isolarEmptyState.connect}
      </Button>
    </div>
  );
}
