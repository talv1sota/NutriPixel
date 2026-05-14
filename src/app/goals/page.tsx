"use client";

import { useEffect, useState } from "react";
import Window from "@/components/Window";
import { activityLabels, calcBMR, calcTDEE } from "@/lib/helpers";

interface Goal {
  id: number; goalType: string;
  targetWeight: number | null; targetDate: string | null;
  targetCalories: number | null;
  targetProtein: number | null; minProtein: number | null; proteinMode: string;
  targetCarbs: number | null; minCarbs: number | null; carbsMode: string;
  targetFat: number | null; minFat: number | null; fatMode: string;
  unit: string; height: number | null; heightUnit: string;
  gender: string; age: number | null; activityLevel: string;
}

export default function GoalsPage() {
  const [form, setForm] = useState({
    currentWeight: "",
    goalType: "lose",
    targetWeight: "", targetDate: "",
    targetCalories: "",
    targetProtein: "", minProtein: "", proteinMode: "target",
    targetCarbs: "", minCarbs: "", carbsMode: "target",
    targetFat: "", minFat: "", fatMode: "target",
    unit: "lbs", height: "", heightUnit: "in",
    gender: "female", age: "", activityLevel: "sedentary",
  });
  const [saved, setSaved] = useState(false);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/weight").then(r => r.json()).then((ws: { weight: number }[]) => {
      if (ws.length > 0) {
        setLatestWeight(ws[ws.length - 1].weight);
        setForm(f => ({ ...f, currentWeight: f.currentWeight || String(ws[ws.length - 1].weight) }));
      }
    });
    fetch("/api/goals").then(r => r.json()).then((g: Goal) => {
      setForm(f => ({
        ...f,
        goalType: g.goalType || "lose",
        targetWeight: g.targetWeight?.toString() || "",
        targetDate: g.targetDate || "",
        targetCalories: g.targetCalories?.toString() || "",
        targetProtein: g.targetProtein?.toString() || "",
        minProtein: g.minProtein?.toString() || "",
        proteinMode: g.proteinMode || "minimum",
        targetCarbs: g.targetCarbs?.toString() || "",
        minCarbs: g.minCarbs?.toString() || "",
        carbsMode: g.carbsMode || "range",
        targetFat: g.targetFat?.toString() || "",
        minFat: g.minFat?.toString() || "",
        fatMode: g.fatMode || "range",
        unit: g.unit || "lbs",
        height: g.height?.toString() || "",
        heightUnit: g.heightUnit || "in",
        gender: g.gender || "female",
        age: g.age?.toString() || "",
        activityLevel: g.activityLevel || "sedentary",
      }));
    });
  }, []);

  const handleSave = async () => {
    const toNum = (v: string) => v ? parseFloat(v) : null;
    const toInt = (v: string) => v ? parseInt(v) : null;
    await fetch("/api/goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goalType: form.goalType,
        targetWeight: form.goalType === "maintain"
          ? (form.currentWeight ? parseFloat(form.currentWeight) : null)
          : toNum(form.targetWeight),
        targetDate: form.goalType === "maintain" ? null : (form.targetDate || null),
        targetCalories: toNum(form.targetCalories),
        targetProtein: toNum(form.targetProtein),
        minProtein: toNum(form.minProtein),
        proteinMode: form.proteinMode,
        targetCarbs: toNum(form.targetCarbs),
        minCarbs: toNum(form.minCarbs),
        carbsMode: form.carbsMode,
        targetFat: toNum(form.targetFat),
        minFat: toNum(form.minFat),
        fatMode: form.fatMode,
        unit: form.unit,
        height: toNum(form.height),
        heightUnit: form.heightUnit,
        gender: form.gender,
        age: toInt(form.age),
        activityLevel: form.activityLevel,
      }),
    });
    // If current weight changed, log it as a weight entry for today
    if (form.currentWeight) {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight: parseFloat(form.currentWeight), date: dateStr }),
      });
      setLatestWeight(parseFloat(form.currentWeight));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const u = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Calculate TDEE for presets
  const currentW = form.currentWeight ? parseFloat(form.currentWeight) : latestWeight;
  const canCalc = currentW && form.height && form.age;
  const heightIn = form.heightUnit === "cm" ? parseFloat(form.height) / 2.54 : parseFloat(form.height);
  const bmr = canCalc ? calcBMR(currentW, heightIn, parseInt(form.age), form.gender) : null;
  const tdee = bmr ? calcTDEE(bmr, form.activityLevel) : null;

  // Weight plan
  const weightDiff = currentW && form.targetWeight ? currentW - parseFloat(form.targetWeight) : null;
  const daysToGoal = form.targetDate ? Math.max(1, Math.ceil((new Date(form.targetDate + "T12:00:00").getTime() - Date.now()) / 86400000)) : null;
  const weeklyRate = weightDiff && daysToGoal ? (weightDiff / (daysToGoal / 7)) : null;
  const dailyDeficit = weeklyRate ? Math.round(weeklyRate * 500) : null;
  const rawSuggestedCals = tdee && dailyDeficit ? tdee - dailyDeficit : null;
  const minSafeCals = form.gender === "male" ? 1500 : 1200;
  const isBelowSafe = rawSuggestedCals !== null && rawSuggestedCals < minSafeCals;
  const suggestedCals = rawSuggestedCals;
  // How long it would actually take at safe minimum
  const safeDeficit = tdee ? tdee - minSafeCals : null;
  const safeWeeklyRate = safeDeficit ? safeDeficit / 500 : null; // lbs per week
  const safeDays = weightDiff && safeWeeklyRate && safeWeeklyRate > 0 ? Math.ceil((weightDiff / safeWeeklyRate) * 7) : null;
  const safeWeeks = safeDays ? (safeDays / 7).toFixed(1) : null;

  const heightDisplay = form.heightUnit === "in" && form.height
    ? `${Math.floor(parseFloat(form.height) / 12)}' ${Math.round(parseFloat(form.height) % 12)}"`
    : "";

  const macroCals =
    (parseFloat(form.targetProtein) || 0) * 4 +
    (parseFloat(form.targetCarbs) || 0) * 4 +
    (parseFloat(form.targetFat) || 0) * 9;

  // Dynamic presets based on TDEE
  const makePreset = (label: string, calOffset: number, pPct: number, cPct: number, fPct: number) => {
    const cal = tdee ? tdee + calOffset : 2000 + calOffset;
    const p = Math.round((cal * pPct) / 4);
    const c = Math.round((cal * cPct) / 4);
    const f = Math.round((cal * fPct) / 9);
    return {
      label: `${label} (${cal})`,
      cal: String(cal), p: String(p),
      cMin: String(Math.round(c * 0.6)), c: String(c),
      fMin: String(Math.round(f * 0.6)), f: String(f),
    };
  };

  const presets = [
    makePreset("🔥 Aggressive Cut", -750, 0.35, 0.35, 0.30),
    makePreset("🔥 Cut", -500, 0.30, 0.40, 0.30),
    makePreset("✨ Maintain", 0, 0.25, 0.45, 0.30),
    makePreset("💪 Lean Bulk", 300, 0.25, 0.45, 0.30),
  ];

  const MacroField = ({ label, color, minKey, maxKey, minVal, maxVal }: {
    label: string; color: string;
    minKey: string; maxKey: string; minVal: string; maxVal: string;
  }) => (
    <div>
      <label className="text-xs font-bold block mb-1" style={{ color }}>{label} (g)</label>
      <div className="flex gap-2 items-center">
        <input type="number" value={minVal} onChange={e => u(minKey, e.target.value)}
          placeholder="min" className="input" />
        <span className="text-xs font-bold" style={{ color: "#b098c8" }}>to</span>
        <input type="number" value={maxVal} onChange={e => u(maxKey, e.target.value)}
          placeholder="max" className="input" />
      </div>
      <span className="text-[10px]" style={{ color: "#b098c8" }}>
        {minVal && maxVal
          ? `${parseFloat(minVal) * (label === "Fat" ? 9 : 4)}–${parseFloat(maxVal) * (label === "Fat" ? 9 : 4)} kcal`
          : `${(parseFloat(maxVal) || 0) * (label === "Fat" ? 9 : 4)} kcal`} · leave blank to skip
      </span>
    </div>
  );

  return (
    <div className="space-y-5 pt-3 max-w-lg mx-auto">
      <div className="pixel-label text-center" style={{ fontSize: "10px" }}>✧ Goals & Profile ✧</div>

      {saved && (
        <div className="window slidein" style={{ borderColor: "#6bcb77" }}>
          <div className="window-body text-center font-bold" style={{ color: "#2d8a4e", padding: "10px" }}>
            ✦ Saved! ✦
          </div>
        </div>
      )}

      {/* Profile */}
      <Window title="👤 Profile">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Gender</label>
              <select value={form.gender} onChange={e => u("gender", e.target.value)} className="select w-full">
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
            <div>
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Age</label>
              <input type="number" value={form.age} onChange={e => u("age", e.target.value)}
                placeholder="25" className="input" min="1" />
            </div>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1 min-w-0">
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>
                Height {heightDisplay && <span style={{ color: "#9b5de5" }}>({heightDisplay})</span>}
              </label>
              <input type="number" value={form.height} onChange={e => u("height", e.target.value)}
                placeholder={form.heightUnit === "in" ? "e.g. 63" : "e.g. 160"} className="input" />
            </div>
            <div className="shrink-0">
              <select value={form.heightUnit} onChange={e => u("heightUnit", e.target.value)} className="select">
                <option value="in">inches</option>
                <option value="cm">cm</option>
              </select>
            </div>
          </div>
          <div>
            <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Current Weight ({form.unit})</label>
            <input type="number" value={form.currentWeight} onChange={e => u("currentWeight", e.target.value)}
              placeholder="e.g. 135" className="input" step="0.1" />
          </div>
          <div>
            <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Activity Level</label>
            <select value={form.activityLevel} onChange={e => u("activityLevel", e.target.value)} className="select w-full">
              {Object.entries(activityLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          {tdee && (
            <div className="text-xs text-center" style={{ color: "#7a5a9e" }}>
              BMR: <strong>{bmr}</strong> kcal · TDEE: <strong style={{ color: "#9b5de5" }}>{tdee}</strong> kcal/day
            </div>
          )}
        </div>
      </Window>

      {/* Weight Goal */}
      <Window title="⚖️ Weight Goal">
        <div className="space-y-3">
          <div>
            <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Goal Type</label>
            <div className="flex gap-2">
              {[
                { v: "lose", l: "🔥 Lose" },
                { v: "maintain", l: "✨ Maintain" },
                { v: "gain", l: "💪 Gain" },
              ].map(o => (
                <button
                  key={o.v}
                  onClick={() => u("goalType", o.v)}
                  className={`btn-sm flex-1 text-xs ${form.goalType === o.v ? "btn-pink" : "btn-blue"}`}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {form.goalType !== "maintain" && (
            <>
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Target Weight</label>
                  <input type="number" value={form.targetWeight} onChange={e => u("targetWeight", e.target.value)}
                    placeholder="e.g. 125" className="input" step="0.1" />
                </div>
                <div className="shrink-0">
                  <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Unit</label>
                  <select value={form.unit} onChange={e => u("unit", e.target.value)} className="select">
                    <option value="lbs">lbs</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>
              <div className="min-w-0">
                <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Target Date (optional)</label>
                <input type="date" value={form.targetDate} onChange={e => u("targetDate", e.target.value)} className="input" />
              </div>
            </>
          )}

          {form.goalType === "maintain" && (
            <div className="stat-box space-y-2" style={{ background: "#f5eeff", textAlign: "left" }}>
              <div className="pixel-label" style={{ fontSize: "7px", color: "#9b5de5" }}>✧ Maintenance Plan ✧</div>
              {tdee ? (
                <>
                  <div className="text-sm">
                    Eat at TDEE: <strong style={{ color: "#9b5de5" }}>{tdee} kcal/day</strong>
                  </div>
                  <div className="text-xs" style={{ color: "#7a5a9e" }}>
                    Target weight will track your current weight ({currentW ?? "—"} {form.unit}).
                  </div>
                  <button onClick={() => u("targetCalories", String(tdee))}
                    className="btn-blue btn-sm text-xs w-full mt-1">
                    Use {tdee} kcal as target
                  </button>
                </>
              ) : (
                <div className="text-xs" style={{ color: "#9b80b8" }}>
                  fill in profile above to see your maintenance calories
                </div>
              )}
            </div>
          )}

          {/* Plan suggestion */}
          {form.goalType !== "maintain" && weightDiff !== null && daysToGoal && weeklyRate && tdee && suggestedCals !== null && (
            <div className="stat-box space-y-2" style={{ background: "#f5eeff", textAlign: "left" }}>
              <div className="pixel-label" style={{ fontSize: "7px", color: "#9b5de5" }}>✧ Suggested Plan ✧</div>
              <div className="text-sm">
                <strong>{Math.abs(weightDiff).toFixed(1)} {form.unit}</strong> to {weightDiff > 0 ? "lose" : "gain"} in{" "}
                <strong>{daysToGoal} days</strong> ({(daysToGoal / 7).toFixed(1)} weeks)
              </div>
              <div className="text-sm">
                Your TDEE: <strong>{tdee} kcal/day</strong>
              </div>
              <div className="text-sm">
                Rate: <strong style={{ color: Math.abs(weeklyRate) > 2 ? "#dda520" : "#6bcb77" }}>
                  {Math.abs(weeklyRate).toFixed(1)} {form.unit}/week
                </strong>
              </div>
              <div className="text-sm">
                Daily {weightDiff > 0 ? "deficit" : "surplus"}: <strong>{Math.abs(dailyDeficit!)} kcal</strong>
              </div>
              <div className="text-sm">
                Suggested intake: <strong style={{ color: "#9b5de5" }}>{suggestedCals} kcal/day</strong>
              </div>

              {suggestedCals <= 0 && (
                <div className="text-xs font-bold" style={{ color: "#ff4444", background: "#fff0f0", padding: "6px 8px", borderRadius: 6, border: "1px solid #ff444440" }}>
                  🚫 This goal requires a <strong>negative daily intake ({suggestedCals} kcal)</strong> — physically impossible.
                  The deficit needed ({Math.abs(dailyDeficit!)} kcal/day) exceeds your TDEE ({tdee} kcal/day).
                  {safeWeeks && ` At ${minSafeCals} kcal/day it would take ~${safeWeeks} weeks.`}
                </div>
              )}

              {suggestedCals > 0 && isBelowSafe && (
                <div className="text-xs font-bold" style={{ color: "#dda520", background: "#fff8ed", padding: "6px 8px", borderRadius: 6, border: "1px solid #ffc14540" }}>
                  ⚠️ This is below the generally recommended minimum of {minSafeCals} kcal/day.
                  {safeWeeks && ` At ${minSafeCals} kcal it would take ~${safeWeeks} weeks instead.`}
                </div>
              )}

              <button onClick={() => u("targetCalories", String(suggestedCals))}
                className="btn-blue btn-sm text-xs w-full mt-1">
                Use {suggestedCals} kcal as target
              </button>
            </div>
          )}
        </div>
      </Window>

      {/* Nutrition Goals */}
      <Window title="🎯 Daily Nutrition">
        <div className="space-y-4">
          <div>
            <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Calories (kcal)</label>
            <input type="number" value={form.targetCalories} onChange={e => u("targetCalories", e.target.value)}
              placeholder="e.g. 2000" className="input" />
          </div>

          <div className="divider" />

          <MacroField label="Protein" color="#5bb8e8"
            minKey="minProtein" maxKey="targetProtein" minVal={form.minProtein} maxVal={form.targetProtein} />

          <div className="divider" />

          <MacroField label="Carbs" color="#dda520"
            minKey="minCarbs" maxKey="targetCarbs" minVal={form.minCarbs} maxVal={form.targetCarbs} />

          <div className="divider" />

          <MacroField label="Fat" color="#e84d98"
            minKey="minFat" maxKey="targetFat" minVal={form.minFat} maxVal={form.targetFat} />

          {macroCals > 0 && (
            <div className="text-xs text-center" style={{ color: "#7a5a9e" }}>
              Macro total (at max): <strong style={{ color: "#6bcb77" }}>{Math.round(macroCals)} kcal</strong>
              {form.targetCalories && Math.abs(macroCals - parseFloat(form.targetCalories)) > 50 && (
                <span className="ml-2" style={{ color: "#dda520" }}>
                  (off by {Math.abs(Math.round(macroCals - parseFloat(form.targetCalories)))})
                </span>
              )}
            </div>
          )}
        </div>
      </Window>

      {/* Dynamic Presets */}
      <Window title={`⚡ Quick Presets ${tdee ? `(based on ${tdee} TDEE)` : ""}`}>
        <div className="grid grid-cols-2 gap-2">
          {presets.map(pr => (
            <button key={pr.label}
              onClick={() => setForm(f => ({
                ...f, targetCalories: pr.cal, targetProtein: pr.p,
                targetCarbs: pr.c, minCarbs: pr.cMin,
                targetFat: pr.f, minFat: pr.fMin,
              }))}
              className="btn-blue btn-sm text-xs py-2">
              {pr.label}
            </button>
          ))}
        </div>
        {!tdee && (
          <p className="text-[10px] text-center mt-2" style={{ color: "#b098c8" }}>
            fill in profile above for personalized presets
          </p>
        )}
      </Window>

      <button onClick={handleSave} className="btn-pink w-full py-3">
        ✧ Save Goals ✧
      </button>
    </div>
  );
}
