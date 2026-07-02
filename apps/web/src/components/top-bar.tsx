import type { ReactNode } from "react";
import {
  IconArrowsDiagonal,
  IconArrowsDiagonalMinimize2,
  IconDotsVertical,
  IconLanguage,
  IconLogout,
  IconPalette,
  IconPlugConnected,
  IconRefresh,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFullscreen } from "@/components/fullscreen-context";
import { useIsolar } from "@/components/isolar-context";
import { usePageRefreshControls } from "@/components/page-refresh-context";
import { useSettings, type Language, type ThemeMode } from "@/components/settings-context";
import { useTranslation } from "@/lib/use-translation";

/** Shared page header: title/subtitle slot on the left, refresh/fullscreen/settings controls on the right. Refresh state comes from whatever the current route registered via `useRegisterPageRefresh`. */
export function TopBar({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  const { isFullscreen, isSupported, toggleFullscreen, container } = useFullscreen();
  const { theme, setTheme, language, setLanguage } = useSettings();
  const { isLoggedIn: isSungrowConnected, openLoginDialog, logout: disconnectSungrow } = useIsolar();
  const { refreshConfig } = usePageRefreshControls();
  const { t } = useTranslation();

  const handleRefresh = () => {
    void refreshConfig.onRefresh?.();
  };

  return (
    <header className="mb-5 flex items-center justify-between gap-4 px-1">
      <div className="min-w-0">
        <div className="truncate text-2xl font-semibold tracking-tight">{title}</div>
        {subtitle && (
          <div className="mt-0.5 text-[13.5px] font-bold text-[#17323a]/60 dark:text-slate-300/70">
            {subtitle}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshConfig.disabled}
          aria-label={refreshConfig.label}
          className="flex size-10 items-center justify-center rounded-2xl border border-white/40 bg-white/25 text-[#17323a]/55 backdrop-blur-md transition-colors hover:bg-white/45 hover:text-[#0f7d74] disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-slate-300/70 dark:hover:bg-white/15 dark:hover:text-teal-300"
        >
          <IconRefresh className={cn("size-4.5", refreshConfig.isRefreshing && "animate-spin")} />
        </button>
        {isSupported && (
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? t.header.exitFullscreen : t.header.enterFullscreen}
            className="flex size-10 items-center justify-center rounded-2xl border border-white/40 bg-white/25 text-[#17323a]/55 backdrop-blur-md transition-colors hover:bg-white/45 hover:text-[#0f7d74] dark:border-white/10 dark:bg-white/10 dark:text-slate-300/70 dark:hover:bg-white/15 dark:hover:text-teal-300"
          >
            {isFullscreen ? <IconArrowsDiagonalMinimize2 className="size-4.5" /> : <IconArrowsDiagonal className="size-4.5" />}
          </button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t.header.moreOptions}
              className="flex size-10 items-center justify-center rounded-2xl border border-white/40 bg-white/25 text-[#17323a]/55 backdrop-blur-md transition-colors hover:bg-white/45 hover:text-[#0f7d74] aria-expanded:bg-white/45 aria-expanded:text-[#0f7d74] dark:border-white/10 dark:bg-white/10 dark:text-slate-300/70 dark:hover:bg-white/15 dark:hover:text-teal-300 dark:aria-expanded:bg-white/15 dark:aria-expanded:text-teal-300"
            >
              <IconDotsVertical className="size-4.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" container={container ?? undefined}>
            <DropdownMenuItem onSelect={handleRefresh} disabled={refreshConfig.disabled}>
              <IconRefresh className={cn(refreshConfig.isRefreshing && "animate-spin")} />
              {refreshConfig.label}
            </DropdownMenuItem>
            {isSupported && (
              <DropdownMenuItem onSelect={() => void toggleFullscreen()}>
                {isFullscreen ? <IconArrowsDiagonalMinimize2 /> : <IconArrowsDiagonal />}
                {isFullscreen ? t.header.exitFullscreen : t.header.enterFullscreen}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <IconLanguage />
                {t.header.language}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={language}
                  onValueChange={(value) => setLanguage(value as Language)}
                >
                  <DropdownMenuRadioItem value="de">Deutsch</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="nl">Nederlands</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <IconPalette />
                {t.header.theme}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={theme}
                  onValueChange={(value) => setTheme(value as ThemeMode)}
                >
                  <DropdownMenuRadioItem value="auto">{t.theme.auto}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">{t.theme.system}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="light">{t.theme.light}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">{t.theme.dark}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => (isSungrowConnected ? disconnectSungrow() : openLoginDialog())}
            >
              {isSungrowConnected ? <IconLogout /> : <IconPlugConnected />}
              {isSungrowConnected ? t.sungrow.logout : t.sungrow.connect}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
