"use client";

import { useEffect, useState, useRef } from "react";
import Window from "@/components/Window";
import { todayStr, calcMacros } from "@/lib/helpers";

interface Food {
  id: number; name: string; brand: string | null;
  calories: number; protein: number; carbs: number; fat: number;
  fiber: number; sugar: number; serving: number; unit: string;
  userId: number | null; // null = global; non-null = this user's custom food
}

interface Recipe {
  id: number; title: string; servings: string | null;
  calories: number | null; protein: number | null; carbs: number | null; fat: number | null;
}

interface RecurringEntry {
  id: number; foodId: number; amount: number; meal: string; active: boolean;
  food: Food | null;
}

type Pick =
  | { kind: "food"; food: Food }
  | { kind: "recipe"; recipe: Recipe };

const mealOptions = [
  { v: "breakfast", l: "🌅 Breakfast" },
  { v: "lunch", l: "🌸 Lunch" },
  { v: "dinner", l: "🌙 Dinner" },
  { v: "snack", l: "🍬 Snack" },
  { v: "dessert", l: "🧁 Dessert" },
  { v: "supplement", l: "💊 Supplement" },
];

export default function LogPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recurring, setRecurring] = useState<RecurringEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filteredFoods, setFilteredFoods] = useState<Food[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Pick | null>(null);
  const [amount, setAmount] = useState("");
  const [servings, setServings] = useState("1");
  const [meal, setMeal] = useState("lunch");
  const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [custom, setCustom] = useState({
    name: "", brand: "", calories: "", protein: "", carbs: "", fat: "", serving: "",
  });
  const ref = useRef<HTMLInputElement>(null);

  const myFoods = foods.filter(f => f.userId !== null);

  useEffect(() => {
    fetch("/api/foods").then(r => r.json()).then(setFoods);
    fetch("/api/recipes").then(r => r.json()).then(setRecipes);
    // Reconcile daily recurring logs first, then load the recurring list.
    fetch("/api/recurring/run", { method: "POST" }).finally(() => {
      fetch("/api/recurring").then(r => r.json()).then(setRecurring);
    });
  }, []);

  useEffect(() => {
    if (!search) { setFilteredFoods([]); setFilteredRecipes([]); return; }
    const q = search.toLowerCase();
    setFilteredFoods(foods.filter(f => f.name.toLowerCase().includes(q)).slice(0, 8));
    setFilteredRecipes(recipes.filter(r => r.title.toLowerCase().includes(q)).slice(0, 5));
  }, [search, foods, recipes]);

  const pickFood = (food: Food) => {
    setSelected({ kind: "food", food });
    setAmount(String(food.serving));
    setSearch("");
    setFilteredFoods([]);
    setFilteredRecipes([]);
  };

  const pickRecipe = (recipe: Recipe) => {
    setSelected({ kind: "recipe", recipe });
    setServings("1");
    setSearch("");
    setFilteredFoods([]);
    setFilteredRecipes([]);
  };

  const preview = (() => {
    if (!selected) return null;
    if (selected.kind === "food") {
      return amount ? calcMacros(selected.food, parseFloat(amount) || 0) : null;
    }
    const r = selected.recipe;
    const s = parseFloat(servings) || 0;
    return {
      calories: Math.round((r.calories ?? 0) * s),
      protein: Math.round((r.protein ?? 0) * s * 10) / 10,
      carbs: Math.round((r.carbs ?? 0) * s * 10) / 10,
      fat: Math.round((r.fat ?? 0) * s * 10) / 10,
      fiber: 0, sugar: 0,
    };
  })();

  const showFlash = (msg: string, ms = 2500) => {
    setFlash(msg);
    setTimeout(() => setFlash(""), ms);
  };

  const handleLog = async () => {
    if (!selected) return;
    setSaving(true);
    let flashMsg = "";
    let flashMs = 2500;
    try {
      let res: Response;
      let successMsg: string;
      if (selected.kind === "food") {
        if (!amount) { setSaving(false); return; }
        res = await fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodId: selected.food.id, amount: parseFloat(amount), meal, date }),
        });
        successMsg = `Logged ${selected.food.name}!`;
      } else {
        const s = parseFloat(servings);
        if (!s) { setSaving(false); return; }
        res = await fetch("/api/logs/recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipeId: selected.recipe.id, servings: s, meal, date }),
        });
        successMsg = `Logged ${s} × ${selected.recipe.title}!`;
      }
      if (!res.ok) {
        let detail = "";
        try {
          const body = await res.json();
          if (body && typeof body.error === "string") detail = body.error;
        } catch {
          detail = await res.text().catch(() => "");
        }
        flashMsg = `✗ Save failed (${res.status})${detail ? ": " + detail.slice(0, 120) : ""}`;
        flashMs = 8000;
      } else {
        flashMsg = successMsg;
        setSelected(null);
        setAmount("");
        setServings("1");
      }
    } catch (e) {
      flashMsg = `✗ Network error: ${e instanceof Error ? e.message : "unknown"}`;
      flashMs = 6000;
    }
    setFlash(flashMsg);
    setSaving(false);
    setTimeout(() => setFlash(""), flashMs);
    ref.current?.focus();
  };

  const handleAddRecurring = async () => {
    if (!selected || selected.kind !== "food" || !amount) return;
    setSaving(true);
    try {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodId: selected.food.id, amount: parseFloat(amount), meal }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showFlash(`✗ Could not add recurring (${res.status})${body?.error ? ": " + body.error : ""}`, 6000);
      } else {
        const list = await fetch("/api/recurring").then(r => r.json());
        setRecurring(list);
        showFlash(`Added ${selected.food.name} as daily ${meal}`);
        setShowRecurring(true);
      }
    } catch (e) {
      showFlash(`✗ Network error: ${e instanceof Error ? e.message : "unknown"}`, 6000);
    }
    setSaving(false);
  };

  const handleRemoveRecurring = async (id: number) => {
    try {
      const res = await fetch(`/api/recurring?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        showFlash(`✗ Could not remove (${res.status})`, 6000);
        return;
      }
      setRecurring(prev => prev.filter(r => r.id !== id));
      showFlash("Removed from recurring");
    } catch (e) {
      showFlash(`✗ Network error: ${e instanceof Error ? e.message : "unknown"}`, 6000);
    }
  };

  const handleSaveCustom = async () => {
    if (!custom.name || !custom.calories) return;
    setSaving(true);
    try {
      const servingG = parseFloat(custom.serving) || 100;
      const res = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: custom.name,
          brand: custom.brand || "Custom",
          calories: parseFloat(custom.calories) * 100 / servingG,
          protein: (parseFloat(custom.protein) || 0) * 100 / servingG,
          carbs: (parseFloat(custom.carbs) || 0) * 100 / servingG,
          fat: (parseFloat(custom.fat) || 0) * 100 / servingG,
          serving: servingG,
        }),
      });
      if (!res.ok) {
        showFlash(`✗ Could not save (${res.status})`, 6000);
      } else {
        const food = await res.json();
        setFoods(prev => [...prev, food]);
        setCustom({ name: "", brand: "", calories: "", protein: "", carbs: "", fat: "", serving: "" });
        setShowCustom(false);
        showFlash(`Saved ${food.name} to your foods. Search to log it.`);
      }
    } catch (e) {
      showFlash(`✗ Network error: ${e instanceof Error ? e.message : "unknown"}`, 6000);
    }
    setSaving(false);
  };

  const handleDeleteFood = async (food: Food) => {
    try {
      const res = await fetch(`/api/foods?id=${food.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showFlash(`✗ Remove failed (${res.status})${body?.error ? ": " + String(body.error).slice(0, 120) : ""}`, 6000);
        return;
      }
      setFoods(prev => prev.filter(f => f.id !== food.id));
      setRecurring(prev => prev.filter(r => r.foodId !== food.id));
      showFlash(`Removed ${food.name} (existing logs kept)`);
    } catch (e) {
      showFlash(`✗ Network error: ${e instanceof Error ? e.message : "unknown"}`, 6000);
    }
  };

  return (
    <div className="space-y-5 pt-3 max-w-lg mx-auto">
      <div className="pixel-label text-center" style={{ fontSize: "10px" }}>✧ Log Food ✧</div>

      {flash && (
        <div className="window slidein" style={{ borderColor: flash.startsWith("✗") ? "#e84d6a" : "#6bcb77" }}>
          <div className="window-body text-center font-bold" style={{ color: flash.startsWith("✗") ? "#a8264a" : "#2d8a4e", padding: "10px" }}>
            {flash.startsWith("✗") ? flash : `✦ ${flash} ✦`}
          </div>
        </div>
      )}

      <Window title="📅 Date & Meal">
        <div className="flex gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input flex-1" />
          <select value={meal} onChange={e => setMeal(e.target.value)} className="select flex-1">
            {mealOptions.map(o => (
              <option key={o.v} value={o.v}>{o.l}</option>
            ))}
          </select>
        </div>
      </Window>

      <Window title="🔍 Search Foods & Recipes">
        <div className="relative">
          <input ref={ref} type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="type to search..." className="input" />
          {(filteredFoods.length > 0 || filteredRecipes.length > 0) && (
            <div className="absolute z-30 top-full left-0 right-0 mt-1 window" style={{ maxHeight: 320, overflowY: "auto" }}>
              {filteredRecipes.length > 0 && (
                <>
                  <div className="pixel-label px-3 pt-2" style={{ fontSize: 7 }}>📖 Recipes</div>
                  {filteredRecipes.map(recipe => (
                    <div key={`r-${recipe.id}`} className="dropdown-item" onClick={() => pickRecipe(recipe)}>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-sm">{recipe.title}</span>
                          <span className="text-xs ml-2" style={{ color: "#e84d98" }}>recipe</span>
                        </div>
                        {recipe.calories != null && (
                          <span className="text-xs font-bold" style={{ color: "#6bcb77" }}>
                            {Math.round(recipe.calories)} kcal
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 text-[10px] mt-1" style={{ color: "#b098c8" }}>
                        <span>per serving</span>
                        {recipe.protein != null && <span>P{Math.round(recipe.protein)}g</span>}
                        {recipe.carbs != null && <span>C{Math.round(recipe.carbs)}g</span>}
                        {recipe.fat != null && <span>F{Math.round(recipe.fat)}g</span>}
                      </div>
                    </div>
                  ))}
                </>
              )}
              {filteredFoods.length > 0 && (
                <>
                  <div className="pixel-label px-3 pt-2" style={{ fontSize: 7 }}>🍰 Foods</div>
                  {filteredFoods.map(food => (
                    <div key={`f-${food.id}`} className="dropdown-item" onClick={() => pickFood(food)}>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-sm">{food.name}</span>
                          {food.brand && <span className="text-xs ml-2" style={{ color: "#9b80b8" }}>{food.brand}</span>}
                        </div>
                        <span className="text-xs font-bold" style={{ color: "#6bcb77" }}>
                          {Math.round(food.calories * food.serving / 100)} kcal
                        </span>
                      </div>
                      <div className="flex gap-3 text-[10px] mt-1" style={{ color: "#b098c8" }}>
                        <span>{food.serving}{food.unit}</span>
                        <span>P{(food.protein * food.serving / 100).toFixed(0)}g</span>
                        <span>C{(food.carbs * food.serving / 100).toFixed(0)}g</span>
                        <span>F{(food.fat * food.serving / 100).toFixed(0)}g</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </Window>

      {selected && (
        <Window title={selected.kind === "food" ? `🍽️ ${selected.food.name}` : `📖 ${selected.recipe.title}`}>
          <div className="space-y-4">
            {selected.kind === "food" ? (
              <div>
                <label className="pixel-label block mb-1">Amount ({selected.food.unit})</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="input" min="0" step="1" />
                <div className="flex gap-2 mt-2">
                  {[0.5, 1, 1.5, 2].map(m => (
                    <button key={m} onClick={() => setAmount(String(Math.round(selected.food.serving * m)))}
                      className="btn-blue btn-sm flex-1">{m}×</button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="pixel-label block mb-1">Servings</label>
                <input type="number" value={servings} onChange={e => setServings(e.target.value)}
                  className="input" min="0" step="0.25" />
                <div className="flex gap-2 mt-2">
                  {[0.5, 1, 1.5, 2].map(m => (
                    <button key={m} onClick={() => setServings(String(m))}
                      className="btn-blue btn-sm flex-1">{m}×</button>
                  ))}
                </div>
                {selected.recipe.servings && (
                  <p className="text-xs mt-2" style={{ color: "#9b80b8" }}>
                    Full recipe = {selected.recipe.servings}
                  </p>
                )}
              </div>
            )}

            {preview && (
              <div className="grid grid-cols-4 gap-2">
                {[
                  { v: preview.calories, l: "kcal", c: "#6bcb77", bg: "#edfff0" },
                  { v: preview.protein, l: "protein", c: "#5bb8e8", bg: "#edf6ff" },
                  { v: preview.carbs, l: "carbs", c: "#dda520", bg: "#fffced" },
                  { v: preview.fat, l: "fat", c: "#e84d98", bg: "#fff0f5" },
                ].map(item => (
                  <div key={item.l} className="stat-box" style={{ background: item.bg }}>
                    <div className="text-lg font-bold" style={{ color: item.c }}>{item.v}</div>
                    <div className="text-[10px] font-semibold" style={{ color: "#9b80b8" }}>{item.l}</div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={handleLog} disabled={saving} className="btn-pink w-full py-3">
              {saving ? "✧ Logging... ✧" : "✧ Log Food ✧"}
            </button>
            {selected.kind === "food" && (
              <button onClick={handleAddRecurring} disabled={saving || !amount} className="btn-blue w-full">
                ✧ Add as daily ({mealOptions.find(o => o.v === meal)?.l ?? meal})
              </button>
            )}
          </div>
        </Window>
      )}

      <div className="text-center flex justify-center gap-2 flex-wrap">
        <button onClick={() => setShowCustom(!showCustom)} className="btn-blue btn-sm">
          {showCustom ? "cancel" : "✧ Add Custom Food ✧"}
        </button>
        {myFoods.length > 0 && (
          <button onClick={() => setShowManage(!showManage)} className="btn-blue btn-sm">
            {showManage ? "hide" : `✧ My Foods (${myFoods.length}) ✧`}
          </button>
        )}
        <button onClick={() => setShowRecurring(!showRecurring)} className="btn-blue btn-sm">
          {showRecurring ? "hide" : `✧ Recurring${recurring.length ? ` (${recurring.length})` : ""} ✧`}
        </button>
      </div>

      {showRecurring && (
        <Window title="🔁 Daily Recurring">
          <p className="text-xs mb-2" style={{ color: "#9b80b8" }}>
            Auto-logs each day. Add by picking a food above, setting amount/meal, then tapping <strong>Add as daily</strong>. Today&apos;s logs are created when you open this page.
          </p>
          {recurring.length === 0 ? (
            <p className="vt-text text-center py-3">none yet ~</p>
          ) : (
            <div className="space-y-1">
              {recurring.map(r => (
                <div key={r.id} className="list-row">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {r.food?.name ?? "(deleted food)"}
                    </div>
                    <div className="text-[10px]" style={{ color: "#9b80b8" }}>
                      {r.amount}{r.food?.unit ?? "g"} · {mealOptions.find(o => o.v === r.meal)?.l ?? r.meal}
                      {r.food && ` · ~${Math.round(r.food.calories * r.amount / 100)} kcal`}
                    </div>
                  </div>
                  <button onClick={() => handleRemoveRecurring(r.id)} className="delete-btn" title="Stop recurring">×</button>
                </div>
              ))}
            </div>
          )}
        </Window>
      )}

      {showManage && myFoods.length > 0 && (
        <Window title="✧ My Custom Foods">
          <p className="text-xs mb-2" style={{ color: "#9b80b8" }}>
            Foods you added. Removing hides one from search; existing logs stay intact with their original macros.
          </p>
          <div className="space-y-1" style={{ maxHeight: 360, overflowY: "auto" }}>
            {myFoods
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(food => (
                <div key={`mine-${food.id}`} className="list-row">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{food.name}</div>
                    <div className="text-[10px]" style={{ color: "#9b80b8" }}>
                      {food.brand && food.brand !== "Custom" ? `${food.brand} · ` : ""}
                      {Math.round(food.calories * food.serving / 100)} kcal / {food.serving}{food.unit}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFood(food)}
                    className="delete-btn"
                    title="Remove this food"
                  >×</button>
                </div>
              ))}
          </div>
        </Window>
      )}

      {showCustom && (
        <Window title="✧ Custom Food">
          <div className="space-y-3">
            <p className="text-xs" style={{ color: "#9b80b8" }}>
              Saves to your foods. Then search for it above to log a serving — pick your portion before logging.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Name</label>
                <input type="text" value={custom.name} onChange={e => setCustom(c => ({ ...c, name: e.target.value }))}
                  className="input w-full" placeholder="e.g. Greek Yogurt" />
              </div>
              <div>
                <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Brand (optional)</label>
                <input type="text" value={custom.brand} onChange={e => setCustom(c => ({ ...c, brand: e.target.value }))}
                  className="input w-full" placeholder="e.g. Fage" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Calories (per serving)</label>
                <input type="number" value={custom.calories} onChange={e => setCustom(c => ({ ...c, calories: e.target.value }))}
                  className="input w-full" placeholder="kcal" />
              </div>
              <div>
                <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Serving size (g)</label>
                <input type="number" value={custom.serving} onChange={e => setCustom(c => ({ ...c, serving: e.target.value }))}
                  className="input w-full" placeholder="100" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Protein</label>
                <input type="number" value={custom.protein} onChange={e => setCustom(c => ({ ...c, protein: e.target.value }))}
                  className="input w-full" placeholder="g" />
              </div>
              <div>
                <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Carbs</label>
                <input type="number" value={custom.carbs} onChange={e => setCustom(c => ({ ...c, carbs: e.target.value }))}
                  className="input w-full" placeholder="g" />
              </div>
              <div>
                <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Fat</label>
                <input type="number" value={custom.fat} onChange={e => setCustom(c => ({ ...c, fat: e.target.value }))}
                  className="input w-full" placeholder="g" />
              </div>
            </div>
            <button onClick={handleSaveCustom} disabled={saving || !custom.name || !custom.calories} className="btn-pink w-full py-3">
              {saving ? "✧ Saving... ✧" : "✧ Save to My Foods ✧"}
            </button>
          </div>
        </Window>
      )}

      <div className="text-center py-6">
        <p className="vt-text">search for a food above to get started ~*</p>
        <p className="pixel-label mt-2" style={{ fontSize: "8px" }}>{foods.length} foods in database ✦</p>
      </div>
    </div>
  );
}
