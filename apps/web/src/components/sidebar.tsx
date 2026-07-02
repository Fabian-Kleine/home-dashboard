import { Link, useLocation, type LinkOptions } from "@tanstack/react-router";
import { IconChevronLeft, IconMenu2 } from "@tabler/icons-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/use-translation";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useFullscreen } from "./fullscreen-context";

interface NavLink {
    to: LinkOptions["to"];
    label: string;
    exact?: boolean;
}

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const { isFullscreen } = useFullscreen();
    const { pathname } = useLocation();
    const { t } = useTranslation();

    const NAV_LINKS: NavLink[] = [
        { to: "/", label: t.sidebar.navHome, exact: true },
        { to: "/weather", label: t.sidebar.navWeather },
        { to: "/solar", label: t.sidebar.navSolar },
    ];

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        className={cn(
                            "fixed left-2 top-2 z-40 flex text-[#0f7d74] dark:text-teal-300",
                            !isFullscreen && "md:hidden",
                        )}
                        variant="ghost"
                        size="icon-lg"
                        onClick={() => setIsOpen((open) => !open)}
                    >
                        <IconMenu2 className="size-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t.sidebar.toggleMenu}</p>
                </TooltipContent>
            </Tooltip>

            <aside
                className={cn(
                    "top-0 z-30 flex h-screen w-[min(15rem,calc(100vw-1rem))] shrink-0 flex-col gap-1.5 border-r border-white/45 bg-white/34 px-4 py-7 backdrop-blur-2xl backdrop-saturate-150 transition-transform dark:border-white/10 dark:bg-slate-900/50",
                    isFullscreen
                        ? "fixed -translate-x-full"
                        : "fixed -translate-x-full md:sticky md:translate-x-0",
                    isOpen && "translate-x-0",
                )}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("absolute right-2 top-2 text-[#0f7d74] md:hidden dark:text-teal-300", isFullscreen && "md:flex")}
                    onClick={() => setIsOpen(false)}
                >
                    <IconChevronLeft />
                </Button>

                {/* Brand */}
                <div className="flex items-center gap-3 px-2 pb-6 pt-0.5">
                    <div className="size-9 rounded-xl bg-linear-to-br from-[#16a99a] to-[#2e8fe6]" />
                    <div className="text-xl font-semibold text-[#17323a] dark:text-slate-100">Aurora</div>
                </div>

                <div className="px-2.5 pb-2 text-[11px] font-extrabold tracking-[0.08em] text-[#17323a]/45 dark:text-slate-300/50">
                    {t.sidebar.dashboards.toUpperCase()}
                </div>

                <nav className="flex flex-col gap-1.5">
                    {NAV_LINKS.map((link) => {
                        const active = link.exact ? pathname === link.to : pathname.startsWith(link.to as string);
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[15px] no-underline! transition-colors",
                                    active
                                        ? "bg-white/70 font-extrabold text-[#0f7d74] shadow-[0_4px_14px_rgba(20,90,90,0.1)] dark:bg-white/10 dark:text-teal-300 dark:shadow-[0_4px_14px_rgba(0,0,0,0.3)]"
                                        : "font-bold text-[#17323a]/60 hover:bg-white/40 dark:text-slate-300/70 dark:hover:bg-white/10",
                                )}
                            >
                                <span className={cn("size-2.5 rounded-full", active ? "bg-[#16a99a]" : "bg-[#17323a]/20 dark:bg-white/20")} />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
