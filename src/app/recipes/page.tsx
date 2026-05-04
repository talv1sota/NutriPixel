"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Window from "@/components/Window";

interface Recipe {
  id: number;
  title: string;
  description: string | null;
  sourceUrl: string | null;
  image: string | null;
  servings: string | null;
  prepTime: string | null;
  cookTime: string | null;
  totalTime: string | null;
  ingredients: string;
  instructions: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

const emptyManual = {
  title: "",
  description: "",
  servings: "",
  prepTime: "",
  cookTime: "",
  ingredients: "",
  instructions: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
};

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [open, setOpen] = useState<Recipe | null>(null);
  const [mode, setMode] = useState<"url" | "manual">("url");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const [manual, setManual] = useState({ ...emptyManual });
  const [editId, setEditId] = useState<number | null>(null);

  const fetchRecipes = useCallback(async () => {
    const res = await fetch("/api/recipes");
    setRecipes(await res.json());
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const notify = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(""), 2200);
  };

  const importFromUrl = async () => {
    if (!url) return;
    setLoading(true);
    setError("");
    try {
      const parseRes = await fetch("/api/recipes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!parseRes.ok) {
        const e = await parseRes.json();
        throw new Error(e.error || "Could not parse recipe");
      }
      const parsed = await parseRes.json();
      const saveRes = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (!saveRes.ok) throw new Error("Save failed");
      setUrl("");
      notify(`Imported ${parsed.title}!`);
      fetchRecipes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const saveManual = async () => {
    if (!manual.title || !manual.ingredients || !manual.instructions) {
      setError("Title, ingredients, and instructions are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        title: manual.title,
        description: manual.description || undefined,
        servings: manual.servings || undefined,
        prepTime: manual.prepTime || undefined,
        cookTime: manual.cookTime || undefined,
        ingredients: manual.ingredients.split("\n").map((s) => s.trim()).filter(Boolean),
        instructions: manual.instructions.split("\n").map((s) => s.trim()).filter(Boolean),
        calories: manual.calories ? parseFloat(manual.calories) : undefined,
        protein: manual.protein ? parseFloat(manual.protein) : undefined,
        carbs: manual.carbs ? parseFloat(manual.carbs) : undefined,
        fat: manual.fat ? parseFloat(manual.fat) : undefined,
      };
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      setManual({ ...emptyManual });
      notify(`Saved ${payload.title}!`);
      fetchRecipes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (r: Recipe) => {
    setEditId(r.id);
    setManual({
      title: r.title,
      description: r.description || "",
      servings: r.servings || "",
      prepTime: r.prepTime || "",
      cookTime: r.cookTime || "",
      ingredients: r.ingredients,
      instructions: r.instructions,
      calories: r.calories != null ? String(r.calories) : "",
      protein: r.protein != null ? String(r.protein) : "",
      carbs: r.carbs != null ? String(r.carbs) : "",
      fat: r.fat != null ? String(r.fat) : "",
    });
    setMode("manual");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveManualOrEdit = async () => {
    if (editId) {
      if (!manual.title) { setError("Title is required"); return; }
      setLoading(true);
      setError("");
      try {
        const payload = {
          id: editId,
          title: manual.title,
          description: manual.description || null,
          servings: manual.servings || null,
          prepTime: manual.prepTime || null,
          cookTime: manual.cookTime || null,
          ingredients: manual.ingredients.split("\n").map(s => s.trim()).filter(Boolean),
          instructions: manual.instructions.split("\n").map(s => s.trim()).filter(Boolean),
          calories: manual.calories ? parseFloat(manual.calories) : null,
          protein: manual.protein ? parseFloat(manual.protein) : null,
          carbs: manual.carbs ? parseFloat(manual.carbs) : null,
          fat: manual.fat ? parseFloat(manual.fat) : null,
        };
        const res = await fetch("/api/recipes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Save failed");
        setManual({ ...emptyManual });
        setEditId(null);
        notify(`Updated ${payload.title}!`);
        fetchRecipes();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      } finally {
        setLoading(false);
      }
    } else {
      await saveManual();
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setManual({ ...emptyManual });
    setError("");
  };

  const del = async (id: number) => {
    await fetch(`/api/recipes?id=${id}`, { method: "DELETE" });
    if (open?.id === id) setOpen(null);
    fetchRecipes();
  };

  return (
    <div className="space-y-5 pt-3 max-w-2xl mx-auto">
      <div className="pixel-label text-center" style={{ fontSize: "10px" }}>✧ Recipes ✧</div>

      {flash && (
        <div className="window slidein" style={{ borderColor: "#6bcb77" }}>
          <div className="window-body text-center font-bold" style={{ color: "#2d8a4e", padding: "10px" }}>
            ✦ {flash} ✦
          </div>
        </div>
      )}

      <Window title={editId ? "📝 Edit Recipe" : "📖 Add Recipe"}>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => { setMode("url"); setError(""); }}
            className={`btn-sm flex-1 ${mode === "url" ? "btn-pink" : "btn-blue"}`}
          >
            🔗 From URL
          </button>
          <button
            onClick={() => { setMode("manual"); setError(""); }}
            className={`btn-sm flex-1 ${mode === "manual" ? "btn-pink" : "btn-blue"}`}
          >
            ✍️ Manual
          </button>
        </div>

        {mode === "url" ? (
          <div className="space-y-3">
            <div>
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Recipe URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="input"
              />
            </div>
            <button onClick={importFromUrl} disabled={loading} className="btn-pink w-full py-3">
              {loading ? "✧ Parsing... ✧" : "✧ Import Recipe ✧"}
            </button>
            <p className="text-xs text-center" style={{ color: "#9b80b8" }}>
              Works with most recipe blogs (schema.org Recipe data)
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Title *</label>
              <input type="text" value={manual.title}
                onChange={(e) => setManual({ ...manual, title: e.target.value })}
                className="input" />
            </div>
            <div>
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Description</label>
              <input type="text" value={manual.description}
                onChange={(e) => setManual({ ...manual, description: e.target.value })}
                className="input" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Servings</label>
                <input type="text" value={manual.servings}
                  onChange={(e) => setManual({ ...manual, servings: e.target.value })}
                  className="input" placeholder="4" />
              </div>
              <div className="flex-1">
                <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Prep</label>
                <input type="text" value={manual.prepTime}
                  onChange={(e) => setManual({ ...manual, prepTime: e.target.value })}
                  className="input" placeholder="10 min" />
              </div>
              <div className="flex-1">
                <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Cook</label>
                <input type="text" value={manual.cookTime}
                  onChange={(e) => setManual({ ...manual, cookTime: e.target.value })}
                  className="input" placeholder="20 min" />
              </div>
            </div>
            <div>
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Ingredients * (one per line)</label>
              <textarea value={manual.ingredients}
                onChange={(e) => setManual({ ...manual, ingredients: e.target.value })}
                className="input" rows={5}
                placeholder="1 cup flour&#10;2 eggs&#10;..." />
            </div>
            <div>
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Instructions * (one step per line)</label>
              <textarea value={manual.instructions}
                onChange={(e) => setManual({ ...manual, instructions: e.target.value })}
                className="input" rows={5}
                placeholder="Mix dry ingredients.&#10;Add eggs.&#10;..." />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Cal/serving</label>
                <input type="number" value={manual.calories}
                  onChange={(e) => setManual({ ...manual, calories: e.target.value })}
                  className="input" />
              </div>
              <div className="flex-1">
                <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>P</label>
                <input type="number" value={manual.protein}
                  onChange={(e) => setManual({ ...manual, protein: e.target.value })}
                  className="input" />
              </div>
              <div className="flex-1">
                <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>C</label>
                <input type="number" value={manual.carbs}
                  onChange={(e) => setManual({ ...manual, carbs: e.target.value })}
                  className="input" />
              </div>
              <div className="flex-1">
                <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>F</label>
                <input type="number" value={manual.fat}
                  onChange={(e) => setManual({ ...manual, fat: e.target.value })}
                  className="input" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={saveManualOrEdit} disabled={loading} className="btn-pink flex-1 py-3">
                {editId ? "✧ Update Recipe ✧" : "✧ Save Recipe ✧"}
              </button>
              {editId && (
                <button onClick={cancelEdit} className="btn-blue py-3" style={{ padding: "0 16px" }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 text-xs text-center font-bold" style={{ color: "#c43" }}>
            ⚠ {error}
          </div>
        )}
      </Window>

      <Window title={`🍳 Recipe Book (${recipes.length})`}>
        {recipes.length === 0 ? (
          <p className="text-center text-sm" style={{ color: "#9b80b8" }}>
            No recipes yet. Paste a URL above to get started!
          </p>
        ) : (
          <div className="space-y-2">
            {recipes.map((r) => (
              <div key={r.id} className="list-row" style={{ alignItems: "flex-start", gap: 10 }}>
                <button onClick={() => setOpen(r)} className="flex-1 text-left" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <div className="font-semibold" style={{ color: "#4a2d6b" }}>{r.title}</div>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {r.servings && <span className="badge">{r.servings}</span>}
                    {r.totalTime && <span className="badge">⏱ {r.totalTime}</span>}
                    {r.calories != null && <span className="badge">{Math.round(r.calories)} kcal</span>}
                  </div>
                </button>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(r)} className="btn-blue btn-sm" style={{ fontSize: 9, padding: "3px 6px" }}>edit</button>
                  <button onClick={() => del(r.id)} className="delete-btn">×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Window>

      {open && <RecipeModal recipe={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function RecipeModal({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const ings = recipe.ingredients.split("\n").filter(Boolean);
  const steps = recipe.instructions.split("\n").filter(Boolean);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(75, 40, 110, 0.55)",
        zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 12px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="window slidein"
        style={{
          maxWidth: 560, width: "100%",
          maxHeight: "calc(100vh - 48px)",
          display: "flex", flexDirection: "column",
        }}
      >
        <div className="window-title" style={{ flexShrink: 0 }}>
          <span>📖 {recipe.title}</span>
          <button onClick={onClose} className="delete-btn" style={{ color: "white", fontSize: 18 }}>×</button>
        </div>
        <div className="window-body space-y-4" style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          {recipe.description && (
            <p className="text-sm italic" style={{ color: "#7a5a9e" }}>{recipe.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {recipe.servings && <span className="badge">🍽 {recipe.servings}</span>}
            {recipe.prepTime && <span className="badge">Prep {recipe.prepTime}</span>}
            {recipe.cookTime && <span className="badge">Cook {recipe.cookTime}</span>}
            {recipe.totalTime && <span className="badge">⏱ {recipe.totalTime}</span>}
          </div>

          {(recipe.calories != null || recipe.protein != null) && (
            <div className="stat-box" style={{ padding: 10 }}>
              <div className="pixel-label mb-2" style={{ fontSize: 7 }}>Per serving</div>
              <div className="flex justify-around text-xs font-bold">
                {recipe.calories != null && <div><div style={{ color: "#6bcb77" }}>{Math.round(recipe.calories)}</div><div style={{ fontSize: 9 }}>kcal</div></div>}
                {recipe.protein != null && <div><div style={{ color: "#5bb8e8" }}>{recipe.protein}g</div><div style={{ fontSize: 9 }}>protein</div></div>}
                {recipe.carbs != null && <div><div style={{ color: "#ffc145" }}>{recipe.carbs}g</div><div style={{ fontSize: 9 }}>carbs</div></div>}
                {recipe.fat != null && <div><div style={{ color: "#ff69b4" }}>{recipe.fat}g</div><div style={{ fontSize: 9 }}>fat</div></div>}
              </div>
            </div>
          )}

          <div>
            <div className="pixel-label mb-2" style={{ fontSize: 8 }}>✧ Ingredients ✧</div>
            <ul className="text-sm space-y-1">
              {ings.map((i, idx) => (
                <li key={idx} style={{ paddingLeft: 22, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, color: "#e84d98" }}>✦</span>{i}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="pixel-label mb-2" style={{ fontSize: 8 }}>✧ Instructions ✧</div>
            <ol className="text-sm space-y-2">
              {steps.map((s, idx) => (
                <li key={idx} style={{ paddingLeft: 22, position: "relative" }}>
                  <span style={{
                    position: "absolute", left: 0, top: 0,
                    background: "#9b5de5", color: "white",
                    borderRadius: "50%", width: 16, height: 16,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700,
                  }}>{idx + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          {recipe.sourceUrl && (
            <div className="text-xs text-center">
              <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "#9b5de5" }}>
                source ↗
              </a>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
