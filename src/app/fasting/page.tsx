"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Window from "@/components/Window";
import {
  FASTING_PROTOCOLS,
  FASTING_STAGES,
  FASTING_MOTIVATION,
  currentStageIndex,
  formatDuration,
  formatDurationShort,
} from "@/lib/fasting";

interface FastingSession {
  id: number;
  startTime: string;
  endTime: string | null;
  goalHours: number;
}

// Date -> "YYYY-MM-DDTHH:MM" in local time, for <input type="datetime-local">.
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function FastingPage() {
  const [active, setActive] = useState<FastingSession | null>(null);
  const [history, setHistory] = useState<FastingSession[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [flash, setFlash] = useState("");
  // Pick one motivation line per page load and keep it for the whole session.
  const [motivationIdx] = useState(() => Math.floor(Math.random() * FASTING_MOTIVATION.length));

  // Start form
  const [goalKey, setGoalKey] = useState("16:8");
  const [customHours, setCustomHours] = useState("16");
  const [startAt, setStartAt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showFlash = (msg: string) => {
    setFlash(msg);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(""), 2500);
  };

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/fasting");
    const data = await res.json();
    setActive(data.active);
    setHistory(data.history || []);
    setLoaded(true);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Tick once a second while a fast is running.
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);

  const selectedHours = goalKey === "custom"
    ? Math.max(0.5, parseFloat(customHours) || 0)
    : FASTING_PROTOCOLS.find((p) => p.key === goalKey)?.goalHours ?? 16;

  const handleStart = async () => {
    const body: { goalHours: number; startTime?: string } = { goalHours: selectedHours };
    if (showAdvanced && startAt) body.startTime = new Date(startAt).toISOString();
    const res = await fetch("/api/fasting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setNow(Date.now());
      showFlash("Fast started — you've got this ✦");
      fetchData();
    } else {
      const e = await res.json();
      showFlash(e.error || "Could not start fast");
    }
  };

  const handleEnd = async () => {
    await fetch("/api/fasting", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ end: true }),
    });
    showFlash("Fast complete — well done ✧");
    fetchData();
  };

  const handleCancel = async () => {
    if (!active) return;
    await fetch(`/api/fasting?id=${active.id}`, { method: "DELETE" });
    showFlash("Fast cancelled");
    fetchData();
  };

  const handleDeleteHistory = async (id: number) => {
    await fetch(`/api/fasting?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  // ---- Active fast math ----
  const startMs = active ? new Date(active.startTime).getTime() : 0;
  const elapsedMs = active ? now - startMs : 0;
  const elapsedHours = elapsedMs / 3_600_000;
  const goalMs = active ? active.goalHours * 3_600_000 : 0;
  const goalEndMs = startMs + goalMs;
  const pct = active ? Math.min(100, (elapsedMs / goalMs) * 100) : 0;
  const reachedGoal = active && elapsedMs >= goalMs;
  const remainingMs = goalEndMs - now;

  const stageIdx = currentStageIndex(elapsedHours);
  const stage = FASTING_STAGES[stageIdx];
  const nextStage = FASTING_STAGES[stageIdx + 1] ?? null;
  const msToNextStage = nextStage ? (nextStage.hour * 3_600_000) - elapsedMs : 0;

  const motivation = FASTING_MOTIVATION[motivationIdx];

  // ---- Ring geometry ----
  const size = 220;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const ringColor = reachedGoal ? "#6bcb77" : stage.color;

  // ---- Stats from history ----
  const completed = history.length;
  const durations = history.map((h) => new Date(h.endTime!).getTime() - new Date(h.startTime).getTime());
  const longest = durations.length ? Math.max(...durations) : 0;
  const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const goalsHit = history.filter((h) => {
    const dur = new Date(h.endTime!).getTime() - new Date(h.startTime).getTime();
    return dur >= h.goalHours * 3_600_000;
  }).length;

  // Streak: consecutive days (ending today or yesterday) with a completed fast.
  const fastDays = new Set(
    history.map((h) => {
      const d = new Date(h.endTime!);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );
  let streak = 0;
  {
    const cursor = new Date();
    const todayKey = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
    if (!fastDays.has(todayKey)) cursor.setDate(cursor.getDate() - 1); // allow streak to count up to yesterday
    while (fastDays.has(`${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  const fmtClock = (ms: number) => new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  // For multi-day fasts a bare time ("10:00") is ambiguous — show the day too
  // when it isn't today.
  const isSameDayAsNow = (ms: number) => new Date(ms).toDateString() === new Date(now).toDateString();
  const fmtDateShort = (ms: number) => new Date(ms).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const fmtDay = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="space-y-5 pt-3">
      <div className="pixel-label text-center" style={{ fontSize: "10px" }}>✧ Fasting ✧</div>

      {flash && (
        <div className="window slidein" style={{ borderColor: "#c77dff" }}>
          <div className="window-body text-center font-bold" style={{ color: "#7b2cbf", padding: "10px" }}>
            ✦ {flash} ✦
          </div>
        </div>
      )}

      {!loaded ? (
        <Window title="✧ Fasting ✧">
          <p className="vt-text text-center py-3">loading ~</p>
        </Window>
      ) : active ? (
        <>
          {/* ===== Timer ring ===== */}
          <Window title={reachedGoal ? "🎉 Goal Reached!" : "⏳ Fast In Progress"}>
            <div className="flex flex-col items-center">
              <div style={{ position: "relative", width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ede0f5" strokeWidth={stroke} />
                  <circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke={ringColor} strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ}`}
                    style={{ transition: "stroke-dasharray 0.9s linear, stroke 0.4s ease", filter: `drop-shadow(0 0 6px ${ringColor}80)` }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 30 }}>{reachedGoal ? "🌟" : stage.emoji}</div>
                  <div className="font-bold" style={{ fontSize: 22, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                    {formatDuration(elapsedMs)}
                  </div>
                  <div className="pixel-label" style={{ fontSize: "7px", marginTop: 2 }}>
                    {pct.toFixed(1)}% of {active.goalHours}h
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 w-full mt-4">
                <div className="stat-box">
                  <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>Started</div>
                  <div className="font-bold" style={{ fontSize: 15, color: "var(--accent-purple)" }}>{fmtClock(startMs)}</div>
                  {!isSameDayAsNow(startMs) && <div className="text-[9px] mt-0.5" style={{ color: "var(--ink-faint)" }}>{fmtDateShort(startMs)}</div>}
                </div>
                <div className="stat-box">
                  <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>Goal At</div>
                  <div className="font-bold" style={{ fontSize: 15, color: "#5bb8e8" }}>{fmtClock(goalEndMs)}</div>
                  {!isSameDayAsNow(goalEndMs) && <div className="text-[9px] mt-0.5" style={{ color: "var(--ink-faint)" }}>{fmtDateShort(goalEndMs)}</div>}
                </div>
                <div className="stat-box">
                  <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>{reachedGoal ? "Over Goal" : "Remaining"}</div>
                  <div className="font-bold" style={{ fontSize: 15, color: reachedGoal ? "#6bcb77" : "var(--accent-pink)" }}>
                    {reachedGoal ? `+${formatDurationShort(-remainingMs)}` : formatDurationShort(remainingMs)}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 w-full mt-4">
                <button onClick={handleEnd} className="btn-pink flex-1">
                  {reachedGoal ? "✓ Complete Fast" : "End Fast"}
                </button>
                <button onClick={handleCancel} className="btn-blue btn-sm">Cancel</button>
              </div>
            </div>
          </Window>

          {/* ===== What your body is doing ===== */}
          <Window title="✧ What Your Body Is Doing ✧">
            <div
              className="slidein"
              style={{
                background: `${stage.color}14`,
                border: `2px solid ${stage.color}`,
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 24 }}>{stage.emoji}</span>
                <div>
                  <div className="font-bold" style={{ color: stage.color, fontSize: 16 }}>{stage.title}</div>
                  <div className="pixel-label" style={{ fontSize: "7px" }}>
                    at ~{stage.hour}h{stageIdx > 0 ? "+" : ""} into your fast
                  </div>
                </div>
              </div>
              <p className="text-sm" style={{ color: "#5a4574", lineHeight: 1.5 }}>{stage.body}</p>
            </div>

            {nextStage && (
              <div className="text-center mt-3 text-xs" style={{ color: "var(--ink-muted)" }}>
                Next: <strong style={{ color: nextStage.color }}>{nextStage.emoji} {nextStage.title}</strong>{" "}
                in <strong style={{ color: "var(--ink-soft)", fontVariantNumeric: "tabular-nums" }}>{formatDuration(msToNextStage)}</strong>
              </div>
            )}

            <div className="text-center mt-3 text-sm italic slidein" style={{ color: "var(--ink-soft)", background: "#f5eeff", padding: 10, borderRadius: 8, border: "1px dashed #d4b8e8" }}>
              {motivation}
            </div>
          </Window>

          {/* ===== Milestone timeline ===== */}
          <Window title="🗺️ Fasting Timeline">
            <div className="space-y-1">
              {FASTING_STAGES.map((s, i) => {
                const done = i < stageIdx;
                const isCurrent = i === stageIdx;
                return (
                  <div
                    key={s.hour}
                    className="flex items-start gap-3"
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: isCurrent ? `${s.color}18` : "transparent",
                      border: isCurrent ? `1px solid ${s.color}` : "1px solid transparent",
                      opacity: i > stageIdx ? 0.55 : 1,
                    }}
                  >
                    <div style={{ minWidth: 34, textAlign: "center" }}>
                      <div style={{ fontSize: 18, filter: done ? "grayscale(0.3)" : "none" }}>
                        {done ? "✓" : s.emoji}
                      </div>
                      <div className="pixel-label" style={{ fontSize: "6px", color: s.color }}>{s.hour}h</div>
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <div className="font-bold text-sm" style={{ color: isCurrent ? s.color : "#6a5589" }}>
                        {s.title}{isCurrent && <span className="badge ml-2" style={{ color: s.color }}>now</span>}
                      </div>
                      {done && <span className="text-xs" style={{ color: "var(--ink-faint)" }}>done</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Window>
        </>
      ) : (
        /* ===== Start a fast ===== */
        <Window title="🚀 Start a Fast">
          <div className="pixel-label mb-2" style={{ fontSize: "7px" }}>Choose a protocol</div>
          <div className="grid grid-cols-2 gap-2">
            {FASTING_PROTOCOLS.map((p) => {
              const sel = goalKey === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => setGoalKey(p.key)}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: sel ? "2px solid #e84d98" : "2px solid #d4b8e8",
                    background: sel ? "rgba(232,77,152,0.08)" : "white",
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  <div className="font-bold" style={{ fontSize: 15, color: sel ? "var(--accent-pink)" : "#6a5589" }}>
                    {p.label} <span className="text-xs font-semibold" style={{ color: "var(--ink-muted)" }}>· {p.name}</span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--ink-muted)", lineHeight: 1.3 }}>{p.blurb}</div>
                </button>
              );
            })}
            <button
              onClick={() => setGoalKey("custom")}
              style={{
                textAlign: "left", padding: "10px 12px", borderRadius: 8,
                border: goalKey === "custom" ? "2px solid #e84d98" : "2px solid #d4b8e8",
                background: goalKey === "custom" ? "rgba(232,77,152,0.08)" : "white",
                cursor: "pointer", transition: "all 0.12s",
              }}
            >
              <div className="font-bold" style={{ fontSize: 15, color: goalKey === "custom" ? "var(--accent-pink)" : "#6a5589" }}>Custom</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>Set your own length</div>
            </button>
          </div>

          {goalKey === "custom" && (
            <div className="mt-3">
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Goal length (hours)</label>
              <input
                type="number" value={customHours} min={1} max={336} step={0.5}
                onChange={(e) => setCustomHours(e.target.value)} className="input"
                placeholder="e.g. 48"
              />
            </div>
          )}

          <div className="mt-3">
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="text-xs font-bold"
              style={{ color: "var(--accent-purple)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              {showAdvanced ? "▾ " : "▸ "}Started earlier? Backdate it
            </button>
            {showAdvanced && (
              <div className="mt-2 slidein">
                <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>I last ate at</label>
                <input
                  type="datetime-local"
                  value={startAt || toLocalInput(new Date())}
                  max={toLocalInput(new Date())}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="input"
                />
              </div>
            )}
          </div>

          <div className="text-center mt-4 mb-3 text-sm" style={{ color: "var(--ink-soft)" }}>
            Target: <strong style={{ color: "var(--accent-pink)" }}>{selectedHours}h</strong> fast
          </div>
          <button onClick={handleStart} className="btn-pink w-full">Begin Fast ✦</button>
        </Window>
      )}

      {/* ===== Stats ===== */}
      {history.length > 0 && (
        <Window title="📊 Fasting Stats">
          <div className="grid grid-cols-3 gap-2">
            <div className="stat-box">
              <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>Streak</div>
              <div className="text-lg font-bold" style={{ color: "var(--accent-pink)" }}>{streak}</div>
              <div className="text-[10px]" style={{ color: "var(--ink-faint)" }}>day{streak === 1 ? "" : "s"}</div>
            </div>
            <div className="stat-box">
              <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>Completed</div>
              <div className="text-lg font-bold" style={{ color: "var(--accent-purple)" }}>{completed}</div>
              <div className="text-[10px]" style={{ color: "var(--ink-faint)" }}>fasts</div>
            </div>
            <div className="stat-box">
              <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>Goals Hit</div>
              <div className="text-lg font-bold" style={{ color: "#6bcb77" }}>{goalsHit}</div>
              <div className="text-[10px]" style={{ color: "var(--ink-faint)" }}>on target</div>
            </div>
            <div className="stat-box">
              <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>Longest</div>
              <div className="text-base font-bold" style={{ color: "#5bb8e8" }}>{formatDurationShort(longest)}</div>
            </div>
            <div className="stat-box">
              <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>Average</div>
              <div className="text-base font-bold" style={{ color: "#ffc145" }}>{formatDurationShort(avg)}</div>
            </div>
            <div className="stat-box">
              <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>Total Time</div>
              <div className="text-base font-bold" style={{ color: "#c77dff" }}>
                {formatDurationShort(durations.reduce((a, b) => a + b, 0))}
              </div>
            </div>
          </div>
        </Window>
      )}

      {/* ===== History ===== */}
      {history.length > 0 && (
        <Window title="📋 History">
          <div className="max-h-72 overflow-y-auto">
            {history.map((h) => {
              const dur = new Date(h.endTime!).getTime() - new Date(h.startTime).getTime();
              const hit = dur >= h.goalHours * 3_600_000;
              return (
                <div key={h.id} className="list-row">
                  <div className="flex items-center gap-2">
                    <span style={{ color: hit ? "#6bcb77" : "#c0a0d8" }}>{hit ? "✓" : "·"}</span>
                    <span style={{ color: "var(--ink-muted)" }}>{fmtDay(h.startTime)}</span>
                    <span className="badge">{h.goalHours}h goal</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold" style={{ color: hit ? "#6bcb77" : "var(--ink-soft)" }}>{formatDurationShort(dur)}</span>
                    <button onClick={() => handleDeleteHistory(h.id)} className="delete-btn">×</button>
                  </div>
                </div>
              );
            })}
          </div>
        </Window>
      )}
    </div>
  );
}
