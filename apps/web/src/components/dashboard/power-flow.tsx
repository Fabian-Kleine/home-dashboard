import type { CSSProperties } from "react";
import type { DashboardData } from "@repo/shared";

import { useTranslation } from "@/lib/use-translation";

/**
 * Live power-flow widget — "P1 · Illustrated nodes" from the design system.
 * A compact row of illustrated solar / battery / home / grid nodes joined by
 * animated flow lines. Values are wired to the live dashboard data.
 *
 * Relies on the `flowdot` keyframes declared globally in `index.css`.
 */
export function PowerFlow({ data }: { data: DashboardData }) {
  const { t } = useTranslation();
  const fmt = (v: number) => Math.abs(v).toFixed(1);
  const isSolarActive = data.solar.current > 0;
  const isBatteryActive = data.battery.level > 0;
  const isGridActive = Math.abs(data.grid.current) > 0.05;
  const isGridImporting = data.grid.current < 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "var(--flow-bg)",
        borderRadius: 18,
        padding: "26px 34px",
      }}
    >
      {/* Solar */}
      <Node label={t.powerFlow.solar} value={fmt(data.solar.current)} unit="kW">
        <div style={{ position: "relative", height: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 6,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "radial-gradient(circle at 40% 40%,#ffd977,#f5b62c)",
              boxShadow: "0 0 14px rgba(245,182,44,.5)",
            }}
          />
          <div
            style={{
              width: 56,
              height: 38,
              transform: "perspective(120px) rotateX(24deg)",
              background: "#1f3a5f",
              borderRadius: 4,
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gridTemplateRows: "repeat(2,1fr)",
              gap: 3,
              padding: 4,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: "#3f83d6", borderRadius: 1 }} />
            ))}
          </div>
        </div>
      </Node>

      <FlowLine color="#f5b62c" delays={[0, 0.63, 1.26]} active={isSolarActive} />

      {/* Battery */}
      <Node label={t.powerFlow.battery} value={String(data.battery.level)} unit="%">
        <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "relative", width: 54, height: 30, border: "3px solid var(--flow-ink)", borderRadius: 7, padding: 3 }}>
            <div style={{ position: "absolute", right: -7, top: 8, width: 5, height: 12, background: "var(--flow-ink)", borderRadius: "0 3px 3px 0" }} />
            <div
              style={{
                width: `${Math.max(0, Math.min(100, data.battery.level))}%`,
                height: "100%",
                background: "linear-gradient(90deg,#1fb36a,#16a99a)",
                borderRadius: 3,
              }}
            />
          </div>
        </div>
      </Node>

      <FlowLine color="#16a99a" delays={[0.3, 0.93, 1.56]} active={isBatteryActive} />

      {/* Home */}
      <Node label={t.powerFlow.home} value={fmt(data.consumption.current)} unit="kW">
        <div style={{ position: "relative", height: 60, width: 66, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", top: 3, right: 13, width: 7, height: 15, background: "#0f8b7f", borderRadius: "2px 2px 0 0" }} />
          <div style={{ width: 62, height: 26, background: "#16a99a", clipPath: "polygon(50% 0,100% 100%,0 100%)" }} />
          <div
            style={{
              width: 46,
              height: 32,
              background: "var(--flow-house-wall)",
              border: "1px solid var(--flow-house-border)",
              borderTop: "none",
              borderRadius: "0 0 4px 4px",
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
            }}
          >
            <div style={{ position: "absolute", top: 5, left: 6, width: 9, height: 9, background: "var(--flow-window-bg)", border: "1px solid var(--flow-window-border)", borderRadius: 2 }} />
            <div style={{ position: "absolute", top: 5, right: 6, width: 9, height: 9, background: "var(--flow-window-bg)", border: "1px solid var(--flow-window-border)", borderRadius: 2 }} />
            <div style={{ width: 11, height: 15, background: "#16a99a", borderRadius: "3px 3px 0 0" }} />
          </div>
        </div>
      </Node>

      <FlowLine color="#1fb36a" delays={[0.15, 0.78, 1.41]} active={isGridActive} reverse={isGridImporting} />

      {/* Grid */}
      <Node label={t.powerFlow.grid} value={`${data.grid.current > 0 ? "+" : data.grid.current < 0 ? "-" : ""}${fmt(data.grid.current)}`} unit="kW">
        <div style={{ height: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <svg width={58} height={60} viewBox="0 0 56 60">
            <g stroke="var(--flow-grid-stroke)" strokeWidth={2.2} strokeLinecap="round" fill="none">
              <line x1={16} y1={58} x2={26} y2={9} />
              <line x1={40} y1={58} x2={30} y2={9} />
              <line x1={26} y1={9} x2={30} y2={9} />
              <line x1={12} y1={16} x2={44} y2={16} />
              <line x1={9} y1={24} x2={47} y2={24} />
              <line x1={20} y1={35} x2={36} y2={35} />
              <line x1={17} y1={47} x2={39} y2={47} />
              <line x1={20} y1={35} x2={36} y2={47} />
              <line x1={36} y1={35} x2={20} y2={47} />
              <line x1={16} y1={58} x2={36} y2={47} />
              <line x1={40} y1={58} x2={20} y2={47} />
              <line x1={22} y1={26} x2={34} y2={35} />
              <line x1={34} y1={26} x2={22} y2={35} />
              <line x1={25} y1={16} x2={31} y2={9} />
              <line x1={31} y1={16} x2={25} y2={9} />
            </g>
            <g fill="#f5b62c">
              <circle cx={12} cy={16} r={2.4} />
              <circle cx={44} cy={16} r={2.4} />
              <circle cx={9} cy={24} r={2.4} />
              <circle cx={47} cy={24} r={2.4} />
              <circle cx={28} cy={16} r={2} />
            </g>
          </svg>
        </div>
      </Node>
    </div>
  );
}

function Node({ label, value, unit, children }: { label: string; value: string; unit: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: 96 }}>
      {children}
      <div style={{ fontWeight: 600, fontSize: 18, color: "var(--flow-ink)" }}>
        {value}
        <span style={{ fontSize: 12, color: "var(--flow-muted)" }}> {unit}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--flow-muted)", letterSpacing: "0.03em" }}>{label}</div>
    </div>
  );
}

function FlowLine({
  color,
  delays,
  active = true,
  reverse = false,
}: {
  color: string;
  delays: number[];
  active?: boolean;
  reverse?: boolean;
}) {
  const dot: CSSProperties = {
    position: "absolute",
    top: -2.5,
    left: 0,
    width: 9,
    height: 9,
    marginLeft: -4,
    borderRadius: "50%",
    background: color,
  };

  return (
    <div style={{ position: "relative", flex: 1, height: 4, margin: "0 8px 44px", borderRadius: 3, background: "var(--flow-track)", maxWidth: 150 }}>
      {active &&
        delays.map((d, i) => (
          <div
            key={i}
            style={{
              ...dot,
              animation: `flowdot 1.9s linear infinite ${d}s`,
              animationDirection: reverse ? "reverse" : "normal",
            }}
          />
        ))}
    </div>
  );
}
