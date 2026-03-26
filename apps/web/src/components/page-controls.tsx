import { useFullscreen } from "@/components/fullscreen-context";
import { usePageRefreshControls } from "@/components/page-refresh-context";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { IconArrowsDiagonal, IconArrowsDiagonalMinimize2, IconRefresh } from "@tabler/icons-react";

export function PageControls() {
  const { isFullscreen, isSupported, toggleFullscreen } = useFullscreen();
  const { refreshConfig } = usePageRefreshControls();

  const handleRefresh = () => {
    if (!refreshConfig.onRefresh || refreshConfig.disabled) {
      return;
    }

    void refreshConfig.onRefresh();
  };

  return (
    <div className="fixed right-2 top-2 z-20 flex items-center gap-2 sm:right-5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={() => void toggleFullscreen()}
            disabled={!isSupported}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <IconArrowsDiagonalMinimize2 className="size-5" /> : <IconArrowsDiagonal className="size-5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isSupported ? (isFullscreen ? "Exit fullscreen" : "Enter fullscreen") : "Fullscreen unavailable"}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={handleRefresh}
            disabled={refreshConfig.disabled || !refreshConfig.onRefresh}
            aria-label={refreshConfig.label}
          >
            <IconRefresh className={cn("size-5", refreshConfig.isRefreshing ? "animate-spin" : undefined)} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{refreshConfig.label}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}