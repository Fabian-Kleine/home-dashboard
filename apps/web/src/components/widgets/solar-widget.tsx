import type { DashboardData, ProductionStatus } from "@repo/shared";
import { ArrowLeftRight, ArrowRight, BatteryCharging, House, Leaf, SolarPanel, Sun, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

import { IconWidgetBase, WidgetBase, type WidgetGridArea } from "./widget-base";
import { PowerFlowDiagram } from "../dashboard/power-flow";
import { CircularProgress } from "../ui/progress";

interface SolarWidgetProps {
    gridArea: WidgetGridArea;
    data: DashboardData;
}

function describeBatteryFlow(value: number) {
    if (value > 0) {
        return "Charging from surplus";
    }

    if (value < 0) {
        return "Discharging to support load";
    }

    return "Battery standing by";
}

function describeGridFlow(value: number) {
    if (value > 0) {
        return "Exporting energy";
    }

    if (value < 0) {
        return "Importing energy";
    }

    return "Grid neutral";
}

function formatPower(value: number, unit: string) {
    return `${Math.abs(value).toFixed(2)} ${unit}`;
}

export function SolarSystemWidgetCompact({ gridArea, data }: SolarWidgetProps) {
    return (
        <WidgetBase
            gridArea={gridArea}
            className="flex flex-col justify-between overflow-hidden bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.18),transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.95))]"
        >
            <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
                <div className="min-w-0 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-2 text-center">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-amber-100/70">
                        <SolarPanel className="size-4 inline-block" />
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold text-white">{formatPower(data.solar.current, data.solar.unit)}</div>
                </div>
                <div className="text-amber-200/80">
                    <ArrowRight className="size-4 inline-block" />
                </div>
                <div className="min-w-0 rounded-2xl border border-sky-300/20 bg-sky-300/10 p-2 text-center">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-sky-100/70">
                        <House className="size-4 inline-block" />
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold text-white">{formatPower(data.consumption.current, data.consumption.unit)}</div>
                </div>
                <div className="text-emerald-200/80">
                    <ArrowLeftRight className="size-4 inline-block" />
                </div>
                <div className="min-w-0 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-2 text-center">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-100/70">
                        <BatteryCharging className="size-4 inline-block" />
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold text-white">{data.battery.level}%</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    Battery: {describeBatteryFlow(data.battery.current)}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    Grid: {describeGridFlow(data.grid.current)}
                </div>
            </div>
        </WidgetBase>
    );
}

export function SolarSystemWidget({ gridArea, data }: SolarWidgetProps) {
    return (
        <WidgetBase
            gridArea={gridArea}
            className="min-[420px]:col-span-2 flex flex-col gap-4 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.18),transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.95))]"
        >
            <div className="grid gap-2 text-xs text-white/75 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-white/55">Production</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                        {data.solar.current.toFixed(2)} {data.solar.unit}
                    </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-white/55">Consumption</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                        {data.consumption.current.toFixed(2)} {data.consumption.unit}
                    </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-white/55">Battery level</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                        {data.battery.level}%
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1">
                <PowerFlowDiagram data={data} />
            </div>
        </WidgetBase>
    );
}

export function SolarProductionWidget({ gridArea, data }: SolarWidgetProps) {
    return (
        <IconWidgetBase
            gridArea={gridArea}
            icon={Sun}
            iconClassName="text-amber-300"
            title="Solar Production"
            description={formatPower(data.solar.current, data.solar.unit)}
        />
    );
}

export function ConsumptionWidget({ gridArea, data }: SolarWidgetProps) {
    return (
        <IconWidgetBase
            gridArea={gridArea}
            icon={House}
            iconClassName="text-sky-300"
            title="Home Consumption"
            description={formatPower(data.consumption.current, data.consumption.unit)}
        />
    );
}

export function BatteryWidget({ gridArea, data }: SolarWidgetProps) {
    const progressColor =
        data.battery.level > 60 ? "stroke-emerald-500" : data.battery.level > 25 ? "stroke-amber-400" : "stroke-red-400";

    return (
        <WidgetBase
            gridArea={gridArea}
        >
            <div className="flex justify-between items-center h-full w-full flex-col">
                <div className="relative flex w-full flex-col items-start">
                    <CircularProgress
                        className="stroke-white/25"
                        progressClassName={progressColor}
                        value={data.battery.level}
                        renderLabel={(value) => `${value}%`}
                        showLabel
                    />
                </div>
                <div className="text-2xl text-end w-full mt-auto text-white font-semibold">
                    {formatPower(data.battery.current, data.battery.unit)}
                </div>
            </div>
        </WidgetBase>
    );
}

export function GridWidget({ gridArea, data }: SolarWidgetProps) {
    return (
        <IconWidgetBase
            gridArea={gridArea}
            icon={ArrowLeftRight}
            iconClassName="text-violet-200"
            title="Grid Exchange"
            description={formatPower(data.grid.current, data.grid.unit)}
        />
    );
}

const statusConfig: Record<
    ProductionStatus,
    { label: string; icon: LucideIcon; className: string }
> = {
    good: {
        label: "Good production",
        icon: TrendingUp,
        className: "text-emerald-400",
    },
    average: {
        label: "Average production",
        icon: Leaf,
        className: "text-amber-400",
    },
    reduced: {
        label: "Reduced production",
        icon: TrendingDown,
        className: "text-red-400",
    },
};

export function ProductionWidget({ gridArea, data }: SolarWidgetProps) {
    const cfg = statusConfig[data.productionStatus];

    return (
        <IconWidgetBase
            gridArea={gridArea}
            icon={cfg.icon}
            iconClassName={cfg.className}
            title="Production Status"
            description={cfg.label}
        />
    );
}
