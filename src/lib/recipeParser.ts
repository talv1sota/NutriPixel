// Parses schema.org Recipe JSON-LD from a recipe URL.
// Most recipe blogs (WP Recipe Maker, Tasty Recipes, etc.) embed one.

type JsonLd = Record<string, unknown> | Record<string, unknown>[];

export interface ParsedRecipe {
  title: string;
  description?: string;
  sourceUrl: string;
  image?: string;
  servings?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  ingredients: string[];
  instructions: string[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
}

function isoDurationToText(iso?: string): string | undefined {
  if (!iso || typeof iso !== "string") return undefined;
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return iso;
  const h = parseInt(m[1] || "0");
  const min = parseInt(m[2] || "0");
  const parts: string[] = [];
  if (h) parts.push(`${h} hr`);
  if (min) parts.push(`${min} min`);
  return parts.join(" ") || undefined;
}

function firstString(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return firstString(v[0]);
  if (v && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    if (typeof obj.url === "string") return obj.url;
    if (typeof obj["@id"] === "string") return obj["@id"];
  }
  return undefined;
}

function toNumber(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return undefined;
  const m = v.match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : undefined;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, "")).trim();
}

function flattenInstructions(v: unknown): string[] {
  if (!v) return [];
  if (typeof v === "string") {
    return stripTags(v)
      .split(/\n+|\.\s+(?=[A-Z])/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(v)) {
    return v.flatMap(flattenInstructions);
  }
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    const t = obj["@type"];
    if (t === "HowToSection" && Array.isArray(obj.itemListElement)) {
      return flattenInstructions(obj.itemListElement);
    }
    if (typeof obj.text === "string") return [stripTags(obj.text)];
    if (typeof obj.name === "string") return [stripTags(obj.name)];
  }
  return [];
}

function findRecipeNode(data: JsonLd): Record<string, unknown> | null {
  const visit = (node: unknown): Record<string, unknown> | null => {
    if (!node) return null;
    if (Array.isArray(node)) {
      for (const n of node) {
        const found = visit(n);
        if (found) return found;
      }
      return null;
    }
    if (typeof node !== "object") return null;
    const obj = node as Record<string, unknown>;
    const t = obj["@type"];
    if (t === "Recipe" || (Array.isArray(t) && t.includes("Recipe"))) return obj;
    if (Array.isArray(obj["@graph"])) return visit(obj["@graph"]);
    return null;
  };
  return visit(data);
}

export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch recipe (${res.status})`);
  const html = await res.text();

  const blocks: Record<string, unknown>[] = [];
  // Match both quoted (type="application/ld+json") and unquoted
  // (type=application/ld+json) HTML5 attribute forms.
  const re = /<script[^>]*\btype\s*=\s*(?:["']?)application\/ld\+json(?:["']?)[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const json = JSON.parse(m[1].trim());
      blocks.push(json);
    } catch {
      // ignore invalid blocks
    }
  }

  let recipe: Record<string, unknown> | null = null;
  for (const b of blocks) {
    recipe = findRecipeNode(b as JsonLd);
    if (recipe) break;
  }
  if (!recipe) throw new Error("No schema.org Recipe data found on page");

  const ingredientsRaw = (recipe.recipeIngredient || recipe.ingredients) as unknown;
  const ingredients = Array.isArray(ingredientsRaw)
    ? ingredientsRaw.map((i) => stripTags(String(i))).filter(Boolean)
    : [];

  const instructions = flattenInstructions(recipe.recipeInstructions);

  const nut = (recipe.nutrition as Record<string, unknown>) || {};
  const yieldVal = recipe.recipeYield;
  let servings: string | undefined;
  if (Array.isArray(yieldVal)) {
    servings = yieldVal.find((y) => typeof y === "string" && /\D/.test(y)) as string | undefined;
    if (!servings) servings = String(yieldVal[0] || "");
  } else if (yieldVal) {
    servings = String(yieldVal);
  }

  return {
    title: stripTags(String(recipe.name || "Untitled")),
    description: recipe.description ? stripTags(String(recipe.description)) : undefined,
    sourceUrl: url,
    image: firstString(recipe.image),
    servings,
    prepTime: isoDurationToText(recipe.prepTime as string),
    cookTime: isoDurationToText(recipe.cookTime as string),
    totalTime: isoDurationToText(recipe.totalTime as string),
    ingredients,
    instructions,
    calories: toNumber(nut.calories),
    protein: toNumber(nut.proteinContent),
    carbs: toNumber(nut.carbohydrateContent),
    fat: toNumber(nut.fatContent),
    fiber: toNumber(nut.fiberContent),
    sugar: toNumber(nut.sugarContent),
  };
}
