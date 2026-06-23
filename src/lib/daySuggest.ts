// Pure logic for the Suggested Days generator. Kept out of the page component so
// it can be unit-tested against real data.

export interface Per100 { calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; }
export interface PoolItem {
  name: string; brand: string | null; foodId: number | null; meal: string;
  amount: number; unit: string; per100: Per100; freq: number; cals: number;
}
export interface Chosen { item: PoolItem; amount: number; }
export interface MacroT { p?: number; c?: number; f?: number; }

export const MEALS = ["breakfast", "lunch", "dinner", "snack", "dessert"];

export function macrosOf(p: PoolItem, amount: number) {
  const k = amount / 100;
  return { cal: p.per100.calories * k, p: p.per100.protein * k, c: p.per100.carbs * k, f: p.per100.fat * k };
}

// Weighted random pick — sqrt(freq) softens the pull of very frequent foods so
// generated days still feel varied.
function weightedPick(cands: PoolItem[]): PoolItem | null {
  if (!cands.length) return null;
  const total = cands.reduce((s, c) => s + Math.sqrt(c.freq), 0);
  let r = Math.random() * total;
  for (const c of cands) { r -= Math.sqrt(c.freq); if (r <= 0) return c; }
  return cands[cands.length - 1];
}

// Randomized greedy, best-of-N: split the calorie target across meals by the
// user's historical distribution, fill each meal from foods they eat at that
// meal, scale the last item to fit, and keep the attempt closest to target
// (plus macro targets, if set).
export function generate(pool: PoolItem[], mealDist: Record<string, number>, T: number, macroT: MacroT | null): Chosen[] | null {
  const byMeal: Record<string, PoolItem[]> = {};
  for (const m of MEALS) byMeal[m] = pool.filter((p) => p.meal === m);
  const active = MEALS.filter((m) => byMeal[m].length);
  if (!active.length) return null;

  const distSum = active.reduce((s, m) => s + (mealDist[m] || 0), 0);
  const budget: Record<string, number> = {};
  for (const m of active) budget[m] = distSum > 0 ? (T * (mealDist[m] || 0)) / distSum : T / active.length;

  let best: { chosen: Chosen[]; score: number } | null = null;

  for (let attempt = 0; attempt < 250; attempt++) {
    const chosen: Chosen[] = [];
    for (const m of active) {
      const b = budget[m];
      if (b < 40) continue;
      const cands = byMeal[m].filter((p) => p.cals <= b * 1.8 + 60);
      if (!cands.length) continue;
      const used = new Set<string>();
      let spent = 0, guard = 0;
      while (spent < b * 0.8 && guard < 4) {
        guard++;
        const c = weightedPick(cands.filter((p) => !used.has(`${p.name}|${p.brand}`))); // no repeats within a meal
        if (!c) break;
        used.add(`${c.name}|${c.brand}`);
        let amt = c.amount;
        let cal = (c.per100.calories * amt) / 100;
        const remain = b - spent;
        if (cal > remain * 1.15) {
          if (remain < 25) break;
          amt = (amt * remain) / cal; cal = remain; // scale to fit remaining budget
        }
        chosen.push({ item: c, amount: amt });
        spent += cal;
      }
    }
    if (!chosen.length) continue;
    const tot = chosen.reduce((a, ci) => {
      const mm = macrosOf(ci.item, ci.amount);
      return { cal: a.cal + mm.cal, p: a.p + mm.p, c: a.c + mm.c, f: a.f + mm.f };
    }, { cal: 0, p: 0, c: 0, f: 0 });
    let score = Math.abs(tot.cal - T);
    if (macroT) {
      if (macroT.p) score += Math.abs(tot.p - macroT.p) * 4;
      if (macroT.c) score += Math.abs(tot.c - macroT.c) * 4;
      if (macroT.f) score += Math.abs(tot.f - macroT.f) * 9;
    }
    if (!best || score < best.score) best = { chosen, score };
    if (Math.abs(tot.cal - T) < Math.max(40, T * 0.04) && (!macroT || score < 60)) break;
  }
  if (!best) return null;

  // Nudge the whole day toward the target with one uniform scale (keeps meal
  // proportions; clamped so amounts stay realistic), then round to a tidy 5g/ml.
  const total = best.chosen.reduce((s, c) => s + macrosOf(c.item, c.amount).cal, 0);
  const factor = total > 0 ? Math.min(1.5, Math.max(0.7, T / total)) : 1;
  return best.chosen.map((c) => ({ ...c, amount: Math.max(5, Math.round((c.amount * factor) / 5) * 5) }));
}
