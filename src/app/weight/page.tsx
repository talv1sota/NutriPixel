"use client";

import { useEffect, useState, useCallback } from "react";
import Window from "@/components/Window";
import { todayStr, formatDate } from "@/lib/helpers";

interface WeightEntry { id: number; weight: number; date: string; }
interface Goal { targetWeight: number | null; unit: string; }

export default function WeightPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(todayStr());
  const [flash, setFlash] = useState("");

  const fetchData = useCallback(async () => {
    const [w, g] = await Promise.all([fetch("/api/weight"), fetch("/api/goals")]);
    setEntries(await w.json());
    setGoal(await g.json());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLog = async () => {
    if (!weight) return;
    await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight: parseFloat(weight), date }),
    });
    setWeight("");
    setFlash("Weight logged!");
    fetchData();
    setTimeout(() => setFlash(""), 2000);
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/weight?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const unit = goal?.unit || "lbs";
  const current = entries.length > 0 ? entries[entries.length - 1].weight : null;
  const target = goal?.targetWeight;
  const diff = current && target ? current - target : null;

  // Chart
  const last30 = entries.slice(-30);
  const ws = last30.map(e => e.weight);
  const minW = ws.length ? Math.min(...ws) - 2 : 0;
  const maxW = ws.length ? Math.max(...ws) + 2 : 1;
  const cW = 560, cH = 180;
  const pts = last30.map((e, i) => ({
    x: (i / Math.max(last30.length - 1, 1)) * cW,
    y: cH - ((e.weight - minW) / (maxW - minW)) * cH,
    e,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = line + ` L ${cW} ${cH} L 0 ${cH} Z`;

  return (
    <div className="space-y-5 pt-3">
      <div className="pixel-label text-center" style={{ fontSize: "10px" }}>✧ Weight Tracker ✧</div>

      {flash && (
        <div className="window slidein" style={{ borderColor: "#6bcb77" }}>
          <div className="window-body text-center font-bold" style={{ color: "#2d8a4e", padding: "10px" }}>
            ✦ {flash} ✦
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-box">
          <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>Current</div>
          <div className="text-xl font-bold" style={{ color: "#5bb8e8" }}>{current ?? "—"}</div>
          <div className="text-[10px]" style={{ color: "#b098c8" }}>{unit}</div>
        </div>
        <div className="stat-box">
          <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>Goal</div>
          <div className="text-xl font-bold" style={{ color: "#e84d98" }}>{target ?? "—"}</div>
          <div className="text-[10px]" style={{ color: "#b098c8" }}>{unit}</div>
        </div>
        <div className="stat-box">
          <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>To Go</div>
          <div className="text-xl font-bold" style={{ color: diff && diff > 0 ? "#dda520" : "#6bcb77" }}>
            {diff !== null ? `${diff > 0 ? "-" : "+"}${Math.abs(diff).toFixed(1)}` : "—"}
          </div>
          <div className="text-[10px]" style={{ color: "#b098c8" }}>{unit}</div>
        </div>
      </div>

      {/* Log */}
      <Window title="📝 Log Weight">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1 min-w-0">
            <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Weight ({unit})</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
              placeholder="Enter weight" className="input" step="0.1" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
          </div>
          <button onClick={handleLog} className="btn-pink w-full sm:w-auto">Log</button>
        </div>
      </Window>

      {/* Chart */}
      {pts.length > 1 && (
        <Window title="📈 Progress Chart">
          <div className="overflow-x-auto">
            <svg viewBox={`-25 -10 ${cW + 40} ${cH + 30}`} className="w-full" style={{ minWidth: 280 }}>
              {[0, 0.25, 0.5, 0.75, 1].map(p => {
                const y = cH - p * cH;
                return (
                  <g key={p}>
                    <line x1={0} y1={y} x2={cW} y2={y} stroke="#ede0f5" strokeWidth={1} />
                    <text x={-5} y={y + 4} textAnchor="end" fill="#b098c8" fontSize={10} fontFamily="Quicksand">
                      {(minW + p * (maxW - minW)).toFixed(0)}
                    </text>
                  </g>
                );
              })}
              {target && (
                <line x1={0} y1={cH - ((target - minW) / (maxW - minW)) * cH}
                  x2={cW} y2={cH - ((target - minW) / (maxW - minW)) * cH}
                  stroke="#e84d98" strokeDasharray="6 4" strokeWidth={1.5} />
              )}
              <path d={area} fill="url(#wg)" opacity={0.4} />
              <path d={line} fill="none" stroke="#5bb8e8" strokeWidth={3} strokeLinejoin="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={4.5} fill="white" stroke="#5bb8e8" strokeWidth={2.5}>
                  <title>{formatDate(p.e.date)}: {p.e.weight} {unit}</title>
                </circle>
              ))}
              <defs>
                <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5bb8e8" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#5bb8e8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </Window>
      )}

      {/* History */}
      <Window title="📋 History">
        {entries.length === 0 ? (
          <p className="vt-text text-center py-3">no entries yet ~</p>
        ) : (
          <div className="max-h-60 overflow-y-auto">
            {[...entries].reverse().map(entry => (
              <div key={entry.id} className="list-row">
                <span style={{ color: "#9b80b8" }}>{formatDate(entry.date)}</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{entry.weight} {unit}</span>
                  <button onClick={() => handleDelete(entry.id)} className="delete-btn">×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Window>
    </div>
  );
}
