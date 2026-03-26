import { cn } from "@/lib/utils";
import { Link, type LinkOptions } from "@tanstack/react-router";
import { IconChevronRight } from "@tabler/icons-react";

export function WidgetGrid({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("min-w-0 px-4 sm:px-8 lg:px-12 grid gap-3 auto-rows-[84px] grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4", className)}>{children}</div>
    );
}

export type WidgetGridArea = {
    colSpan?: number;
    rowSpan?: number;
};

interface WidgetBaseProps extends React.HTMLAttributes<HTMLDivElement> {
    gridArea: WidgetGridArea;
}

export function WidgetBase({
    gridArea,
    children,
    className,
    style,
    ...props
}: WidgetBaseProps) {
    return (
        <div className={cn("p-4 bg-black/38 backdrop-blur-2xl rounded-2xl border border-white/12 shadow-[0_18px_50px_rgba(0,0,0,0.18)]", className)} style={{
            gridColumn: gridArea.colSpan ? `span ${gridArea.colSpan}` : undefined,
            gridRow: gridArea.rowSpan ? `span ${gridArea.rowSpan}` : undefined,
            ...style,
        }} {...props}>
            {children}
        </div>
    );
}

interface IconWidgetBaseProps extends WidgetBaseProps {
    icon: React.ElementType<{ className?: string }>;
    iconClassName?: string;
    title: string;
    description?: string;
}

export function IconWidgetBase({
    gridArea,
    icon: Icon,
    iconClassName,
    title,
    description,
    children,
    className,
    style,
    ...props
}: IconWidgetBaseProps) {
    return (
        <WidgetBase gridArea={gridArea} className={cn("flex items-center gap-3", className)} style={style} {...props}>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/30 text-white">
                <Icon className={cn("size-5", iconClassName)} />
            </div>
            <div className="min-w-0 w-full">
                <h3 className="text-sm font-medium text-white truncate">
                    {title}
                </h3>
                {description && (
                    <p className="mt-0.5 text-xs text-white/70 truncate">
                        {description}
                    </p>
                )}
                {children && <div className="mt-1 w-full">{children}</div>}
            </div>
        </WidgetBase>
    );
}

interface WidgetHeadingProps {
    children: React.ReactNode;
    to?: LinkOptions["to"];
    className?: string;
}

export function WidgetHeading({ children, className, to }: WidgetHeadingProps) {
    return (
        <Link to={to} className={cn("group flex items-center gap-0.5 w-fit px-4 sm:px-8 lg:px-12", to && "cursor-pointer", className)}>
            <h2 className="text-xl font-semibold tracking-wide text-white mb-0.5">
                {children}
            </h2>
            {to && <IconChevronRight className="size-6 group-hover:translate-x-0.5 transition-transform" />}
        </Link>
    );
}