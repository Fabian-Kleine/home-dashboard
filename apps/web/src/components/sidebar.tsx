import { Link, type LinkOptions } from "@tanstack/react-router";
import { ChevronLeft, House, Menu, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useFullscreen } from "./fullscreen-context";

interface SidebarLinkProps {
    to: LinkOptions["to"];
    label: string;
    Icon: LucideIcon;
}

const links: SidebarLinkProps[] = [
    {
        to: "/",
        label: "Home",
        Icon: House,
    },
    {
        to: "/",
        label: "Test",
        Icon: House,
    },
    {
        to: "/",
        label: "Test",
        Icon: House,
    },
];

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const { isFullscreen } = useFullscreen();

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        className={cn(
                            "fixed left-2 top-2 z-20 flex",
                            !isFullscreen && "md:hidden",
                        )}
                        variant="ghost"
                        size="icon-lg"
                        onClick={() => setIsOpen((open) => !open)}
                    >
                        <Menu />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Toggle menu</p>
                </TooltipContent>
            </Tooltip>
            <aside className={cn(
                "top-0 flex h-screen w-[min(22rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] flex-col items-center gap-2 bg-linear-180 from-white/35 to-slate-700/35 px-4 py-12 backdrop-blur-3xl border-r transition-transform z-30",
                isFullscreen
                    ? "fixed -translate-x-full"
                    : "fixed -translate-x-full md:sticky md:translate-x-0 md:w-92",
                isOpen && "translate-x-0",
            )}>
                <Button variant="ghost" size="icon" className={cn("absolute top-2 right-2 md:hidden", isFullscreen && "md:flex")} onClick={() => setIsOpen(false)}>
                    <ChevronLeft />
                </Button>
                <nav className="flex flex-col gap-1 w-full">
                    {links.map((link) => (
                        <SidebarLink key={link.to} {...link} />
                    ))}
                </nav>
            </aside>
        </>
    );

}

export function SidebarLink({
    to,
    label,
    Icon,
}: SidebarLinkProps) {
    return (
        <Link
            to={to}
            className={cn(
                "flex items-center gap-2 text-white rounded-md py-2 px-1.5 hover:bg-black/50 transition-colors text-sm",
                "data-[status=active]:bg-white/90 data-[status=active]:text-black data-[status=active]:hover:bg-white/80 font-medium"
            )}
        >
            {Icon && <Icon className="size-5" strokeWidth={1.5} />}
            {label}
        </Link>
    );
}
