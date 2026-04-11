"use client";

interface MacroRingProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
  trackColor?: string;
  size?: number;
  active?: boolean;
  hasGoal?: boolean;
}

export default function MacroRing({ value, max, label, unit, color, trackColor = "#ede0f5", size = 90, active = false, hasGoal = true }: MacroRingProps) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = hasGoal ? Math.min(value / (max || 1), 1) : (value > 0 ? 1 : 0);
  const offset = circumference * (1 - pct);
  const over = hasGoal && value > max;

  return (
    <div className="flex flex-col items-center gap-1" style={{
      transform: active ? "scale(1.08)" : "scale(1)",
      transition: "transform 0.15s ease",
    }}>
      <div className="relative" style={{
        width: size, height: size,
        filter: active ? `drop-shadow(0 0 8px ${color}60)` : "none",
        transition: "filter 0.15s ease",
      }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={8} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke={over ? "#ff4444" : color} strokeWidth={active ? 10 : 8}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease, stroke-width 0.15s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold text-sm" style={{ color: over ? "#cc2222" : "#4a2d6b" }}>
            {Math.round(value)}
          </span>
          <span className="text-[9px]" style={{ color: "#9b80b8" }}>{unit}</span>
        </div>
      </div>
      <span className="text-xs font-bold" style={{ color: active ? color : "#5a3d7a", transition: "color 0.15s" }}>{label}</span>
      {hasGoal ? (
        <span className="text-[10px]" style={{ color: "#b098c8" }}>/ {max}</span>
      ) : (
        <span className="text-[10px] italic" style={{ color: "#d4b8e8" }}>no goal</span>
      )}
    </div>
  );
}
