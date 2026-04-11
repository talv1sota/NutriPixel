"use client";

import { useEffect, useState } from "react";
import Window from "@/components/Window";
import { formatDate } from "@/lib/helpers";

interface DailyTotals {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  burned: number;
  net: number;
  hasLogs: boolean;
}

interface WindowStats {
  days: number;
  from: string;
  to: string;
  loggedCount: number;
  avg: { calories: number; protein: number; carbs: number; fat: number; burned: number; net: number } | null;
  sumNet: number;
  sumBurned: number;
  avgDeficitVsTDEE: number | null;
  weeklyDeficit: number | null;
  monthlyDeficit: number | null;
  projectedLbsPerWeek: number | null;
  projectedLbsPerMonth: number | null;
  onTrack: { daysOnCal: number; daysOverCal: number } | null;
  daysHitProtein: number | null;
  daily: DailyTotals[];
}

interface WeightStats {
  current: number | null;
  target: number | null;
  startWeight: number | null;
  lbsLost: number | null;
  lbsToGo: number | null;
  pctComplete: number | null;
  daysToGoal: number | null;
  projectedGoalDate: string | null;
  weeklyTrend: number | null;
}

interface StatsData {
  tdee: number | null;
  goal: {
    targetCalories: number | null;
    targetProtein: number | null;
    targetCarbs: number | null;
    targetFat: number | null;
    minProtein: number | null;
    targetWeight: number | null;
    targetDate: string | null;
    unit: string;
  };
  week: WindowStats;
  month: WindowStats;
  weight: WeightStats;
}

type Range = "week" | "month";

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [range, setRange] = useState<Range>("week");

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(setData);
  }, []);

  if (!data) {
    return (
      <div className="space-y-5 pt-3 max-w-lg mx-auto">
        <div className="pixel-label text-center" style={{ fontSize: "10px" }}>✧ Stats ✧</div>
        <div className="text-center vt-text">loading your numbers ~*</div>
      </div>
    );
  }

  const w = range === "week" ? data.week : data.month;
  const label = range === "week" ? "7-day" : "30-day";
  const unit = data.goal.unit;

  const maxCal = Math.max(1, ...w.daily.map(d => d.calories));
  const targetCal = data.goal.targetCalories;

  return (
    <div className="space-y-5 pt-3 max-w-2xl mx-auto">
      <div className="pixel-label text-center" style={{ fontSize: "10px" }}>✧ Stats ✧</div>

      {/* Range toggle */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setRange("week")}
          className={`btn-sm ${range === "week" ? "btn-pink" : "btn-blue"}`}
          style={{ minWidth: 90 }}
        >
          7 days
        </button>
        <button
          onClick={() => setRange("month")}
          className={`btn-sm ${range === "month" ? "btn-pink" : "btn-blue"}`}
          style={{ minWidth: 90 }}
        >
          30 days
        </button>
      </div>

      {/* Averages */}
      <Window title={`📊 ${label} Averages`}>
        {w.avg ? (
          <>
            <div className="grid grid-cols-4 gap-2">
              <div className="stat-box" style={{ background: "#edfff0" }}>
                <div className="text-lg font-bold" style={{ color: "#6bcb77" }}>{w.avg.calories}</div>
                <div className="text-[10px] font-semibold" style={{ color: "#9b80b8" }}>avg kcal</div>
              </div>
              <div className="stat-box" style={{ background: "#edf6ff" }}>
                <div className="text-lg font-bold" style={{ color: "#5bb8e8" }}>{w.avg.protein}</div>
                <div className="text-[10px] font-semibold" style={{ color: "#9b80b8" }}>protein</div>
              </div>
              <div className="stat-box" style={{ background: "#fffced" }}>
                <div className="text-lg font-bold" style={{ color: "#dda520" }}>{w.avg.carbs}</div>
                <div className="text-[10px] font-semibold" style={{ color: "#9b80b8" }}>carbs</div>
              </div>
              <div className="stat-box" style={{ background: "#fff0f5" }}>
                <div className="text-lg font-bold" style={{ color: "#e84d98" }}>{w.avg.fat}</div>
                <div className="text-[10px] font-semibold" style={{ color: "#9b80b8" }}>fat</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="stat-box">
                <div className="text-base font-bold" style={{ color: "#e84d98" }}>-{w.avg.burned}</div>
                <div className="text-[10px]" style={{ color: "#9b80b8" }}>avg burned</div>
              </div>
              <div className="stat-box">
                <div className="text-base font-bold" style={{ color: "#6bcb77" }}>{w.avg.net}</div>
                <div className="text-[10px]" style={{ color: "#9b80b8" }}>avg net</div>
              </div>
              <div className="stat-box">
                <div className="text-base font-bold" style={{ color: "#5bb8e8" }}>{w.loggedCount}/{w.days}</div>
                <div className="text-[10px]" style={{ color: "#9b80b8" }}>days logged</div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-sm" style={{ color: "#9b80b8" }}>no data in this window yet ~*</p>
        )}
      </Window>

      {/* Deficit & projection */}
      <Window title="🔥 Deficit & Projection">
        {data.tdee == null ? (
          <p className="text-xs" style={{ color: "#9b80b8" }}>
            set your height, age, and weight in Goals to unlock TDEE-based deficit math ✦
          </p>
        ) : w.avgDeficitVsTDEE == null ? (
          <p className="text-xs" style={{ color: "#9b80b8" }}>no logs in this window yet</p>
        ) : (
          <div className="space-y-3">
            <div className="text-xs" style={{ color: "#9b80b8" }}>
              TDEE: <strong style={{ color: "#5bb8e8" }}>{data.tdee} kcal/day</strong>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="stat-box" style={{ background: w.avgDeficitVsTDEE >= 0 ? "#edfff0" : "#fff0f0" }}>
                <div className="text-xl font-bold" style={{ color: w.avgDeficitVsTDEE >= 0 ? "#6bcb77" : "#e04040" }}>
                  {w.avgDeficitVsTDEE >= 0 ? "-" : "+"}{Math.abs(w.avgDeficitVsTDEE)}
                </div>
                <div className="text-[10px]" style={{ color: "#9b80b8" }}>avg daily deficit</div>
              </div>
              <div className="stat-box">
                <div className="text-xl font-bold" style={{ color: "#b76fd9" }}>
                  {w.weeklyDeficit! >= 0 ? "-" : "+"}{Math.abs(w.weeklyDeficit!)}
                </div>
                <div className="text-[10px]" style={{ color: "#9b80b8" }}>weekly deficit</div>
              </div>
              <div className="stat-box">
                <div className="text-xl font-bold" style={{ color: "#b76fd9" }}>
                  {w.monthlyDeficit! >= 0 ? "-" : "+"}{Math.abs(w.monthlyDeficit!)}
                </div>
                <div className="text-[10px]" style={{ color: "#9b80b8" }}>monthly deficit</div>
              </div>
              <div className="stat-box" style={{ background: "#fff0f5" }}>
                <div className="text-xl font-bold" style={{ color: "#e84d98" }}>
                  {(range === "month" ? w.projectedLbsPerMonth! : w.projectedLbsPerWeek!) >= 0 ? "" : "+"}
                  {range === "month" ? w.projectedLbsPerMonth : w.projectedLbsPerWeek} {unit}/{range === "month" ? "mo" : "wk"}
                </div>
                <div className="text-[10px]" style={{ color: "#9b80b8" }}>projected loss</div>
              </div>
            </div>
            <p className="text-[10px] text-center" style={{ color: "#b098c8" }}>
              ~{range === "month" ? w.projectedLbsPerWeek : w.projectedLbsPerMonth} {unit}/{range === "month" ? "week" : "month"} at this pace
            </p>
          </div>
        )}
      </Window>

      {/* On-track */}
      {w.onTrack && targetCal && w.loggedCount > 0 && (
        <Window title="🎯 On Track?">
          <div className="text-xs mb-2" style={{ color: "#9b80b8" }}>
            Target: <strong style={{ color: "#6bcb77" }}>{targetCal} kcal/day</strong> (±10%)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="stat-box" style={{ background: "#edfff0" }}>
              <div className="text-lg font-bold" style={{ color: "#6bcb77" }}>{w.onTrack.daysOnCal}</div>
              <div className="text-[10px]" style={{ color: "#9b80b8" }}>on target</div>
            </div>
            <div className="stat-box" style={{ background: "#fff0f0" }}>
              <div className="text-lg font-bold" style={{ color: "#e04040" }}>{w.onTrack.daysOverCal}</div>
              <div className="text-[10px]" style={{ color: "#9b80b8" }}>over</div>
            </div>
          </div>
          {w.daysHitProtein != null && data.goal.minProtein && (
            <div className="mt-3 text-xs text-center" style={{ color: "#9b80b8" }}>
              hit protein min ({data.goal.minProtein}g): <strong style={{ color: "#5bb8e8" }}>{w.daysHitProtein}/{w.loggedCount}</strong> days
            </div>
          )}
        </Window>
      )}

      {/* Weight progress */}
      <Window title="⚖️ Weight Progress">
        {data.weight.current == null ? (
          <p className="text-xs" style={{ color: "#9b80b8" }}>log your weight to see progress ~*</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="stat-box">
                <div className="text-base font-bold" style={{ color: "#5bb8e8" }}>{data.weight.current}</div>
                <div className="text-[10px]" style={{ color: "#9b80b8" }}>current</div>
              </div>
              <div className="stat-box">
                <div className="text-base font-bold" style={{ color: "#e84d98" }}>{data.weight.target ?? "—"}</div>
                <div className="text-[10px]" style={{ color: "#9b80b8" }}>goal</div>
              </div>
              <div className="stat-box">
                <div className="text-base font-bold" style={{ color: data.weight.lbsLost != null && data.weight.lbsLost > 0 ? "#6bcb77" : "#dda520" }}>
                  {data.weight.lbsLost != null ? (data.weight.lbsLost >= 0 ? "-" : "+") + Math.abs(data.weight.lbsLost) : "—"}
                </div>
                <div className="text-[10px]" style={{ color: "#9b80b8" }}>lost total</div>
              </div>
            </div>

            {data.weight.pctComplete != null && (
              <div>
                <div className="text-[10px] flex justify-between mb-1" style={{ color: "#9b80b8" }}>
                  <span>progress to goal</span>
                  <span>{data.weight.pctComplete}%</span>
                </div>
                <div style={{ height: 10, background: "#f0e5ff", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${data.weight.pctComplete}%`,
                    background: "linear-gradient(90deg, #e84d98, #b76fd9)",
                  }} />
                </div>
              </div>
            )}

            {data.weight.weeklyTrend != null && (
              <div className="text-xs text-center" style={{ color: "#9b80b8" }}>
                actual 14-day trend:{" "}
                <strong style={{ color: data.weight.weeklyTrend <= 0 ? "#6bcb77" : "#e04040" }}>
                  {data.weight.weeklyTrend > 0 ? "+" : ""}{data.weight.weeklyTrend} {unit}/wk
                </strong>
              </div>
            )}

            {data.weight.daysToGoal != null && data.weight.projectedGoalDate && (
              <div className="text-center text-xs p-2" style={{ background: "#fff0f5", borderRadius: 4 }}>
                at current deficit, goal in{" "}
                <strong style={{ color: "#e84d98" }}>{data.weight.daysToGoal} days</strong>
                <br />
                <span style={{ color: "#b098c8" }}>~{formatDate(data.weight.projectedGoalDate)}</span>
                {data.goal.targetDate && (
                  <div className="mt-1" style={{ color: "#9b80b8" }}>
                    deadline: {formatDate(data.goal.targetDate)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Window>

      {/* Daily bars */}
      <Window title={`📈 ${label} Daily Intake`}>
        <div className="space-y-1">
          {w.daily.map(d => {
            const pct = (d.calories / maxCal) * 100;
            const targetPct = targetCal ? (targetCal / maxCal) * 100 : null;
            return (
              <div key={d.date} className="flex items-center gap-2 text-[10px]">
                <span style={{ color: "#9b80b8", width: 56 }}>{formatDate(d.date).replace(/,.*/, "")}</span>
                <div className="flex-1 relative" style={{ height: 14, background: "#f0e5ff", borderRadius: 2 }}>
                  <div style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: d.hasLogs ? "linear-gradient(90deg, #b76fd9, #e84d98)" : "transparent",
                    borderRadius: 2,
                  }} />
                  {targetPct != null && (
                    <div style={{
                      position: "absolute",
                      top: -2,
                      bottom: -2,
                      left: `${targetPct}%`,
                      width: 2,
                      background: "#6bcb77",
                    }} />
                  )}
                </div>
                <span style={{ color: "#5bb8e8", width: 40, textAlign: "right", fontWeight: 700 }}>
                  {d.hasLogs ? Math.round(d.calories) : "—"}
                </span>
              </div>
            );
          })}
        </div>
        {targetCal && (
          <div className="text-[10px] mt-2 text-center" style={{ color: "#6bcb77" }}>
            — green line = {targetCal} kcal target —
          </div>
        )}
      </Window>
    </div>
  );
}
