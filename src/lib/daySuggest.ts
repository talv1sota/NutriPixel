// Pure logic for the Suggested Days generator. Kept out of the page component so
// it can be unit-tested against real data.

export interface Per100 { calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; }
export type Category = "alcohol" | "drink" | "dessert" | "condiment" | "food";
export interface PoolItem {
  name: string; brand: string | null; foodId: number | null; meal: string; category: Category;
  amount: number; unit: string; per100: Per100; freq: number; cals: number;
}
export interface Chosen { item: PoolItem; amount: number; }
export interface MacroT { p?: number; c?: number; f?: number; }

export const MEALS = ["breakfast", "lunch", "dinner", "snack", "drinks", "dessert"];

// ---- Classification -------------------------------------------------------
// The meal a food was *logged* at isn't its category (wine logged with dinner
// is still a drink). Classify by name so we can place items sensibly: alcohol
// is dropped from day plans, drinks go to breakfast/snack, desserts to dessert.

// Non-alcoholic sodas that would otherwise trip the alcohol matcher.
const NON_ALC = /\b(ginger ale|root beer|non[- ]?alcoholic|mocktail|virgin)\b/;
const ALCOHOL = /\b(wine|rose|prosecco|champagne|merlot|cabernet|chardonnay|sauvignon|pinot|riesling|moscato|shiraz|malbec|sangria|beer|ipa|lager|stout|pilsner|pale ale|brown ale|cider|hard seltzer|white claw|truly|vodka|whiskey|whisky|bourbon|scotch|tequila|mezcal|rum|gin|brandy|cognac|martini|margarita|mojito|negroni|aperol|spritz|mimosa|cocktail|liqueur|kahlua|baileys|schnapps|rakija|sake|soju|amaretto|vermouth|absinthe)\b/;
const DESSERT = /\b(ice cream|gelato|sorbet|sherbet|frozen yogurt|froyo|cookie|brownie|cake|cheesecake|cupcake|pie|tart|donut|doughnut|candy|chocolate bar|praline|truffle|twizzler|gummy|gummies|marshmallow|fudge|toffee|macaron|macaroon|pudding|custard|tiramisu|milkshake|sundae|popsicle|wafer|biscotti|baklava|cannoli|eclair|mousse|skittles|m&m)\b/;
const DRINK = /\b(coffee|espresso|latte|cappuccino|macchiato|mocha|americano|cold brew|tea|chai|matcha|yerba|guayaki|juice|smoothie|soda|cola|coke|pepsi|sprite|fanta|lemonade|limeade|kombucha|seltzer|sparkling water|tonic|gatorade|powerade|energy drink|red bull|monster|milk|horchata|ginger ale|root beer|punch|protein shake|shake)\b/;
// Accompaniments that shouldn't stand alone as an item in a day (kept narrow so
// real foods like peanut butter, cream cheese, bell pepper aren't caught).
const CONDIMENT = /\b(ketchup|mustard|mayo|mayonnaise|dressing|vinaigrette|bouillon|broth|stock|seasoning|syrup|relish|gravy|hot sauce|soy sauce|sriracha|tabasco|aioli|sour cream|margarine|cooking spray|honey)\b/;

export function classify(name: string, brand: string | null): Category {
  // Strip accents so "Rosé"/"Kahlúa" match (a trailing accented letter breaks
  // the \b boundary), and drop parenthetical descriptors so a word inside them
  // doesn't drive the category (e.g. "Ricotta (whole milk)" isn't a drink,
  // "Crab appetizer (crab cake)" isn't a dessert).
  const s = `${name} ${brand ?? ""}`
    .toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\([^)]*\)/g, " ");
  if (!NON_ALC.test(s) && ALCOHOL.test(s)) return "alcohol";
  if (DESSERT.test(s)) return "dessert";
  if (DRINK.test(s)) return "drink";
  if (CONDIMENT.test(s)) return "condiment";
  // Plain butter is a condiment; peanut/almond/etc. butter is a real food.
  if (/\bbutter\b/.test(s) && !/\b(peanut|almond|cashew|hazelnut|nut|apple|cookie|sun|seed|shea|body) butter\b/.test(s)) return "condiment";
  return "food";
}

// Where an item should appear, given its category and the meal it's usually
// logged at.
function placeMeal(category: Category, modeMeal: string): string {
  if (category === "dessert") return "dessert";
  if (category === "drink") return "drinks";
  if (modeMeal === "dessert" || modeMeal === "supplement" || modeMeal === "drinks") return "snack"; // a real food mis-bucketed
  return modeMeal;
}

// ---- Pool building --------------------------------------------------------

export interface RawLog {
  name: string; brand: string | null; foodId: number | null;
  per100: Per100; amount: number; unit: string; meal: string; date: string;
}

// Aggregates raw logs (newest-first) into the candidate pool + meal split +
// recent-day calorie totals. Shared by the API route and the test harness.
export function buildPool(logs: RawLog[]) {
  type Acc = { name: string; brand: string | null; foodId: number | null; per100: Per100; amount: number; unit: string; mealCounts: Record<string, number>; freq: number };
  const byKey = new Map<string, Acc>();
  const byDate: Record<string, number> = {};

  for (const l of logs) {
    byDate[l.date] = (byDate[l.date] || 0) + (l.per100.calories * l.amount) / 100;
    if (!l.name || l.meal === "supplement") continue;
    const key = `${l.name}|${l.brand ?? ""}`.toLowerCase();
    let e = byKey.get(key);
    if (!e) {
      e = { name: l.name, brand: l.brand, foodId: l.foodId, per100: l.per100, amount: l.amount, unit: l.unit, mealCounts: {}, freq: 0 };
      byKey.set(key, e);
    }
    e.freq++;
    e.mealCounts[l.meal] = (e.mealCounts[l.meal] || 0) + 1;
    if (l.foodId != null && e.foodId == null) e.foodId = l.foodId;
  }

  const pool: PoolItem[] = [...byKey.values()]
    .map((e) => {
      const modeMeal = Object.entries(e.mealCounts).sort((a, b) => b[1] - a[1])[0][0];
      const category = classify(e.name, e.brand);
      return {
        name: e.name, brand: e.brand, foodId: e.foodId, category,
        meal: placeMeal(category, modeMeal),
        amount: Math.round(e.amount), unit: e.unit, per100: e.per100, freq: e.freq,
        cals: Math.round((e.per100.calories * e.amount) / 100),
      };
    })
    .filter((p) => p.cals >= 5);

  // Meal split from the placeable (non-alcohol) pool, weighted by how much /
  // how often each item is eaten — so budgets match the foods actually used.
  const mealWeight: Record<string, number> = {};
  for (const p of pool) if (p.category !== "alcohol") mealWeight[p.meal] = (mealWeight[p.meal] || 0) + p.cals * p.freq;
  const totalW = Object.values(mealWeight).reduce((s, v) => s + v, 0);
  const mealDist: Record<string, number> = {};
  for (const m of MEALS) mealDist[m] = totalW > 0 ? (mealWeight[m] || 0) / totalW : 0;

  const recentDays = Object.entries(byDate)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 7)
    .map(([date, calories]) => ({ date, calories: Math.round(calories) }));

  return { pool, mealDist, recentDays };
}

// ---- Generation -----------------------------------------------------------

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
// (plus macro targets, if set). Alcohol is never planned into a day.
export function generate(poolIn: PoolItem[], mealDist: Record<string, number>, T: number, macroT: MacroT | null): Chosen[] | null {
  // Alcohol and bare condiments are never planned into a day.
  const pool = poolIn.filter((p) => p.category !== "alcohol" && p.category !== "condiment");
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
      // Prefer items that are a meaningful share of the meal (so a dinner isn't
      // built from 12-cal garnishes); relax if that leaves too few choices.
      const minCal = Math.max(15, b * 0.12);
      let cands = byMeal[m].filter((p) => p.cals <= b * 1.8 + 60 && p.cals >= minCal);
      if (cands.length < 2) cands = byMeal[m].filter((p) => p.cals <= b * 1.8 + 60);
      if (!cands.length) continue;
      const used = new Set<string>();
      let spent = 0, guard = 0;
      while (spent < b * 0.8 && guard < 3) { // at most ~3 items per meal
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
