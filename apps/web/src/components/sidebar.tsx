import { Link, useLocation, type LinkOptions } from "@tanstack/react-router";
import {
    IconChevronDown,
    IconChevronLeft,
    IconCloud,
    IconCloudFilled,
    IconHome,
    IconHomeFilled,
    IconMenu2,
    IconSolarPanel,
    type TablerIcon,
} from "@tabler/icons-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/use-translation";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useFullscreen } from "./fullscreen-context";

interface NavChild {
    to: LinkOptions["to"];
    label: string;
}

interface NavLink {
    to: LinkOptions["to"];
    label: string;
    icon: TablerIcon;
    iconActive?: TablerIcon;
    exact?: boolean;
    /** When present, this item expands to reveal sub-links; clicking it opens the first child. */
    children?: NavChild[];
}

const LINK_BASE =
    "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[15px] no-underline! transition-colors";
const LINK_ACTIVE =
    "bg-white/70 font-extrabold text-[#0f7d74] shadow-[0_4px_14px_rgba(20,90,90,0.1)] dark:bg-white/10 dark:text-teal-300 dark:shadow-[0_4px_14px_rgba(0,0,0,0.3)]";
const LINK_INACTIVE =
    "font-bold text-[#17323a]/60 hover:bg-white/40 dark:text-slate-300/70 dark:hover:bg-white/10";

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const { isFullscreen } = useFullscreen();
    const { pathname } = useLocation();
    const { t } = useTranslation();

    const NAV_LINKS: NavLink[] = [
        { to: "/", label: t.sidebar.navHome, exact: true, icon: IconHome, iconActive: IconHomeFilled },
        { to: "/weather", label: t.sidebar.navWeather, icon: IconCloud, iconActive: IconCloudFilled },
        {
            to: "/solar",
            label: t.sidebar.navSolar,
            icon: IconSolarPanel,
            children: [
                { to: "/solar", label: t.sidebar.navSolarLive },
                { to: "/solar/statistics", label: t.sidebar.navSolarStatistics },
            ],
        },
    ];

    const closeMobile = () => setIsOpen(false);

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

                <div className="px-2.5 pb-2 text-[11px] font-extrabold tracking-[0.08em] text-[#17323a]/45 dark:text-slate-300/50">
                    {t.sidebar.dashboards.toUpperCase()}
                </div>

                <nav className="flex flex-col gap-1.5">
                    {NAV_LINKS.map((link) => {
                        const sectionActive = link.exact
                            ? pathname === link.to
                            : pathname.startsWith(link.to as string);

                        if (!link.children) {
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    onClick={closeMobile}
                                    className={cn(LINK_BASE, sectionActive ? LINK_ACTIVE : LINK_INACTIVE)}
                                >
                                    {sectionActive && link.iconActive ? (
                                        <link.iconActive className="size-5" />
                                    ) : (
                                        <link.icon className="size-5" />
                                    )}
                                    {link.label}
                                </Link>
                            );
                        }

                        // Expandable item: expanded whenever its section is active, so navigating
                        // into (or out of) the section animates the sub-links open/closed.
                        const expanded = sectionActive;
                        const firstChildTo = link.children[0]?.to ?? link.to;

                        return (
                            <div key={link.to} className="flex flex-col">
                                {/* Clicking the parent opens the first child and expands the group. */}
                                <Link
                                    to={firstChildTo}
                                    className={cn(
                                        LINK_BASE,
                                        sectionActive
                                            ? "font-extrabold text-[#0f7d74] dark:text-teal-300"
                                            : LINK_INACTIVE,
                                    )}
                                >
                                    <link.icon className="size-5" />
                                    <span className="flex-1">{link.label}</span>
                                    <IconChevronDown
                                        className={cn(
                                            "size-4 shrink-0 transition-transform duration-300",
                                            expanded ? "rotate-0" : "-rotate-90",
                                        )}
                                    />
                                </Link>

                                <div
                                    className={cn(
                                        "grid transition-[grid-template-rows] duration-300 ease-out",
                                        expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                                    )}
                                >
                                    <div className="overflow-hidden">
                                        <div className="ml-6 mt-1 flex flex-col gap-1 border-l border-[#17323a]/12 pl-2.5 dark:border-white/10">
                                            {link.children.map((child) => {
                                                const childActive = pathname === child.to;
                                                return (
                                                    <Link
                                                        key={child.to}
                                                        to={child.to}
                                                        onClick={closeMobile}
                                                        tabIndex={expanded ? undefined : -1}
                                                        aria-hidden={!expanded}
                                                        className={cn(
                                                            "rounded-xl px-3.5 py-2.5 text-[14px] no-underline! transition-colors",
                                                            childActive
                                                                ? "bg-white/70 font-extrabold text-[#0f7d74] shadow-[0_4px_14px_rgba(20,90,90,0.1)] dark:bg-white/10 dark:text-teal-300 dark:shadow-[0_4px_14px_rgba(0,0,0,0.3)]"
                                                                : "font-semibold text-[#17323a]/55 hover:bg-white/40 dark:text-slate-300/65 dark:hover:bg-white/10",
                                                        )}
                                                    >
                                                        {child.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
