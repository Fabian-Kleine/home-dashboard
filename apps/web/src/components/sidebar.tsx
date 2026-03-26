import { Link, useLocation, type LinkOptions } from "@tanstack/react-router";
import { IconChevronLeft, IconHome, IconHomeFilled, IconMenu2, IconSolarPanel, IconTemperatureSun } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useFullscreen } from "./fullscreen-context";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

interface SidebarRouteLink {
    type: "link";
    to: LinkOptions["to"];
    label: string;
    Icon: React.ElementType<{ className?: string; strokeWidth?: number | string }>;
    IconActive?: React.ElementType<{ className?: string; strokeWidth?: number | string }>;
}

interface SidebarCategory {
    type: "category";
    label: string;
    links: SidebarRouteLink[];
}

type SidebarItem = SidebarRouteLink | SidebarCategory;

const links: SidebarItem[] = [
    {
        type: "link",
        to: "/",
        label: "Home",
        Icon: IconHome,
        IconActive: IconHomeFilled,
    },
    {
        type: "category",
        label: "Outdoors",
        links: [
            {
                type: "link",
                to: "/weather",
                label: "Weather",
                Icon: IconTemperatureSun,
            },
            {
                type: "link",
                to: "/solar",
                label: "Solar System",
                Icon: IconSolarPanel,
            },
        ]
    }
];

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [openCategory, setOpenCategory] = useState<string | undefined>();
    const { isFullscreen } = useFullscreen();
    const { pathname } = useLocation();

    useEffect(() => {
        const activeCategory = links.find(
            (item): item is SidebarCategory =>
                item.type === "category" && item.links.some((link) => link.to === pathname),
        );

        setOpenCategory(activeCategory?.label);
    }, [pathname]);

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
                        <IconMenu2 className="size-5" />
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
                    <IconChevronLeft />
                </Button>
                <nav className="flex flex-col gap-1 w-full">
                    {links.map((item) => (
                        item.type === "link" ? (
                            <SidebarLink key={item.to} {...item} onNavigate={() => setIsOpen(false)} />
                        ) : (
                            <SidebarCategorySection
                                key={item.label}
                                category={item}
                                openCategory={openCategory}
                                onOpenCategoryChange={setOpenCategory}
                                onNavigate={() => setIsOpen(false)}
                            />
                        )
                    ))}
                </nav>
            </aside>
        </>
    );

}

interface SidebarCategorySectionProps {
    category: SidebarCategory;
    openCategory?: string;
    onOpenCategoryChange: (value?: string) => void;
    onNavigate: () => void;
}

function SidebarCategorySection({
    category,
    openCategory,
    onOpenCategoryChange,
    onNavigate,
}: SidebarCategorySectionProps) {
    return (
        <Accordion
            type="single"
            collapsible
            className="overflow-visible rounded-none border-0 bg-transparent"
            value={openCategory}
            onValueChange={onOpenCategoryChange}
        >
            <AccordionItem value={category.label} className="border-b-0 bg-transparent data-open:bg-transparent mt-4">
                <AccordionTrigger className="items-center rounded-md p-1.5 text-lg font-medium text-white hover:bg-black/40 hover:no-underline **:data-[slot=accordion-trigger-icon]:text-white">
                    {category.label}
                </AccordionTrigger>
                <AccordionContent
                    className="flex flex-col gap-1 px-0 text-white"
                    contentClassName="px-0.5"
                >
                    {category.links.map((link) => (
                        <SidebarLink key={link.to} {...link} onNavigate={onNavigate} />
                    ))}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}

export function SidebarLink({
    to,
    label,
    Icon,
    IconActive,
    onNavigate,
}: SidebarRouteLink & { onNavigate?: () => void }) {
    return (
        <Link
            to={to}
            onClick={onNavigate}
            className={cn(
                "group flex items-center gap-2 text-white rounded-md py-2 px-1.5 hover:bg-black/50 transition-colors text-base! no-underline!",
                "data-[status=active]:bg-white/90 data-[status=active]:text-black! data-[status=active]:hover:bg-white/80 data-[status=active]:font-medium"
            )}
        >
            {Icon && <Icon className={cn("size-6", IconActive && "group-data-[status=active]:hidden")} strokeWidth={1.5} />}
            {IconActive && <IconActive className={cn("size-6", "hidden group-data-[status=active]:inline")} strokeWidth={1.5} />}
            {label}
        </Link>
    );
}
