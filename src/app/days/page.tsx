"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Window from "@/components/Window";
import { todayStr, calcBMR, calcTDEE, toLbs, toIn } from "@/lib/helpers";
import { PoolItem, Chosen, MacroT, MEALS, macrosOf, generate } from "@/lib/daySuggest";

interface Goal {
  height: number | null; heightUnit: string; gender: string; age: number | null;
  activityLevel: string; unit: string; targetCalories: number | null;
}

const MEAL_ICON: Record<string, string> = { breakfast: "🌅", lunch: "🌸", dinner: "🌙", snack: "🍬", drinks: "🥤", dessert: "🧁" };
const PRESETS = [600, 800, 1000, 1200, 1500, 1800];

export default function DaysPage() {
  const [pool, setPool] = useState<PoolItem[]>([]);
  const [mealDist, setMealDist] = useState<Record<string, number>>({});
  const [recentDays, setRecentDays] = useState<{ date: string; calories: number }[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [target, setTarget] = useState(1200);
  const [useMacros, setUseMacros] = useState(false);
  const [pT, setPT] = useState(""); const [cT, setCT] = useState(""); const [fT, setFT] = useState("");

  const [day, setDay] = useState<Chosen[] | null>(null);
  const [logDate, setLogDate] = useState(todayStr());
  const [flash, setFlash] = useState("");
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showFlash = (m: string) => {
    setFlash(m);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(""), 2500);
  };

  const load = useCallback(async () => {
    const [s, g, w] = await Promise.all([fetch("/api/day-suggest"), fetch("/api/goals"), fetch("/api/weight")]);
    const sd = await s.json();
    setPool(sd.pool || []); setMealDist(sd.mealDist || {}); setRecentDays(sd.recentDays || []);
    setGoal(await g.json());
    const weights = await w.json();
    if (Array.isArray(weights) && weights.length) setLatestWeight(weights[weights.length - 1].weight);
    setLoaded(true);
  }, []);
  useEffect(() => { load(); }, [load]);

  const macroT: MacroT | null = useMacros
    ? { p: parseFloat(pT) || undefined, c: parseFloat(cT) || undefined, f: parseFloat(fT) || undefined }
    : null;

  const doGenerate = () => {
    const d = generate(pool, mealDist, target, macroT);
    if (!d) { showFlash("Not enough history yet — log a few foods first"); return; }
    setDay(d);
  };

  const totals = (day || []).reduce((a, ci) => {
    const m = macrosOf(ci.item, ci.amount);
    return { cal: a.cal + m.cal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f };
  }, { cal: 0, p: 0, c: 0, f: 0 });

  const logDay = async () => {
    if (!day) return;
    const items = day.map((ci) => ({
      foodId: ci.item.foodId, amount: ci.amount, meal: ci.item.meal,
      name: ci.item.name, brand: ci.item.brand,
      calories: ci.item.per100.calories, protein: ci.item.per100.protein, carbs: ci.item.per100.carbs,
      fat: ci.item.per100.fat, fiber: ci.item.per100.fiber, sugar: ci.item.per100.sugar,
      serving: ci.item.amount, unit: ci.item.unit,
    }));
    const res = await fetch("/api/day-suggest/log", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: logDate, items }),
    });
    if (res.ok) { const r = await res.json(); showFlash(`Logged ${r.count} items to ${logDate} ✦`); load(); }
    else showFlash("Could not log day");
  };

  // Weekly context
  const weekAvg = recentDays.length
    ? Math.round(recentDays.reduce((s, d) => s + d.calories, 0) / recentDays.length) : null;

  const canTdee = latestWeight && goal?.height && goal?.age;
  const tdee = canTdee
    ? calcTDEE(calcBMR(toLbs(latestWeight!, goal!.unit), toIn(goal!.height!, goal!.heightUnit), goal!.age!, goal!.gender), goal!.activityLevel)
    : null;

  const fmtAmount = (ci: Chosen) =>
    ci.item.unit === "serving" ? `${(ci.amount / 100).toFixed(1)} srv` : `${Math.round(ci.amount)}${ci.item.unit}`;

  return (
    <div className="space-y-5 pt-3">
      <div className="pixel-label text-center" style={{ fontSize: "10px" }}>✧ Suggested Days ✧</div>

      {flash && (
        <div className="window slidein" style={{ borderColor: "#6bcb77" }}>
          <div className="window-body text-center font-bold" style={{ color: "#2d8a4e", padding: 10 }}>✦ {flash} ✦</div>
        </div>
      )}

      {/* Weekly context */}
      {(weekAvg !== null || tdee) && (
        <div className="grid grid-cols-3 gap-2">
          <div className="stat-box">
            <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>Week Avg</div>
            <div className="text-lg font-bold" style={{ color: "var(--accent-purple)" }}>{weekAvg ?? "—"}</div>
            <div className="text-[10px]" style={{ color: "var(--ink-faint)" }}>kcal/day</div>
          </div>
          <div className="stat-box">
            <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>Maintain</div>
            <div className="text-lg font-bold" style={{ color: "#5bb8e8" }}>{tdee ?? "—"}</div>
            <div className="text-[10px]" style={{ color: "var(--ink-faint)" }}>TDEE</div>
          </div>
          <div className="stat-box">
            <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>Lose 1 lb/wk</div>
            <div className="text-lg font-bold" style={{ color: "#e84d98" }}>{tdee ? tdee - 500 : "—"}</div>
            <div className="text-[10px]" style={{ color: "var(--ink-faint)" }}>kcal/day</div>
          </div>
        </div>
      )}

      {/* Target picker */}
      <Window title="🎯 Build a Day">
        <div className="pixel-label mb-2" style={{ fontSize: "7px" }}>Calorie target</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESETS.map((p) => (
            <button key={p} onClick={() => setTarget(p)} className={`btn-sm ${target === p ? "btn-pink" : "btn-blue"}`}>{p}</button>
          ))}
          <input
            type="number" value={target} min={300} max={5000} step={50}
            onChange={(e) => setTarget(Math.max(0, parseInt(e.target.value) || 0))}
            className="input" style={{ width: 90 }}
          />
        </div>

        <button onClick={() => setUseMacros((v) => !v)} className="text-xs font-bold"
          style={{ color: "var(--accent-purple)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          {useMacros ? "▾ " : "▸ "}Optional macro targets
        </button>
        {useMacros && (
          <div className="grid grid-cols-3 gap-2 mt-2 slidein">
            <div>
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Protein g</label>
              <input type="number" value={pT} onChange={(e) => setPT(e.target.value)} className="input" placeholder="—" />
            </div>
            <div>
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Carbs g</label>
              <input type="number" value={cT} onChange={(e) => setCT(e.target.value)} className="input" placeholder="—" />
            </div>
            <div>
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Fat g</label>
              <input type="number" value={fT} onChange={(e) => setFT(e.target.value)} className="input" placeholder="—" />
            </div>
          </div>
        )}

        <button onClick={doGenerate} className="btn-pink w-full mt-4" disabled={!loaded}>
          {day ? "↻ Regenerate" : "Generate Day ✦"}
        </button>
        {!loaded && <p className="vt-text text-center mt-2">loading your foods ~</p>}
        {loaded && pool.length === 0 && (
          <p className="text-xs text-center mt-2" style={{ color: "var(--ink-muted)" }}>
            No food history yet — log some meals first and they&apos;ll become the building blocks here.
          </p>
        )}
      </Window>

      {/* Generated day */}
      {day && (
        <Window title={`✦ ${Math.round(totals.cal)} kcal Day`}>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {([["Cal", Math.round(totals.cal), "#6bcb77", target], ["P", Math.round(totals.p), "#5bb8e8", macroT?.p], ["C", Math.round(totals.c), "#ffc145", macroT?.c], ["F", Math.round(totals.f), "#e84d98", macroT?.f]] as [string, number, string, number | undefined][]).map(([lab, val, col, tgt]) => (
              <div key={lab} className="stat-box">
                <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>{lab}</div>
                <div className="text-base font-bold" style={{ color: col }}>{val}</div>
                {tgt ? <div className="text-[9px]" style={{ color: "var(--ink-faint)" }}>/ {tgt}</div> : null}
              </div>
            ))}
          </div>

          {MEALS.filter((m) => day.some((ci) => ci.item.meal === m)).map((m) => {
            const rows = day.filter((ci) => ci.item.meal === m);
            const mc = Math.round(rows.reduce((s, ci) => s + macrosOf(ci.item, ci.amount).cal, 0));
            return (
              <div key={m} style={{ marginBottom: 10 }}>
                {/* Meal header bar */}
                <div className="flex items-center justify-between" style={{ background: "var(--track)", borderRadius: 6, padding: "5px 10px", marginBottom: 2 }}>
                  <span className="pixel-label" style={{ fontSize: "8px" }}>{MEAL_ICON[m]} {m}</span>
                  <span className="text-xs font-bold" style={{ color: "var(--ink-muted)" }}>{mc} kcal</span>
                </div>
                {/* Items: name · amount · calories */}
                {rows.map((ci, i) => (
                  <div key={i} className="flex items-center gap-2" style={{ padding: "5px 10px", borderBottom: "1px dashed var(--win-border-soft)" }}>
                    <span className="text-sm font-semibold flex-1" style={{ minWidth: 0 }}>{ci.item.name}</span>
                    <span className="text-xs" style={{ color: "var(--ink-faint)", whiteSpace: "nowrap" }}>{fmtAmount(ci)}</span>
                    <span className="text-xs font-bold" style={{ color: "#6bcb77", minWidth: 40, textAlign: "right" }}>{Math.round(macrosOf(ci.item, ci.amount).cal)}</span>
                  </div>
                ))}
              </div>
            );
          })}

          <div className="flex flex-col sm:flex-row gap-2 sm:items-end mt-4" style={{ borderTop: "1px dashed var(--win-border-soft)", paddingTop: 12 }}>
            <div className="flex-1 min-w-0">
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Log to date</label>
              <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="input" />
            </div>
            <button onClick={doGenerate} className="btn-blue">↻ Regenerate</button>
            <button onClick={logDay} className="btn-pink">Log Whole Day ✦</button>
          </div>
        </Window>
      )}
    </div>
  );
}
