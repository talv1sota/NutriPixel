"use client";

import { useEffect, useState, useCallback } from "react";
import Window from "@/components/Window";
import MacroRing from "@/components/MacroRing";
import ProgressBar from "@/components/ProgressBar";
import { todayStr, calcMacros, formatDate, calcBMI, bmiCategory, calcBMR, calcTDEE } from "@/lib/helpers";

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
interface Goal {
  targetCalories: number | null; targetProtein: number | null;
  targetCarbs: number | null; targetFat: number | null;
  minProtein: number | null; minCarbs: number | null; minFat: number | null;
  height: number | null; gender: string; age: number | null;
  activityLevel: string; unit: string; targetWeight: number | null;
}

type MacroKey = "calories" | "protein" | "carbs" | "fat";

const macroColors: Record<MacroKey, string> = {
  calories: "#6bcb77", protein: "#5bb8e8", carbs: "#ffc145", fat: "#ff69b4",
};
const macroUnits: Record<MacroKey, string> = {
  calories: "kcal", protein: "g", carbs: "g", fat: "g",
};

const mealOptions = [
  { v: "breakfast", l: "🌅 Breakfast" },
  { v: "lunch", l: "🌸 Lunch" },
  { v: "dinner", l: "🌙 Dinner" },
  { v: "snack", l: "🍬 Snack" },
  { v: "dessert", l: "🧁 Dessert" },
  { v: "supplement", l: "💊 Supplement" },
];

export default function Dashboard() {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [date, setDate] = useState(todayStr());
  const [expanded, setExpanded] = useState<MacroKey | null>(null);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editLog, setEditLog] = useState({ amount: "", meal: "" });
  const [editFlash, setEditFlash] = useState("");

  const fetchData = useCallback(async () => {
    const [lr, gr, er, wr, mr] = await Promise.all([
      fetch(`/api/logs?date=${date}`),
      fetch("/api/goals"),
      fetch(`/api/exercise?date=${date}`),
      fetch("/api/weight"),
      fetch(`/api/mood?date=${date}`),
    ]);
    setLogs(await lr.json());
    setGoal(await gr.json());
    setExercises(await er.json());
    const weights = await wr.json();
    if (weights.length > 0) setLatestWeight(weights[weights.length - 1].weight);
    setMood(await mr.json());
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);


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

  const startEditLog = (log: FoodLog) => {
    setEditingLogId(log.id);
    setEditLog({ amount: String(log.amount), meal: log.meal });
  };

  const cancelEditLog = () => {
    setEditingLogId(null);
    setEditLog({ amount: "", meal: "" });
  };

  const handleSaveEditLog = async (id: number) => {
    const amount = parseFloat(editLog.amount);
    if (!isFinite(amount) || amount <= 0) {
      setEditFlash("✗ Amount must be a positive number");
      setTimeout(() => setEditFlash(""), 4000);
      return;
    }
    const res = await fetch(`/api/logs?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, meal: editLog.meal }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setEditFlash(`✗ Edit failed (${res.status})${body?.error ? ": " + body.error : ""}`);
      setTimeout(() => setEditFlash(""), 6000);
      return;
    }
    cancelEditLog();
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

  // BMI / BMR / TDEE
  const canCalcBody = latestWeight && goal?.height && goal?.age;
  const bmi = canCalcBody ? calcBMI(latestWeight, goal.height!) : null;
  const bmr = canCalcBody ? calcBMR(latestWeight, goal.height!, goal.age!, goal.gender) : null;
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
            <div className="text-lg font-bold" style={{ color: "#9b5de5" }}>{bmr}</div>
            <div className="text-[10px]" style={{ color: "#b098c8" }}>kcal/day</div>
          </div>
          <div className="stat-box">
            <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>TDEE</div>
            <div className="text-lg font-bold" style={{ color: "#5bb8e8" }}>{tdee}</div>
            <div className="text-[10px]" style={{ color: "#b098c8" }}>kcal/day</div>
          </div>
          <div className="stat-box">
            <div className="pixel-label mb-1" style={{ fontSize: "7px" }}>Net Cal</div>
            <div className="text-lg font-bold" style={{ color: netCalories > (tdee || 2000) ? "#ff4444" : "#6bcb77" }}>
              {netCalories}
            </div>
            <div className="text-[10px]" style={{ color: "#b098c8" }}>
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
          <div className="text-xs text-center mt-2" style={{ color: "#b098c8" }}>
            Eaten: {totals.calories} − Burned: {totalBurned} = Net: <strong style={{ color: "#6bcb77" }}>{netCalories}</strong> kcal
          </div>
        )}

        {expanded && (
          <div className="mt-4 slidein" style={{ borderTop: `2px solid ${macroColors[expanded]}20`, paddingTop: 12 }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="pixel-label" style={{ fontSize: "8px", color: macroColors[expanded] }}>
                {expanded} breakdown
              </span>
              <span className="text-xs" style={{ color: "#b098c8" }}>
                — total: {Math.round(totals[expanded])} {macroUnits[expanded]}
              </span>
            </div>
            {breakdown(expanded).map((item, i) => {
              const pct = (item.value / totals[expanded]) * 100;
              return (
                <div key={i} className="flex items-center gap-3 py-1.5" style={{ borderBottom: "1px dashed #ede0f5" }}>
                  <span className="text-sm font-semibold flex-1">{item.name}</span>
                  <span className="text-xs" style={{ color: "#b098c8" }}>{item.amount}g</span>
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
              <span style={{ color: "#e84d98" }}>🔥 Burned from exercise</span>
              <span style={{ color: "#e84d98" }}>-{totalBurned} kcal</span>
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
                <span style={{ color: "#e84d98" }}>-{ex.caloriesBurned} kcal</span>
                <button onClick={() => handleDeleteExercise(ex.id)} className="delete-btn">×</button>
              </div>
            </div>
          ))}
        </Window>
      )}

      {editFlash && (
        <div className="window slidein" style={{ borderColor: "#e84d6a" }}>
          <div className="window-body text-center font-bold" style={{ color: "#a8264a", padding: "10px" }}>
            {editFlash}
          </div>
        </div>
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
              if (editingLogId === log.id) {
                return (
                  <div key={log.id} className="list-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                    <div className="text-sm font-semibold">
                      {isRecipe ? log.food.name.replace(/ \(recipe\)$/, "") : log.food.name}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 min-w-0">
                        <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>
                          {isRecipe ? "Servings ×100" : "Amount (g)"}
                        </label>
                        <input
                          type="number"
                          value={editLog.amount}
                          onChange={e => setEditLog(f => ({ ...f, amount: e.target.value }))}
                          className="input"
                          min="0"
                          step="1"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Meal</label>
                        <select
                          value={editLog.meal}
                          onChange={e => setEditLog(f => ({ ...f, meal: e.target.value }))}
                          className="select"
                        >
                          {mealOptions.map(o => (
                            <option key={o.v} value={o.v}>{o.l}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveEditLog(log.id)} className="btn-pink btn-sm flex-1">save</button>
                      <button onClick={cancelEditLog} className="btn-blue btn-sm flex-1">cancel</button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={log.id} className="list-row">
                  <div>
                    <span className="font-semibold">
                      {isRecipe ? log.food.name.replace(/ \(recipe\)$/, "") : log.food.name}
                    </span>
                    {log.food.brand && log.food.brand !== "Recipe" && log.food.brand !== "Generic" && (
                      <span className="text-xs ml-2" style={{ color: "#9b80b8" }}>{log.food.brand}</span>
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
                    <span style={{ color: "#e84d98" }}>F{m.fat}</span>
                    <button onClick={() => startEditLog(log)} className="delete-btn" title="Edit" style={{ background: "#ede0f5", color: "#7c3aed" }}>✎</button>
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
            <p className="text-sm italic" style={{ color: "#7a5a9e", background: "#f5eeff", padding: 10, borderRadius: 8, border: "1px dashed #d4b8e8" }}>
              &quot;{mood.notes}&quot;
            </p>
          )}
        </Window>
      )}
    </div>
  );
}
