"use client";

interface ProgressBarProps {
  value: number;
  max: number | null;
  label: string;
  type: "calories" | "protein" | "carbs" | "fat";
}

export default function ProgressBar({ value, max, label, type }: ProgressBarProps) {
  const hasGoal = max !== null && max !== undefined;
  const pct = hasGoal ? Math.min((value / (max || 1)) * 100, 100) : (value > 0 ? 100 : 0);
  const over = hasGoal && value > (max || 0);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-bold">
        <span style={{ color: "#6a4d8a" }}>{label}</span>
        <span style={{ color: over ? "#ff4444" : "#4a2d6b" }}>
          {Math.round(value)}{hasGoal ? ` / ${max}` : <span className="italic" style={{ color: "#b098c8", fontWeight: "normal" }}> g · no goal</span>}
        </span>
      </div>
      <div className="bar-track">
        <div
          className={`bar-fill ${type} ${over ? "over" : ""}`}
          style={{ width: `${pct}%`, opacity: hasGoal ? 1 : 0.5 }}
        />
      </div>
    </div>
  );
}
