import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

const foods = [
  // Proteins
  { name: "Chicken Breast", brand: "Generic", calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, serving: 150, unit: "g" },
  { name: "Salmon Fillet", brand: "Generic", calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sugar: 0, serving: 150, unit: "g" },
  { name: "Ground Beef (90% lean)", brand: "Generic", calories: 176, protein: 20, carbs: 0, fat: 10, fiber: 0, sugar: 0, serving: 150, unit: "g" },
  { name: "Eggs", brand: "Generic", calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, sugar: 1.1, serving: 50, unit: "g" },
  { name: "Turkey Breast", brand: "Generic", calories: 135, protein: 30, carbs: 0, fat: 1, fiber: 0, sugar: 0, serving: 150, unit: "g" },
  { name: "Tuna (canned)", brand: "Generic", calories: 116, protein: 26, carbs: 0, fat: 0.8, fiber: 0, sugar: 0, serving: 100, unit: "g" },
  { name: "Shrimp", brand: "Generic", calories: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0, sugar: 0, serving: 100, unit: "g" },
  { name: "Tofu (firm)", brand: "Generic", calories: 76, protein: 8, carbs: 1.9, fat: 4.8, fiber: 0.3, sugar: 0.5, serving: 125, unit: "g" },
  { name: "Greek Yogurt (plain)", brand: "Generic", calories: 59, protein: 10, carbs: 3.6, fat: 0.7, fiber: 0, sugar: 3.2, serving: 170, unit: "g" },
  { name: "Cottage Cheese", brand: "Generic", calories: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0, sugar: 2.7, serving: 113, unit: "g" },

  // Grains & Carbs
  { name: "White Rice (cooked)", brand: "Generic", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, sugar: 0, serving: 200, unit: "g" },
  { name: "Brown Rice (cooked)", brand: "Generic", calories: 123, protein: 2.7, carbs: 26, fat: 1, fiber: 1.6, sugar: 0.4, serving: 200, unit: "g" },
  { name: "Pasta (cooked)", brand: "Generic", calories: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8, sugar: 0.6, serving: 200, unit: "g" },
  { name: "Whole Wheat Bread", brand: "Generic", calories: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 7, sugar: 6, serving: 30, unit: "g" },
  { name: "Oatmeal (dry)", brand: "Generic", calories: 389, protein: 17, carbs: 66, fat: 6.9, fiber: 11, sugar: 0, serving: 40, unit: "g" },
  { name: "Sweet Potato", brand: "Generic", calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, sugar: 4.2, serving: 150, unit: "g" },
  { name: "Quinoa (cooked)", brand: "Generic", calories: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8, sugar: 0.9, serving: 185, unit: "g" },
  { name: "Tortilla (flour)", brand: "Generic", calories: 312, protein: 8.2, carbs: 52, fat: 8.2, fiber: 2.1, sugar: 3.4, serving: 45, unit: "g" },

  // Fruits
  { name: "Banana", brand: "Generic", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, serving: 120, unit: "g" },
  { name: "Apple", brand: "Generic", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, serving: 180, unit: "g" },
  { name: "Strawberries", brand: "Generic", calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, sugar: 4.9, serving: 150, unit: "g" },
  { name: "Blueberries", brand: "Generic", calories: 57, protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4, sugar: 10, serving: 150, unit: "g" },
  { name: "Orange", brand: "Generic", calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, sugar: 9.4, serving: 150, unit: "g" },
  { name: "Avocado", brand: "Generic", calories: 160, protein: 2, carbs: 8.5, fat: 15, fiber: 6.7, sugar: 0.7, serving: 68, unit: "g" },

  // Vegetables
  { name: "Broccoli", brand: "Generic", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.7, serving: 150, unit: "g" },
  { name: "Spinach (raw)", brand: "Generic", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, serving: 30, unit: "g" },
  { name: "Carrots", brand: "Generic", calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, sugar: 4.7, serving: 75, unit: "g" },
  { name: "Bell Pepper", brand: "Generic", calories: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1, sugar: 4.2, serving: 120, unit: "g" },

  // Dairy & Fats
  { name: "Whole Milk", brand: "Generic", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, sugar: 5, serving: 240, unit: "ml" },
  { name: "Cheddar Cheese", brand: "Generic", calories: 403, protein: 25, carbs: 1.3, fat: 33, fiber: 0, sugar: 0.5, serving: 28, unit: "g" },
  { name: "Butter", brand: "Generic", calories: 717, protein: 0.9, carbs: 0.1, fat: 81, fiber: 0, sugar: 0.1, serving: 14, unit: "g" },
  { name: "Olive Oil", brand: "Generic", calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, serving: 15, unit: "ml" },
  { name: "Peanut Butter", brand: "Generic", calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 6, sugar: 9, serving: 32, unit: "g" },
  { name: "Almonds", brand: "Generic", calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12, sugar: 4.4, serving: 28, unit: "g" },

  // Snacks & Common Items
  { name: "Protein Bar", brand: "Generic", calories: 350, protein: 30, carbs: 35, fat: 10, fiber: 5, sugar: 15, serving: 60, unit: "g" },
  { name: "Granola Bar", brand: "Generic", calories: 471, protein: 10, carbs: 64, fat: 20, fiber: 5.3, sugar: 28, serving: 40, unit: "g" },
  { name: "Chips (potato)", brand: "Generic", calories: 536, protein: 7, carbs: 53, fat: 35, fiber: 4.4, sugar: 0.3, serving: 28, unit: "g" },
  { name: "Dark Chocolate", brand: "Generic", calories: 546, protein: 5, carbs: 60, fat: 31, fiber: 7, sugar: 48, serving: 28, unit: "g" },
  { name: "Ice Cream (vanilla)", brand: "Generic", calories: 207, protein: 3.5, carbs: 24, fat: 11, fiber: 0.7, sugar: 21, serving: 100, unit: "g" },

  // Beverages
  { name: "Orange Juice", brand: "Generic", calories: 45, protein: 0.7, carbs: 10, fat: 0.2, fiber: 0.2, sugar: 8.4, serving: 240, unit: "ml" },
  { name: "Coffee (black)", brand: "Generic", calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0, sugar: 0, serving: 240, unit: "ml" },
  { name: "Coca-Cola", brand: "Coca-Cola", calories: 42, protein: 0, carbs: 11, fat: 0, fiber: 0, sugar: 11, serving: 355, unit: "ml" },
  { name: "Protein Shake", brand: "Generic", calories: 120, protein: 24, carbs: 3, fat: 1.5, fiber: 0, sugar: 1, serving: 330, unit: "ml" },

  // Fast Food / Meals
  { name: "Pizza Slice (cheese)", brand: "Generic", calories: 266, protein: 11, carbs: 33, fat: 10, fiber: 2.3, sugar: 3.6, serving: 107, unit: "g" },
  { name: "Hamburger (single patty)", brand: "Generic", calories: 254, protein: 13, carbs: 24, fat: 12, fiber: 1.3, sugar: 5, serving: 110, unit: "g" },
  { name: "French Fries", brand: "Generic", calories: 312, protein: 3.4, carbs: 41, fat: 15, fiber: 3.8, sugar: 0.3, serving: 100, unit: "g" },
  { name: "Caesar Salad", brand: "Generic", calories: 94, protein: 4.5, carbs: 4.7, fat: 7, fiber: 1.3, sugar: 1.5, serving: 200, unit: "g" },
  { name: "Burrito (bean & cheese)", brand: "Generic", calories: 206, protein: 7.8, carbs: 28, fat: 7.2, fiber: 3.5, sugar: 1.2, serving: 150, unit: "g" },
  { name: "Sushi Roll (California)", brand: "Generic", calories: 145, protein: 3.7, carbs: 21, fat: 5.2, fiber: 1.8, sugar: 3.2, serving: 150, unit: "g" },
];

async function main() {
  console.log("Seeding foods...");

  for (const food of foods) {
    await prisma.food.create({ data: food });
  }

  console.log(`Seeded ${foods.length} foods`);
  console.log("Note: Goals are created per-user on signup. No default goals seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
