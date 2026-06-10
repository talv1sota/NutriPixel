"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Window from "@/components/Window";
import MacroRing from "@/components/MacroRing";
import ProgressBar from "@/components/ProgressBar";
import { todayStr, calcMacros, formatDate, calcBMI, bmiCategory, calcBMR, calcTDEE, toLbs, toIn } from "@/lib/helpers";
import { currentStageIndex, formatDuration, FASTING_STAGES } from "@/lib/fasting";

interface Food {
  id: number; name: string; brand: string | null;
  calories: number; protein: number;
  carbs: number; fat: number; fiber: number; sugar: number;
}
interface FoodLog {
  id: number; amount: number; meal: string; date: string; food: Food;
}
interface Exercise {
  id: number; name: string; caloriesBurned: number; duration: number; date: string;
}
interface Mood {
  id: number; date: string; tags: string; notes: string | null;
}
interface FastingSession {
  id: number; startTime: string; endTime: string | null; goalHours: number;
}
interface Goal {
  targetCalories: number | null; targetProtein: number | null;
  targetCarbs: number | null; targetFat: number | null;
  minProtein: number | null; minCarbs: number | null; minFat: number | null;
  height: number | null; heightUnit: string;
  gender: string; age: number | null;
  activityLevel: string; unit: string; targetWeight: number | null;
}

type MacroKey = "calories" | "protein" | "carbs" | "fat";

const macroColors: Record<MacroKey, string> = {
  calories: "#6bcb77", protein: "#5bb8e8", carbs: "#ffc145", fat: "#ff69b4",
};
const macroUnits: Record<MacroKey, string> = {
  calories: "kcal", protein: "g", carbs: "g", fat: "g",
};

export default function Dashboard() {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [fasting, setFasting] = useState<FastingSession | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [date, setDate] = useState(todayStr());
  const [expanded, setExpanded] = useState<MacroKey | null>(null);

  const fetchData = useCallback(async () => {
    const [lr, gr, er, wr, mr, fr] = await Promise.all([
      fetch(`/api/logs?date=${date}`),
      fetch("/api/goals"),
      fetch(`/api/exercise?date=${date}`),
      fetch("/api/weight"),
      fetch(`/api/mood?date=${date}`),
      fetch("/api/fasting"),
    ]);
    setLogs(await lr.json());
    setGoal(await gr.json());
    setExercises(await er.json());
    const weights = await wr.json();
    if (weights.length > 0) setLatestWeight(weights[weights.length - 1].weight);
    setMood(await mr.json());
    setFasting((await fr.json()).active);
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Tick once a second while a fast is running (banner is "now", not the
  // selected log date).
  useEffect(() => {
    if (!fasting) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [fasting]);

  const fastingView = (() => {
    if (!fasting) return null;
    const elapsedMs = now - new Date(fasting.startTime).getTime();
    const goalMs = fasting.goalHours * 3_600_000;
    const pct = Math.min(100, (elapsedMs / goalMs) * 100);
    const reached = elapsedMs >= goalMs;
    const stage = FASTING_STAGES[currentStageIndex(elapsedMs / 3_600_000)];
    return { elapsedMs, pct, reached, stage };
  })();


  const totals = logs.reduce((a, l) => {
    const m = calcMacros(l.food, l.amount);
    return { calories: a.calories + m.calories, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const totalBurned = exercises.reduce((s, e) => s + e.caloriesBurned, 0);
  const netCalories = totals.calories - totalBurned;

  const changeDate = (d: number) => {
    const dt = new Date(date + "T12:00:00");
    dt.setDate(dt.getDate() + d);
    setDate(dt.toISOString().split("T")[0]);
    setExpanded(null);
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/logs?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleDeleteExercise = async (id: number) => {
    await fetch(`/api/exercise?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const toggleExpand = (key: MacroKey) => setExpanded(expanded === key ? null : key);

  const breakdown = (key: MacroKey) =>
    logs.map((l) => ({ name: l.food.name, amount: l.amount, value: calcMacros(l.food, l.amount)[key] }))
      .filter((b) => b.value > 0)
      .sort((a, b) => b.value - a.value);

  // BMI / BMR / TDEE — normalize to imperial regardless of user unit setting.
  const canCalcBody = latestWeight && goal?.height && goal?.age;
  const weightLbs = canCalcBody ? toLbs(latestWeight, goal!.unit) : null;
  const heightIn = canCalcBody ? toIn(goal!.height!, goal!.heightUnit) : null;
  const bmi = canCalcBody ? calcBMI(weightLbs!, heightIn!) : null;
  const bmr = canCalcBody ? calcBMR(weightLbs!, heightIn!, goal!.age!, goal!.gender) : null;
  const tdee = bmr ? calcTDEE(bmr, goal!.activityLevel) : null;
  const bmiInfo = bmi ? bmiCategory(bmi) : null;

  const meals = ["breakfast", "lunch", "dinner", "snack", "dessert", "supplement"];
  const mealIcons: Record<string, string> = { breakfast: "🌅", lunch: "🌸", dinner: "🌙", snack: "🍬", dessert: "🧁", supplement: "💊" };

  return (
    <div className="space-y-5 pt-3">
      {/* Date nav */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => changeDate(-1)} className="btn-blue btn-sm">◀ Prev</button>
        <div className="pixel-label text-center" style={{ fontSize: "10px", minWidth: 120 }}>
          {date === todayStr() ? "✧ Today ✧" : formatDate(date)}
        </div>
        <button onClick={() => changeDate(1)} className="btn-blue btn-sm">Next ▶</button>
      </div>

      {/* Active fast banner — live, tap to open Fasting */}
      {fastingView && (
        <Link href="/fasting" style={{ textDecoration: "none", display: "block" }}>
          <div className="window slidein" style={{ borderColor: fastingView.reached ? "#6bcb77" : fastingView.stage.color }}>
            <div className="window-body" style={{ padding: 12 }}>
              <div className="flex items-center gap-3">
                <div style={{ fontSize: 26 }}>{fastingView.reached ? "🌟" : fastingView.stage.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="pixel-label" style={{ fontSize: "7px" }}>
                      {fastingView.reached ? "Goal reached" : "Fasting"}
                    </span>
                    <span className="font-bold" style={{ fontSize: 16, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                      {formatDuration(fastingView.elapsedMs)}
                    </span>
                  </div>
                  <div className="bar-track mt-1" style={{ height: 10 }}>
                    <div className="bar-fill" style={{ width: `${fastingView.pct}%`, background: fastingView.reached ? "#6bcb77" : fastingView.stage.color }} />
                  </div>
                  <div className="text-xs mt-1 font-bold" style={{ color: fastingView.stage.color }}>
                    {fastingView.stage.emoji} {fastingView.stage.title} · {fastingView.pct.toFixed(0)}% of {fasting!.goalHours}h
                  </div>
                </div>
                <span style={{ color: "#c0a0d8", fontSize: 18 }}>›</span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* BMI / BMR / TDEE */}
      {canCalcBody && (
        <div className="grid grid-cols-4 gap-2">
          <div className="stat-box">
            <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>BMI</div>
            <div className="text-lg font-bold" style={{ color: bmiInfo!.color }}>{bmi}</div>
            <div className="text-[10px] font-semibold" style={{ color: bmiInfo!.color }}>{bmiInfo!.label}</div>
          </div>
          <div className="stat-box">
            <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>BMR</div>
            <div className="text-lg font-bold" style={{ color: "var(--accent-purple)" }}>{bmr}</div>
            <div className="text-[10px]" style={{ color: "var(--ink-faint)" }}>kcal/day</div>
          </div>
          <div className="stat-box">
            <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>TDEE</div>
            <div className="text-lg font-bold" style={{ color: "#5bb8e8" }}>{tdee}</div>
            <div className="text-[10px]" style={{ color: "var(--ink-faint)" }}>kcal/day</div>
          </div>
          <div className="stat-box">
            <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>Net Cal</div>
            <div className="text-lg font-bold" style={{ color: netCalories > (tdee || 2000) ? "#ff4444" : "#6bcb77" }}>
              {netCalories}
            </div>
            <div className="text-[10px]" style={{ color: "var(--ink-faint)" }}>
              {tdee ? (netCalories < tdee ? `${tdee - netCalories} deficit` : `${netCalories - tdee} surplus`) : "kcal"}
            </div>
          </div>
        </div>
      )}

      {/* Macro rings */}
      <Window title="✧ Macros Overview ✧ (tap to expand)">
        <div className="flex justify-around flex-wrap gap-3">
          {(["calories", "protein", "carbs", "fat"] as MacroKey[]).map((key) => {
            const cap = key.charAt(0).toUpperCase() + key.slice(1);
            const goalMax = (goal as Record<string, number | null> | null)?.[`target${cap}`] as number | null;
            const goalMin = (goal as Record<string, number | null> | null)?.[`min${cap}`] as number | null;
            const goalVal = goalMax ?? goalMin;
            const displayValue = key === "calories" ? netCalories : totals[key];
            const hasGoal = goalVal !== null && goalVal !== undefined;
            // When no goal, use the value itself as max so ring fills fully (or a default)
            const maxVal = hasGoal ? goalVal : (key === "calories" ? 2000 : Math.max(displayValue, 1));
            return (
              <div key={key} onClick={() => toggleExpand(key)} style={{ cursor: "pointer" }}>
                <MacroRing
                  value={displayValue}
                  max={maxVal}
                  label={key === "calories" && totalBurned > 0 ? "Net Cal" : key.charAt(0).toUpperCase() + key.slice(1)}
                  unit={macroUnits[key]}
                  color={macroColors[key]}
                  size={100}
                  active={expanded === key}
                  hasGoal={key === "calories" ? true : hasGoal}
                />
              </div>
            );
          })}
        </div>
        {totalBurned > 0 && (
          <div className="text-xs text-center mt-2" style={{ color: "var(--ink-faint)" }}>
            Eaten: {totals.calories} − Burned: {totalBurned} = Net: <strong style={{ color: "#6bcb77" }}>{netCalories}</strong> kcal
          </div>
        )}

        {expanded && (
          <div className="mt-4 slidein" style={{ borderTop: `2px solid ${macroColors[expanded]}20`, paddingTop: 12 }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="pixel-label" style={{ fontSize: "8px", color: macroColors[expanded] }}>
                {expanded} breakdown
              </span>
              <span className="text-xs" style={{ color: "var(--ink-faint)" }}>
                — total: {Math.round(totals[expanded])} {macroUnits[expanded]}
              </span>
            </div>
            {breakdown(expanded).map((item, i) => {
              const pct = (item.value / totals[expanded]) * 100;
              return (
                <div key={i} className="flex items-center gap-3 py-1.5" style={{ borderBottom: "1px dashed #ede0f5" }}>
                  <span className="text-sm font-semibold flex-1">{item.name}</span>
                  <span className="text-xs" style={{ color: "var(--ink-faint)" }}>{item.amount}g</span>
                  <div style={{ width: 80, height: 8, background: "#ede0f5", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: macroColors[expanded], borderRadius: 4, transition: "width 0.3s ease" }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: macroColors[expanded], minWidth: 45, textAlign: "right" }}>
                    {item.value} {macroUnits[expanded]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Window>

      {/* Progress bars */}
      <Window title="✧ Daily Progress ✧">
        <div className="space-y-3">
          <ProgressBar value={totals.calories} max={goal?.targetCalories || 2000} label="Calories" type="calories" />
          <ProgressBar value={totals.protein} max={(goal?.targetProtein ?? goal?.minProtein) ?? null} label="Protein" type="protein" />
          <ProgressBar value={totals.carbs} max={(goal?.targetCarbs ?? goal?.minCarbs) ?? null} label="Carbs" type="carbs" />
          <ProgressBar value={totals.fat} max={(goal?.targetFat ?? goal?.minFat) ?? null} label="Fat" type="fat" />
        </div>
        {totalBurned > 0 && (
          <div className="mt-3" style={{ borderTop: "1px dashed #ede0f5", paddingTop: 8 }}>
            <div className="flex justify-between text-xs font-bold">
              <span style={{ color: "var(--accent-pink)" }}>🔥 Burned from exercise</span>
              <span style={{ color: "var(--accent-pink)" }}>-{totalBurned} kcal</span>
            </div>
            <div className="flex justify-between text-xs font-bold mt-1">
              <span style={{ color: "#6bcb77" }}>Net calories</span>
              <span style={{ color: "#6bcb77" }}>{netCalories} kcal</span>
            </div>
          </div>
        )}
      </Window>

      {/* Exercise */}
      {exercises.length > 0 && (
        <Window title="🏃 Exercise">
          {exercises.map((ex) => (
            <div key={ex.id} className="list-row">
              <div>
                <span className="font-semibold">{ex.name}</span>
                <span className="badge ml-2">{ex.duration} min</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span style={{ color: "var(--accent-pink)" }}>-{ex.caloriesBurned} kcal</span>
                <button onClick={() => handleDeleteExercise(ex.id)} className="delete-btn">×</button>
              </div>
            </div>
          ))}
        </Window>
      )}

      {/* Meals */}
      {meals.map((meal) => {
        const ml = logs.filter((l) => l.meal === meal);
        if (ml.length === 0) return null;
        const cals = ml.reduce((s, l) => s + calcMacros(l.food, l.amount).calories, 0);
        return (
          <Window key={meal} title={`${mealIcons[meal]} ${meal.charAt(0).toUpperCase() + meal.slice(1)} — ${cals} kcal`}>
            {ml.map((log) => {
              const m = calcMacros(log.food, log.amount);
              const isRecipe = log.food.brand === "Recipe";
              return (
                <div key={log.id} className="list-row">
                  <div>
                    <span className="font-semibold">
                      {isRecipe ? log.food.name.replace(/ \(recipe\)$/, "") : log.food.name}
                    </span>
                    {log.food.brand && log.food.brand !== "Recipe" && log.food.brand !== "Generic" && (
                      <span className="text-xs ml-2" style={{ color: "var(--ink-muted)" }}>{log.food.brand}</span>
                    )}
                    <span className="badge ml-2">
                      {isRecipe
                        ? `${log.amount / 100} serving${log.amount === 100 ? "" : "s"}`
                        : `${log.amount}g`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span style={{ color: "#6bcb77" }}>{m.calories}</span>
                    <span style={{ color: "#5bb8e8" }}>P{m.protein}</span>
                    <span style={{ color: "#dda520" }}>C{m.carbs}</span>
                    <span style={{ color: "var(--accent-pink)" }}>F{m.fat}</span>
                    <button onClick={() => handleDelete(log.id)} className="delete-btn" title="Delete">×</button>
                  </div>
                </div>
              );
            })}
          </Window>
        );
      })}

      {logs.length === 0 && exercises.length === 0 && (
        <Window title="✧ Nothing Here Yet ✧">
          <div className="text-center py-4">
            <p className="vt-text">no food logged for this day ~</p>
            <p className="pixel-label mt-2" style={{ fontSize: "8px" }}>go 2 Log tab to add food!!</p>
          </div>
        </Window>
      )}

      {/* Mood summary */}
      {mood && (mood.tags || mood.notes) && (
        <Window title="💭 Today's Mood">
          {mood.tags && (
            <div className="flex flex-wrap gap-2 mb-2">
              {mood.tags.split(",").filter(Boolean).map((tag) => (
                <span key={tag} className="badge" style={{ fontSize: 12, padding: "4px 10px" }}>{tag}</span>
              ))}
            </div>
          )}
          {mood.notes && (
            <p className="text-sm italic" style={{ color: "var(--ink-soft)", background: "#f5eeff", padding: 10, borderRadius: 8, border: "1px dashed #d4b8e8" }}>
              &quot;{mood.notes}&quot;
            </p>
          )}
        </Window>
      )}
    </div>
  );
}
