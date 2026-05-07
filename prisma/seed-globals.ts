import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";

const url = new URL(process.env.DATABASE_URL!);
url.searchParams.delete("channel_binding");
url.searchParams.delete("sslmode");
const prisma = new PrismaClient({ adapter: new PrismaNeonHTTP(url.toString(), {}) });

// Adds widely-used foods as global (userId = null) to the shared pool.
// All macros are per 100g/100ml; serving is the typical single-serving size.
// Skips any name that already exists (case-insensitive) so re-runs are safe.
const foods = [
  // Seafood
  { name: "Halibut (cooked)", calories: 111, protein: 23, carbs: 0, fat: 1.5, serving: 150, unit: "g" },
  { name: "Mackerel (cooked)", calories: 262, protein: 24, carbs: 0, fat: 18, serving: 100, unit: "g" },
  { name: "Sardines (canned in oil, drained)", calories: 208, protein: 25, carbs: 0, fat: 11, serving: 92, unit: "g" },
  { name: "Anchovies (canned, drained)", calories: 191, protein: 29, carbs: 0, fat: 8, serving: 28, unit: "g" },
  { name: "Scallops (cooked)", calories: 111, protein: 21, carbs: 5, fat: 1, serving: 85, unit: "g" },
  { name: "Lobster (cooked)", calories: 89, protein: 19, carbs: 0, fat: 1, serving: 145, unit: "g" },
  { name: "Crab Meat (lump)", calories: 87, protein: 18, carbs: 0, fat: 1, serving: 85, unit: "g" },
  { name: "Smoked Salmon (lox)", calories: 117, protein: 18, carbs: 0, fat: 4.3, serving: 28, unit: "g" },
  { name: "Oysters (raw)", calories: 68, protein: 7, carbs: 4, fat: 2.5, serving: 100, unit: "g" },
  { name: "Mussels (cooked)", calories: 172, protein: 24, carbs: 7, fat: 4.5, serving: 100, unit: "g" },

  // Fruits
  { name: "Kiwi", calories: 61, protein: 1.1, carbs: 15, fat: 0.5, fiber: 3, sugar: 9, serving: 75, unit: "g" },
  { name: "Pomegranate Seeds", calories: 83, protein: 1.7, carbs: 19, fat: 1.2, fiber: 4, sugar: 14, serving: 87, unit: "g" },
  { name: "Papaya", calories: 43, protein: 0.5, carbs: 11, fat: 0.3, fiber: 1.7, sugar: 7.8, serving: 145, unit: "g" },
  { name: "Apricot", calories: 48, protein: 1.4, carbs: 11, fat: 0.4, fiber: 2, sugar: 9, serving: 35, unit: "g" },
  { name: "Blackberries", calories: 43, protein: 1.4, carbs: 10, fat: 0.5, fiber: 5.3, sugar: 4.9, serving: 144, unit: "g" },
  { name: "Plum", calories: 46, protein: 0.7, carbs: 11, fat: 0.3, fiber: 1.4, sugar: 9.9, serving: 66, unit: "g" },
  { name: "Lemon", calories: 29, protein: 1.1, carbs: 9, fat: 0.3, fiber: 2.8, sugar: 2.5, serving: 58, unit: "g" },
  { name: "Lime", calories: 30, protein: 0.7, carbs: 11, fat: 0.2, fiber: 2.8, sugar: 1.7, serving: 67, unit: "g" },
  { name: "Grapefruit", calories: 42, protein: 0.8, carbs: 11, fat: 0.1, fiber: 1.6, sugar: 7, serving: 154, unit: "g" },
  { name: "Cantaloupe", calories: 34, protein: 0.8, carbs: 8, fat: 0.2, fiber: 0.9, sugar: 7.9, serving: 160, unit: "g" },
  { name: "Honeydew Melon", calories: 36, protein: 0.5, carbs: 9, fat: 0.1, fiber: 0.8, sugar: 8.1, serving: 170, unit: "g" },
  { name: "Medjool Dates", calories: 277, protein: 1.8, carbs: 75, fat: 0.2, fiber: 6.7, sugar: 66, serving: 24, unit: "g" },
  { name: "Fig (fresh)", calories: 74, protein: 0.8, carbs: 19, fat: 0.3, fiber: 2.9, sugar: 16, serving: 50, unit: "g" },
  { name: "Nectarine", calories: 44, protein: 1.1, carbs: 10, fat: 0.3, fiber: 1.7, sugar: 7.9, serving: 142, unit: "g" },

  // Vegetables
  { name: "Green Cabbage", calories: 25, protein: 1.3, carbs: 5.8, fat: 0.1, fiber: 2.5, sugar: 3.2, serving: 89, unit: "g" },
  { name: "Eggplant (cooked)", calories: 33, protein: 0.8, carbs: 8.6, fat: 0.2, fiber: 2.5, sugar: 3.2, serving: 99, unit: "g" },
  { name: "Green Peas (cooked)", calories: 84, protein: 5.4, carbs: 16, fat: 0.2, fiber: 5.5, sugar: 5.9, serving: 160, unit: "g" },
  { name: "Garlic (clove)", calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1, sugar: 1, serving: 3, unit: "g" },
  { name: "Jalapeño Pepper", calories: 27, protein: 1, carbs: 6, fat: 0.4, fiber: 2.8, sugar: 4, serving: 14, unit: "g" },
  { name: "Celery (stalk)", calories: 16, protein: 0.7, carbs: 3, fat: 0.2, fiber: 1.6, sugar: 1.3, serving: 40, unit: "g" },
  { name: "Beet (cooked)", calories: 44, protein: 1.7, carbs: 10, fat: 0.2, fiber: 2, sugar: 8, serving: 136, unit: "g" },
  { name: "Radish", calories: 16, protein: 0.7, carbs: 3.4, fat: 0.1, fiber: 1.6, sugar: 1.9, serving: 116, unit: "g" },
  { name: "Artichoke (cooked)", calories: 53, protein: 2.9, carbs: 12, fat: 0.3, fiber: 5.7, sugar: 1, serving: 120, unit: "g" },
  { name: "Bok Choy (cooked)", calories: 12, protein: 1.6, carbs: 1.8, fat: 0.2, fiber: 0.7, sugar: 0.8, serving: 170, unit: "g" },
  { name: "Brussels Sprouts (cooked)", calories: 36, protein: 2.6, carbs: 7.1, fat: 0.5, fiber: 2.6, sugar: 1.7, serving: 156, unit: "g" },
  { name: "Iceberg Lettuce", calories: 14, protein: 0.9, carbs: 3, fat: 0.1, fiber: 1.2, sugar: 2, serving: 72, unit: "g" },
  { name: "Mixed Greens (spring mix)", calories: 20, protein: 1.5, carbs: 3.5, fat: 0.3, fiber: 1.8, sugar: 0.6, serving: 30, unit: "g" },
  { name: "Snap Peas", calories: 42, protein: 2.8, carbs: 7.5, fat: 0.2, fiber: 2.6, sugar: 4, serving: 98, unit: "g" },
  { name: "Arugula", calories: 25, protein: 2.6, carbs: 3.7, fat: 0.7, fiber: 1.6, sugar: 2, serving: 20, unit: "g" },
  { name: "Red Cabbage", calories: 31, protein: 1.4, carbs: 7.4, fat: 0.2, fiber: 2.1, sugar: 3.8, serving: 89, unit: "g" },

  // Grains & Starches
  { name: "Russet Potato (baked)", calories: 93, protein: 2.5, carbs: 21, fat: 0.1, fiber: 2.2, sugar: 1.2, serving: 173, unit: "g" },
  { name: "Red Potato (boiled)", calories: 89, protein: 2, carbs: 20, fat: 0.1, fiber: 1.8, sugar: 1.3, serving: 150, unit: "g" },
  { name: "Hash Browns", calories: 326, protein: 3, carbs: 32, fat: 21, fiber: 3, sugar: 0.5, serving: 100, unit: "g" },
  { name: "Couscous (cooked)", calories: 112, protein: 3.8, carbs: 23, fat: 0.2, fiber: 1.4, sugar: 0, serving: 157, unit: "g" },
  { name: "Farro (cooked)", calories: 170, protein: 6, carbs: 35, fat: 1, fiber: 5, sugar: 0, serving: 200, unit: "g" },
  { name: "Barley (cooked)", calories: 123, protein: 2.3, carbs: 28, fat: 0.4, fiber: 3.8, sugar: 0.3, serving: 157, unit: "g" },
  { name: "Bulgur (cooked)", calories: 83, protein: 3.1, carbs: 19, fat: 0.2, fiber: 4.5, sugar: 0.1, serving: 182, unit: "g" },
  { name: "Croissant", calories: 406, protein: 8.2, carbs: 46, fat: 21, fiber: 2.6, sugar: 11, serving: 67, unit: "g" },
  { name: "Dinner Roll", calories: 286, protein: 9, carbs: 49, fat: 5, fiber: 2.3, sugar: 5, serving: 28, unit: "g" },
  { name: "Pita Bread", calories: 275, protein: 9.1, carbs: 56, fat: 1.2, fiber: 2.2, sugar: 1.3, serving: 60, unit: "g" },
  { name: "Naan", calories: 310, protein: 9, carbs: 50, fat: 8, fiber: 2.2, sugar: 4, serving: 90, unit: "g" },
  { name: "Biscuit (homestyle)", calories: 353, protein: 7, carbs: 45, fat: 16, fiber: 1.5, sugar: 5, serving: 60, unit: "g" },

  // Legumes
  { name: "Pinto Beans (cooked)", calories: 143, protein: 9, carbs: 26, fat: 0.7, fiber: 9, sugar: 0.3, serving: 171, unit: "g" },
  { name: "Kidney Beans (cooked)", calories: 127, protein: 8.7, carbs: 23, fat: 0.5, fiber: 6.4, sugar: 0.3, serving: 177, unit: "g" },
  { name: "Navy Beans (cooked)", calories: 140, protein: 8.2, carbs: 26, fat: 0.6, fiber: 10.5, sugar: 0.4, serving: 182, unit: "g" },
  { name: "Lima Beans (cooked)", calories: 115, protein: 7.8, carbs: 21, fat: 0.4, fiber: 7, sugar: 1.4, serving: 188, unit: "g" },
  { name: "Refried Beans", calories: 104, protein: 6, carbs: 18, fat: 1, fiber: 6, sugar: 0.4, serving: 124, unit: "g" },

  // Dairy & Milk Alternatives
  { name: "2% Milk", calories: 50, protein: 3.3, carbs: 4.8, fat: 2, fiber: 0, sugar: 5, serving: 240, unit: "ml" },
  { name: "Soy Milk (unsweetened)", calories: 33, protein: 3.3, carbs: 1.8, fat: 1.8, fiber: 0.4, sugar: 0, serving: 240, unit: "ml" },
  { name: "Coconut Milk (canned)", calories: 230, protein: 2.3, carbs: 6, fat: 24, fiber: 2.2, sugar: 3.3, serving: 100, unit: "ml" },
  { name: "Coconut Milk (carton, unsweetened)", calories: 19, protein: 0.4, carbs: 1, fat: 1.7, fiber: 0, sugar: 0, serving: 240, unit: "ml" },
  { name: "Half and Half", calories: 130, protein: 3.6, carbs: 4.3, fat: 11.5, fiber: 0, sugar: 4.3, serving: 30, unit: "ml" },
  { name: "Ricotta (whole milk)", calories: 174, protein: 11, carbs: 3, fat: 13, fiber: 0, sugar: 0.3, serving: 124, unit: "g" },
  { name: "Swiss Cheese", calories: 380, protein: 27, carbs: 5.4, fat: 28, fiber: 0, sugar: 1.3, serving: 28, unit: "g" },
  { name: "Blue Cheese", calories: 353, protein: 21, carbs: 2.3, fat: 29, fiber: 0, sugar: 0.5, serving: 28, unit: "g" },
  { name: "Monterey Jack", calories: 373, protein: 24, carbs: 0.7, fat: 30, fiber: 0, sugar: 0.5, serving: 28, unit: "g" },
  { name: "Brie", calories: 334, protein: 21, carbs: 0.5, fat: 28, fiber: 0, sugar: 0.5, serving: 28, unit: "g" },
  { name: "Goat Cheese (soft)", calories: 264, protein: 18, carbs: 2.5, fat: 21, fiber: 0, sugar: 2.5, serving: 28, unit: "g" },

  // Nuts & Seeds
  { name: "Pecans", calories: 691, protein: 9, carbs: 14, fat: 72, fiber: 9.6, sugar: 4, serving: 28, unit: "g" },
  { name: "Pistachios (shelled)", calories: 560, protein: 20, carbs: 28, fat: 45, fiber: 10.6, sugar: 7.7, serving: 28, unit: "g" },
  { name: "Sunflower Seeds", calories: 584, protein: 21, carbs: 20, fat: 51, fiber: 8.6, sugar: 2.6, serving: 28, unit: "g" },
  { name: "Pumpkin Seeds", calories: 559, protein: 30, carbs: 11, fat: 49, fiber: 6, sugar: 1.4, serving: 28, unit: "g" },
  { name: "Chia Seeds", calories: 486, protein: 17, carbs: 42, fat: 31, fiber: 34, sugar: 0, serving: 14, unit: "g" },
  { name: "Flax Seeds (ground)", calories: 534, protein: 18, carbs: 29, fat: 42, fiber: 27, sugar: 1.6, serving: 7, unit: "g" },
  { name: "Hemp Seeds", calories: 553, protein: 32, carbs: 9, fat: 49, fiber: 4, sugar: 1.5, serving: 30, unit: "g" },

  // Oils
  { name: "Coconut Oil", calories: 862, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, serving: 14, unit: "g" },
  { name: "Sesame Oil", calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, serving: 14, unit: "ml" },
  { name: "Avocado Oil", calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, serving: 14, unit: "ml" },

  // Condiments & Sauces
  { name: "Salsa (medium)", calories: 36, protein: 1.5, carbs: 7, fat: 0.2, fiber: 1.7, sugar: 4, serving: 32, unit: "g" },
  { name: "BBQ Sauce", calories: 172, protein: 0.5, carbs: 41, fat: 0.3, fiber: 0.6, sugar: 33, serving: 34, unit: "g" },
  { name: "Sriracha", calories: 93, protein: 1.9, carbs: 19, fat: 1, fiber: 2.2, sugar: 14, serving: 17, unit: "g" },
  { name: "Balsamic Vinegar", calories: 88, protein: 0.5, carbs: 17, fat: 0, fiber: 0, sugar: 15, serving: 16, unit: "g" },
  { name: "Dijon Mustard", calories: 60, protein: 4, carbs: 6, fat: 3.5, fiber: 4, sugar: 0, serving: 5, unit: "g" },
  { name: "Tahini", calories: 595, protein: 17, carbs: 21, fat: 54, fiber: 9.3, sugar: 0.5, serving: 15, unit: "g" },
  { name: "Almond Butter", calories: 614, protein: 21, carbs: 19, fat: 56, fiber: 10, sugar: 4.4, serving: 32, unit: "g" },
  { name: "Strawberry Jam", calories: 248, protein: 0.4, carbs: 65, fat: 0.1, fiber: 1, sugar: 49, serving: 20, unit: "g" },
  { name: "Agave Nectar", calories: 310, protein: 0, carbs: 76, fat: 0.5, fiber: 0.2, sugar: 68, serving: 21, unit: "g" },
  { name: "Hot Sauce (Frank's RedHot)", calories: 24, protein: 1, carbs: 4.6, fat: 0.7, fiber: 1, sugar: 0.4, serving: 5, unit: "g" },

  // Snacks
  { name: "Pretzels", calories: 380, protein: 10, carbs: 80, fat: 3, fiber: 3, sugar: 2, serving: 28, unit: "g" },
  { name: "Popcorn (buttered)", calories: 480, protein: 8, carbs: 56, fat: 26, fiber: 9, sugar: 0.6, serving: 28, unit: "g" },
  { name: "Beef Jerky", calories: 410, protein: 33, carbs: 11, fat: 26, fiber: 1.8, sugar: 9, serving: 28, unit: "g" },
  { name: "Trail Mix", calories: 480, protein: 14, carbs: 45, fat: 30, fiber: 5, sugar: 25, serving: 30, unit: "g" },

  // Sweets
  { name: "Brownie", calories: 466, protein: 6, carbs: 64, fat: 22, fiber: 2.5, sugar: 42, serving: 56, unit: "g" },
  { name: "Cinnamon Roll", calories: 380, protein: 6.6, carbs: 55, fat: 14, fiber: 2, sugar: 27, serving: 110, unit: "g" },
  { name: "Milk Chocolate", calories: 535, protein: 7.6, carbs: 59, fat: 30, fiber: 3.4, sugar: 52, serving: 40, unit: "g" },

  // Beverages
  { name: "Water", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, serving: 240, unit: "ml" },
  { name: "Kombucha", calories: 30, protein: 0, carbs: 7, fat: 0, fiber: 0, sugar: 5, serving: 240, unit: "ml" },
  { name: "White Wine", calories: 82, protein: 0.1, carbs: 2.6, fat: 0, fiber: 0, sugar: 1, serving: 148, unit: "ml" },
  { name: "Light Beer", calories: 28, protein: 0.2, carbs: 1.6, fat: 0, fiber: 0, sugar: 0.3, serving: 355, unit: "ml" },
  { name: "Fruit Smoothie", calories: 65, protein: 1, carbs: 15, fat: 0.4, fiber: 1.7, sugar: 12, serving: 240, unit: "ml" },
  { name: "Iced Tea (unsweetened)", calories: 1, protein: 0, carbs: 0.3, fat: 0, fiber: 0, sugar: 0, serving: 240, unit: "ml" },
  { name: "Sparkling Water", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, serving: 355, unit: "ml" },
  { name: "Black Tea", calories: 1, protein: 0, carbs: 0.3, fat: 0, fiber: 0, sugar: 0, serving: 240, unit: "ml" },
  { name: "Latte (whole milk)", calories: 39, protein: 2, carbs: 3, fat: 2, fiber: 0, sugar: 3, serving: 360, unit: "ml" },
];

async function main() {
  // Build a case-insensitive set of existing names
  const existing = await prisma.food.findMany({ select: { name: true } });
  const existingLower = new Set(existing.map(f => f.name.toLowerCase()));

  let added = 0, skipped = 0;
  for (const f of foods) {
    if (existingLower.has(f.name.toLowerCase())) {
      skipped++;
      continue;
    }
    await prisma.food.create({
      data: {
        name: f.name,
        brand: "Generic",
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        fiber: f.fiber ?? 0,
        sugar: f.sugar ?? 0,
        serving: f.serving,
        unit: f.unit,
        userId: null, // global
      },
    });
    added++;
  }
  console.log(`Added ${added} new global foods, skipped ${skipped} duplicates.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
