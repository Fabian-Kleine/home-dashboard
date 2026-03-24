import { Link, useLocation } from "@tanstack/react-router";
import { House, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLinkProps {
    to: string;
    label: string;
    Icon: LucideIcon;
    active?: boolean;
}

const links: SidebarLinkProps[] = [
    {
        to: "/",
        label: "Home",
        Icon: House,
    },
    {
        to: "/test",
        label: "Test",
        Icon: House,
    },
    {
        to: "/test",
        label: "Test",
        Icon: House,
    },
];

export function Sidebar() {
    const location = useLocation();

    return (
        <div className="sticky top-0 flex flex-col items-center gap-2 h-screen w-92 bg-linear-180 from-white/35 to-slate-700/35 backdrop-blur-3xl px-4 py-12 border-r">
            <div className="w-full text-3xl font-medium tracking-tighter text-white px-2">
                Home
            </div>
            <nav className="flex flex-col gap-1 w-full">
                {links.map((link) => (
                    <SidebarLink key={link.to} {...link} active={link.to === location.pathname} />
                ))}
            </nav>
        </div>
    );

}

export function SidebarLink({
    to,
    label,
    Icon,
    active
}: SidebarLinkProps) {
    return (
        <Link
            to={to}
            className={cn(
                "flex items-center gap-2 text-white rounded-md py-2 px-1.5 hover:bg-black/50 transition-colors text-sm",
                active && "bg-white/90 text-black hover:bg-white/80 font-medium"
            )}
        >
            {Icon && <Icon className="size-5" strokeWidth={1.5} />}
            {label}
        </Link>
    );
}
