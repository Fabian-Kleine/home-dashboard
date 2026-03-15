import type { DashboardData } from "@repo/shared";

/**
 * Power flow diagram — isometric-style SVG showing solar, house, battery, grid
 * with animated flow lines and live watt labels, similar to common solar inverter UIs.
 */
export function PowerFlowDiagram({ data }: { data: DashboardData }) {
  const solar = data.solar.current;
  const battery = data.battery.current;
  const batteryLevel = data.battery.level;
  const grid = data.grid.current;
  const consumption = data.consumption.current;

  const fmt = (v: number, u: string) =>
    v >= 1 ? `${v.toFixed(1)} ${u}` : `${Math.round(v * 1000)} W`;

  return (
    <div className="relative mx-auto w-full max-w-[520px] select-none py-2">
      <svg
        viewBox="0 0 520 440"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto w-full"
      >
        {/* ── Animated flow dashes style ── */}
        <defs>
          <style>{`
            @keyframes flowDown  { to { stroke-dashoffset: -20; } }
            @keyframes flowUp    { to { stroke-dashoffset: 20; } }
            @keyframes flowRight { to { stroke-dashoffset: -20; } }
            @keyframes flowLeft  { to { stroke-dashoffset: 20; } }
          `}</style>
        </defs>

        {/* ── Flow lines ── */}
        {/* Solar → House */}
        {solar > 0 && (
          <line
            x1="260" y1="95" x2="260" y2="175"
            stroke="rgba(250,204,21,0.5)"
            strokeWidth="3"
            strokeDasharray="6 4"
            style={{ animation: "flowDown 0.6s linear infinite" }}
          />
        )}
        {/* House → Battery */}
        {battery > 0 && (
          <polyline
            points="230,270 180,310 130,350"
            stroke="rgba(52,211,153,0.5)"
            strokeWidth="3"
            strokeDasharray="6 4"
            fill="none"
            style={{ animation: "flowDown 0.6s linear infinite" }}
          />
        )}
        {/* House → Grid  (export) / Grid → House (import) */}
        {grid > 0 && (
          <polyline
            points="290,270 340,310 390,350"
            stroke="rgba(96,165,250,0.5)"
            strokeWidth="3"
            strokeDasharray="6 4"
            fill="none"
            style={{ animation: "flowDown 0.6s linear infinite" }}
          />
        )}

        {/* ── Flow labels on lines ── */}
        {solar > 0 && (
          <text x="275" y="140" className="fill-yellow-300/80 text-[11px] font-medium">
            {fmt(solar, data.solar.unit)}
          </text>
        )}
        {battery > 0 && (
          <text x="126" y="308" className="fill-emerald-300/80 text-[11px] font-medium">
            {fmt(battery, data.battery.unit)}
          </text>
        )}
        {grid > 0 && (
          <text x="340" y="308" className="fill-blue-300/80 text-[11px] font-medium">
            {fmt(grid, data.grid.unit)}
          </text>
        )}

        {/* ════════════════  SOLAR PANEL (Isometric)  ════════════════ */}
        <g transform="translate(210, 10)">
          {/* Stand */}
          <path d="M45,85 L55,85 L55,95 L45,95 Z" fill="#475569" />
          <path d="M35,95 L65,95 L65,100 L35,100 Z" fill="#334155" rx="2" />

          {/* Thickness (Sides - 3D depth) */}
          <path d="M10,50 L50,75 L50,85 L10,60 Z" fill="#334155" />
          <path d="M50,75 L90,50 L90,60 L50,85 Z" fill="#0f172a" />

          {/* Panel Surface (Diamond face) */}
          <path d="M50,25 L90,50 L50,75 L10,50 Z" fill="#1e293b" stroke="#475569" strokeWidth="1" />

          {/* Inner Grid Details */}
          <path d="M30,37.5 L70,62.5" stroke="#334155" strokeWidth="1" />
          <path d="M70,37.5 L30,62.5" stroke="#334155" strokeWidth="1" />
          
          {/* Subtle reflection/sheen on top quadrant */}
          <path d="M50,25 L70,37.5 L50,50 L30,37.5 Z" fill="#334155" opacity="0.3" />
        </g>
        {/* Solar value */}
        <text x="260" y="28" textAnchor="middle" className="fill-white text-[18px] font-bold">
          {fmt(solar, data.solar.unit)}
        </text>

        {/* ════════════════  HOUSE  ════════════════ */}
        <g transform="translate(210, 170)">
          {/* Roof */}
          <polygon points="50,0 0,40 100,40" fill="#334155" stroke="#475569" strokeWidth="1.2" />
          {/* Walls */}
          <rect x="15" y="40" width="70" height="55" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1.2" />
          {/* Door */}
          <rect x="40" y="60" width="20" height="35" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
          {/* Window */}
          <rect x="22" y="50" width="14" height="12" rx="1.5" fill="#3b82f6" opacity="0.25" stroke="#60a5fa" strokeWidth="0.6" />
        </g>
        {/* Consumption value */}
        <text x="260" y="193" textAnchor="middle" className="fill-white text-[18px] font-bold">
          {fmt(consumption, data.consumption.unit)}
        </text>

        {/* ════════════════  BATTERY  ════════════════ */}
        <g transform="translate(55, 340)">
          {/* Stack body */}
          <rect x="10" y="10" width="60" height="70" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          {/* Segments */}
          {[0, 1, 2, 3].map((i) => {
            const segY = 65 - i * 16;
            const filled = batteryLevel >= (i + 1) * 25;
            return (
              <rect
                key={i}
                x="17" y={segY} width="46" height="12" rx="2"
                fill={filled ? "#3b82f6" : "#0f172a"}
                opacity={filled ? 0.7 : 0.3}
              />
            );
          })}
        </g>
        {/* Battery value */}
        <text x="95" y="435" textAnchor="middle" className="fill-white text-[18px] font-bold">
          {fmt(battery, data.battery.unit)}
        </text>
        {/* Battery % */}
        <text x="95" y="437" textAnchor="middle">
          <tspan x="95" dy="17" className="fill-blue-400 text-[12px] font-medium">
            ■ {batteryLevel}%
          </tspan>
        </text>

        {/* ════════════════  GRID / PYLON  ════════════════ */}
        <g transform="translate(365, 340)">
          {/* Lattice tower — simplified */}
          <polygon points="40,10 20,75 60,75" fill="none" stroke="#64748b" strokeWidth="1.8" />
          <line x1="27" y1="50" x2="53" y2="50" stroke="#64748b" strokeWidth="1.2" />
          <line x1="24" y1="62" x2="56" y2="62" stroke="#64748b" strokeWidth="1.2" />
          {/* Cross braces */}
          <line x1="30" y1="35" x2="50" y2="50" stroke="#475569" strokeWidth="0.8" />
          <line x1="50" y1="35" x2="30" y2="50" stroke="#475569" strokeWidth="0.8" />
          {/* Arms */}
          <line x1="15" y1="18" x2="40" y2="18" stroke="#64748b" strokeWidth="2" />
          <line x1="40" y1="18" x2="65" y2="18" stroke="#64748b" strokeWidth="2" />
          {/* Insulators */}
          <circle cx="15" cy="18" r="3" fill="#94a3b8" />
          <circle cx="65" cy="18" r="3" fill="#94a3b8" />
          {/* Wires */}
          <line x1="12" y1="21" x2="12" y2="30" stroke="#94a3b8" strokeWidth="0.7" />
          <line x1="68" y1="21" x2="68" y2="30" stroke="#94a3b8" strokeWidth="0.7" />
          {/* Base */}
          <rect x="25" y="75" width="30" height="5" rx="2" fill="#334155" />
        </g>
        {/* Grid value */}
        <text x="425" y="435" textAnchor="middle" className="fill-white text-[18px] font-bold">
          {fmt(grid, data.grid.unit)}
        </text>
      </svg>
    </div>
  );
}
