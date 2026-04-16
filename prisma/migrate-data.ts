import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

const customFoods = [
  { name: "Ground Turkey 99% Lean", brand: "Koch Foods Organic", calories: 120, protein: 26, carbs: 0, fat: 1.5, fiber: 0, sugar: 0, serving: 454, unit: "g" },
  { name: "Sprite Zero", brand: "Coca-Cola", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, serving: 355, unit: "ml" },
  { name: "Espresso", brand: "Generic", calories: 5, protein: 0.3, carbs: 0.5, fat: 0.2, fiber: 0, sugar: 0, serving: 30, unit: "ml" },
  { name: "Whey Protein (1 scoop)", brand: "Generic", calories: 120, protein: 24, carbs: 3, fat: 1.5, fiber: 0, sugar: 1, serving: 33, unit: "g" },
  { name: "Better Than Bouillon", brand: "BTB", calories: 15, protein: 1, carbs: 2, fat: 0.5, fiber: 0, sugar: 1, serving: 16, unit: "g" },
  { name: "Konjac Jelly", brand: "Generic", calories: 10, protein: 0, carbs: 3, fat: 0, fiber: 2, sugar: 1, serving: 150, unit: "g" },
  { name: "Chicken Breast w/ Marinade", brand: "Homemade", calories: 175, protein: 30, carbs: 4, fat: 5, fiber: 0, sugar: 2, serving: 150, unit: "g" },
  { name: "Ice Cream Cone (1 scoop)", brand: "Generic", calories: 250, protein: 4, carbs: 35, fat: 11, fiber: 0.5, sugar: 24, serving: 100, unit: "g" },
  { name: "Shrimp in Butter Sauce", brand: "Homemade", calories: 180, protein: 20, carbs: 2, fat: 10, fiber: 0, sugar: 0, serving: 150, unit: "g" },
  { name: "Kimchi", brand: "Generic", calories: 23, protein: 1.3, carbs: 4, fat: 0.5, fiber: 1.6, sugar: 1.5, serving: 75, unit: "g" },
  { name: "Spaghetti", brand: "De Cecco", calories: 359, protein: 13, carbs: 71.7, fat: 1.5, fiber: 3, sugar: 3.5, serving: 85, unit: "g" },
  { name: "Baja Chicken Tacos (1/3 rice)", brand: "Cheesecake Factory", calories: 1177, protein: 76, carbs: 94, fat: 57, fiber: 14, sugar: 10, serving: 100, unit: "g" },
  { name: "Sour Cream", brand: "Generic", calories: 198, protein: 2.4, carbs: 4.6, fat: 19.4, fiber: 0, sugar: 3.5, serving: 60, unit: "g" },
  { name: "Konjac Jelly Peach", brand: "Essential Cs", calories: 6.67, protein: 0, carbs: 9.33, fat: 0, fiber: 0, sugar: 0, serving: 150, unit: "g" },
  { name: "Bacon (cooked)", brand: "Generic", calories: 541, protein: 37, carbs: 1.4, fat: 42, fiber: 0, sugar: 0, serving: 20, unit: "g" },
  { name: "Ham (deli)", brand: "Generic", calories: 145, protein: 21, carbs: 1.5, fat: 6, fiber: 0, sugar: 1, serving: 56, unit: "g" },
  { name: "Pork Chop (cooked)", brand: "Generic", calories: 231, protein: 27, carbs: 0, fat: 13, fiber: 0, sugar: 0, serving: 140, unit: "g" },
  { name: "Chicken Thigh (skinless)", brand: "Generic", calories: 209, protein: 26, carbs: 0, fat: 11, fiber: 0, sugar: 0, serving: 100, unit: "g" },
  { name: "Tilapia (cooked)", brand: "Generic", calories: 128, protein: 26, carbs: 0, fat: 2.7, fiber: 0, sugar: 0, serving: 100, unit: "g" },
  { name: "Cod (cooked)", brand: "Generic", calories: 105, protein: 23, carbs: 0, fat: 0.9, fiber: 0, sugar: 0, serving: 100, unit: "g" },
  { name: "Sirloin Steak (cooked)", brand: "Generic", calories: 206, protein: 29, carbs: 0, fat: 9, fiber: 0, sugar: 0, serving: 140, unit: "g" },
  { name: "Deli Turkey Slices", brand: "Generic", calories: 104, protein: 17, carbs: 3.5, fat: 2.5, fiber: 0, sugar: 1, serving: 56, unit: "g" },
  { name: "Hot Dog (beef)", brand: "Generic", calories: 290, protein: 10, carbs: 2, fat: 26, fiber: 0, sugar: 1, serving: 45, unit: "g" },
  { name: "Italian Sausage (cooked)", brand: "Generic", calories: 344, protein: 14, carbs: 2, fat: 31, fiber: 0, sugar: 0, serving: 80, unit: "g" },
  { name: "Egg Whites", brand: "Generic", calories: 52, protein: 11, carbs: 0.7, fat: 0.2, fiber: 0, sugar: 0.7, serving: 33, unit: "g" },
  { name: "Skim Milk", brand: "Generic", calories: 34, protein: 3.4, carbs: 5, fat: 0.2, fiber: 0, sugar: 5, serving: 240, unit: "ml" },
  { name: "Almond Milk (unsweetened)", brand: "Generic", calories: 17, protein: 0.6, carbs: 0.3, fat: 1.5, fiber: 0.2, sugar: 0, serving: 240, unit: "ml" },
  { name: "Oat Milk", brand: "Generic", calories: 47, protein: 1, carbs: 7, fat: 1.5, fiber: 0.8, sugar: 4, serving: 240, unit: "ml" },
  { name: "Mozzarella Cheese", brand: "Generic", calories: 280, protein: 22, carbs: 3, fat: 17, fiber: 0, sugar: 1, serving: 28, unit: "g" },
  { name: "Parmesan Cheese (grated)", brand: "Generic", calories: 431, protein: 38, carbs: 4, fat: 29, fiber: 0, sugar: 0.9, serving: 5, unit: "g" },
  { name: "Cream Cheese", brand: "Generic", calories: 342, protein: 6, carbs: 4, fat: 34, fiber: 0, sugar: 3, serving: 30, unit: "g" },
  { name: "Heavy Cream", brand: "Generic", calories: 340, protein: 2.8, carbs: 2.8, fat: 36, fiber: 0, sugar: 2.8, serving: 15, unit: "ml" },
  { name: "Feta Cheese", brand: "Generic", calories: 264, protein: 14, carbs: 4, fat: 21, fiber: 0, sugar: 4, serving: 28, unit: "g" },
  { name: "String Cheese (mozzarella)", brand: "Generic", calories: 280, protein: 22, carbs: 3, fat: 17, fiber: 0, sugar: 1, serving: 28, unit: "g" },
  { name: "White Bread", brand: "Generic", calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, sugar: 5, serving: 28, unit: "g" },
  { name: "Bagel (plain)", brand: "Generic", calories: 257, protein: 10, carbs: 51, fat: 1.5, fiber: 2.2, sugar: 6, serving: 95, unit: "g" },
  { name: "English Muffin", brand: "Generic", calories: 227, protein: 8, carbs: 44, fat: 1.7, fiber: 3, sugar: 3, serving: 57, unit: "g" },
  { name: "Corn Tortilla", brand: "Generic", calories: 218, protein: 5.7, carbs: 45, fat: 2.9, fiber: 6, sugar: 0.8, serving: 24, unit: "g" },
  { name: "Cheerios", brand: "General Mills", calories: 367, protein: 12, carbs: 73, fat: 6, fiber: 11, sugar: 4, serving: 28, unit: "g" },
  { name: "Pancake (plain)", brand: "Generic", calories: 227, protein: 6.4, carbs: 28, fat: 10, fiber: 0.9, sugar: 6, serving: 38, unit: "g" },
  { name: "Saltine Crackers", brand: "Generic", calories: 421, protein: 9, carbs: 74, fat: 9, fiber: 3, sugar: 1, serving: 14, unit: "g" },
  { name: "Grapes", brand: "Generic", calories: 69, protein: 0.7, carbs: 18, fat: 0.2, fiber: 0.9, sugar: 16, serving: 151, unit: "g" },
  { name: "Watermelon", brand: "Generic", calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4, sugar: 6.2, serving: 152, unit: "g" },
  { name: "Pineapple", brand: "Generic", calories: 50, protein: 0.5, carbs: 13, fat: 0.1, fiber: 1.4, sugar: 10, serving: 165, unit: "g" },
  { name: "Mango", brand: "Generic", calories: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6, sugar: 14, serving: 165, unit: "g" },
  { name: "Raspberries", brand: "Generic", calories: 52, protein: 1.2, carbs: 12, fat: 0.7, fiber: 6.5, sugar: 4.4, serving: 123, unit: "g" },
  { name: "Pear", brand: "Generic", calories: 57, protein: 0.4, carbs: 15, fat: 0.1, fiber: 3.1, sugar: 10, serving: 178, unit: "g" },
  { name: "Peach", brand: "Generic", calories: 39, protein: 0.9, carbs: 10, fat: 0.3, fiber: 1.5, sugar: 8.4, serving: 150, unit: "g" },
  { name: "Cherries", brand: "Generic", calories: 63, protein: 1.1, carbs: 16, fat: 0.2, fiber: 2.1, sugar: 13, serving: 138, unit: "g" },
  { name: "Cucumber", brand: "Generic", calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, sugar: 1.7, serving: 100, unit: "g" },
  { name: "Tomato", brand: "Generic", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6, serving: 123, unit: "g" },
  { name: "Onion", brand: "Generic", calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, sugar: 4.2, serving: 110, unit: "g" },
  { name: "Mushrooms (white)", brand: "Generic", calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1, sugar: 2, serving: 70, unit: "g" },
  { name: "Kale", brand: "Generic", calories: 35, protein: 2.9, carbs: 4.4, fat: 1.5, fiber: 4.1, sugar: 0.8, serving: 67, unit: "g" },
  { name: "Romaine Lettuce", brand: "Generic", calories: 17, protein: 1.2, carbs: 3.3, fat: 0.3, fiber: 2.1, sugar: 1.2, serving: 47, unit: "g" },
  { name: "Cauliflower", brand: "Generic", calories: 25, protein: 1.9, carbs: 5, fat: 0.3, fiber: 2, sugar: 1.9, serving: 100, unit: "g" },
  { name: "Zucchini", brand: "Generic", calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1, sugar: 2.5, serving: 124, unit: "g" },
  { name: "Green Beans", brand: "Generic", calories: 31, protein: 1.8, carbs: 7, fat: 0.2, fiber: 2.7, sugar: 3.3, serving: 100, unit: "g" },
  { name: "Asparagus", brand: "Generic", calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1, fiber: 2.1, sugar: 1.9, serving: 134, unit: "g" },
  { name: "Corn (cooked)", brand: "Generic", calories: 96, protein: 3.4, carbs: 21, fat: 1.5, fiber: 2.4, sugar: 4.5, serving: 154, unit: "g" },
  { name: "Black Beans (cooked)", brand: "Generic", calories: 132, protein: 8.9, carbs: 24, fat: 0.5, fiber: 8.7, sugar: 0.3, serving: 172, unit: "g" },
  { name: "Chickpeas (cooked)", brand: "Generic", calories: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 7.6, sugar: 4.8, serving: 164, unit: "g" },
  { name: "Lentils (cooked)", brand: "Generic", calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, sugar: 1.8, serving: 198, unit: "g" },
  { name: "Walnuts", brand: "Generic", calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7, sugar: 2.6, serving: 28, unit: "g" },
  { name: "Cashews", brand: "Generic", calories: 553, protein: 18, carbs: 30, fat: 44, fiber: 3.3, sugar: 5.9, serving: 28, unit: "g" },
  { name: "Hummus", brand: "Generic", calories: 166, protein: 7.9, carbs: 14, fat: 9.6, fiber: 6, sugar: 0.3, serving: 30, unit: "g" },
  { name: "Edamame", brand: "Generic", calories: 121, protein: 12, carbs: 9, fat: 5.2, fiber: 5.2, sugar: 2.2, serving: 155, unit: "g" },
  { name: "Mayonnaise", brand: "Generic", calories: 680, protein: 1, carbs: 0.6, fat: 75, fiber: 0, sugar: 0.4, serving: 14, unit: "g" },
  { name: "Ketchup", brand: "Generic", calories: 112, protein: 1.3, carbs: 27, fat: 0.3, fiber: 0.4, sugar: 22, serving: 17, unit: "g" },
  { name: "Yellow Mustard", brand: "Generic", calories: 66, protein: 4.4, carbs: 6, fat: 4, fiber: 3.3, sugar: 0.9, serving: 5, unit: "g" },
  { name: "Soy Sauce", brand: "Generic", calories: 53, protein: 8, carbs: 4.9, fat: 0.6, fiber: 0.8, sugar: 0.4, serving: 15, unit: "ml" },
  { name: "Ranch Dressing", brand: "Generic", calories: 484, protein: 1, carbs: 6, fat: 52, fiber: 0, sugar: 4, serving: 30, unit: "g" },
  { name: "Honey", brand: "Generic", calories: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0.2, sugar: 82, serving: 21, unit: "g" },
  { name: "Maple Syrup", brand: "Generic", calories: 260, protein: 0, carbs: 67, fat: 0.1, fiber: 0, sugar: 60, serving: 20, unit: "ml" },
  { name: "Green Tea", brand: "Generic", calories: 1, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, serving: 240, unit: "ml" },
  { name: "Diet Coke", brand: "Coca-Cola", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, serving: 355, unit: "ml" },
  { name: "Gatorade", brand: "Gatorade", calories: 25, protein: 0, carbs: 6, fat: 0, fiber: 0, sugar: 6, serving: 240, unit: "ml" },
  { name: "Beer (regular)", brand: "Generic", calories: 43, protein: 0.5, carbs: 3.6, fat: 0, fiber: 0, sugar: 0, serving: 355, unit: "ml" },
  { name: "Red Wine", brand: "Generic", calories: 85, protein: 0.1, carbs: 2.6, fat: 0, fiber: 0, sugar: 0.6, serving: 148, unit: "ml" },
  { name: "Popcorn (air-popped)", brand: "Generic", calories: 387, protein: 12, carbs: 78, fat: 4.5, fiber: 15, sugar: 0.9, serving: 8, unit: "g" },
  { name: "Donut (glazed)", brand: "Generic", calories: 452, protein: 4.9, carbs: 51, fat: 25, fiber: 1.4, sugar: 23, serving: 60, unit: "g" },
  { name: "Chocolate Chip Cookie", brand: "Generic", calories: 488, protein: 5.6, carbs: 64, fat: 24, fiber: 2.3, sugar: 36, serving: 16, unit: "g" },
  { name: "Blueberry Muffin", brand: "Generic", calories: 377, protein: 6, carbs: 55, fat: 15, fiber: 1.6, sugar: 26, serving: 113, unit: "g" },
  { name: "Brunch (mixed: mimosa, tortellini, cheesecake, steak)", brand: "Restaurant", calories: 200, protein: 9, carbs: 18, fat: 9, fiber: 1, sugar: 8, serving: 100, unit: "g" },
  { name: "Cappuccino", brand: "Generic", calories: 33, protein: 1.7, carbs: 3.3, fat: 1.7, fiber: 0, sugar: 3, serving: 100, unit: "ml" },
  { name: "Spicy Tuna (can, oil drained)", brand: "Natural Catch", calories: 144, protein: 16, carbs: 1, fat: 9, fiber: 0, sugar: 0, serving: 125, unit: "g" },
  { name: "Wild Albacore Tuna (no oil)", brand: "Wild Planet", calories: 99, protein: 23, carbs: 0, fat: 1, fiber: 0, sugar: 0, serving: 142, unit: "g" },
  { name: "Spicy Chicken Nuggets (10pc)", brand: "Wendys", calories: 287, protein: 13.3, carbs: 18, fat: 17.3, fiber: 1.3, sugar: 0, serving: 150, unit: "g" },
  { name: "Gochujang", brand: "Generic", calories: 222, protein: 5.6, carbs: 50, fat: 2.8, fiber: 2, sugar: 27, serving: 18, unit: "g" },
  { name: "Mozzarella Sticks (breaded)", brand: "Generic", calories: 320, protein: 16, carbs: 24, fat: 18, fiber: 1, sugar: 2, serving: 25, unit: "g" },
  { name: "Marinara Sauce", brand: "Generic", calories: 45, protein: 1.5, carbs: 8, fat: 1, fiber: 2, sugar: 5, serving: 60, unit: "g" },
  { name: "Zesty Italian Dressing", brand: "Kens", calories: 433, protein: 0, carbs: 6.7, fat: 46.7, fiber: 0, sugar: 5, serving: 30, unit: "g" },
];

// Map old SQLite IDs to food names for lookup
const oldIdToName: Record<number, string> = {
  1: "Chicken Breast", 7: "Shrimp", 13: "Pasta (cooked)", 19: "Banana",
  26: "Spinach (raw)", 31: "Butter", 32: "Olive Oil", 44: "Pizza Slice (cheese)",
  50: "Ground Turkey 99% Lean", 51: "Sprite Zero", 52: "Espresso",
  53: "Whey Protein (1 scoop)", 54: "Better Than Bouillon", 55: "Konjac Jelly",
  56: "Chicken Breast w/ Marinade", 57: "Ice Cream Cone (1 scoop)",
  58: "Shrimp in Butter Sauce", 59: "Kimchi", 60: "Spaghetti",
  61: "Baja Chicken Tacos (1/3 rice)", 62: "Sour Cream",
  63: "Konjac Jelly Peach", 69: "Cod (cooked)", 99: "Cucumber",
  117: "Mayonnaise", 120: "Soy Sauce", 133: "Brunch (mixed: mimosa, tortellini, cheesecake, steak)",
  134: "Cappuccino", 135: "Spicy Tuna (can, oil drained)",
  136: "Wild Albacore Tuna (no oil)", 137: "Spicy Chicken Nuggets (10pc)",
  138: "Gochujang", 139: "Mozzarella Sticks (breaded)", 140: "Marinara Sauce",
  141: "Zesty Italian Dressing",
};

const foodLogs = [
  { foodId: 50, amount: 454, meal: "dinner", date: "2026-04-06" },
  { foodId: 51, amount: 355, meal: "dinner", date: "2026-04-06" },
  { foodId: 52, amount: 60, meal: "breakfast", date: "2026-04-06" },
  { foodId: 50, amount: 454, meal: "dinner", date: "2026-04-07" },
  { foodId: 26, amount: 60, meal: "dinner", date: "2026-04-07" },
  { foodId: 54, amount: 16, meal: "dinner", date: "2026-04-07" },
  { foodId: 19, amount: 120, meal: "snack", date: "2026-04-07" },
  { foodId: 53, amount: 33, meal: "breakfast", date: "2026-04-07" },
  { foodId: 53, amount: 33, meal: "breakfast", date: "2026-04-08" },
  { foodId: 19, amount: 120, meal: "snack", date: "2026-04-08" },
  { foodId: 55, amount: 150, meal: "snack", date: "2026-04-08" },
  { foodId: 56, amount: 300, meal: "dinner", date: "2026-04-08" },
  { foodId: 54, amount: 16, meal: "dinner", date: "2026-04-08" },
  { foodId: 26, amount: 60, meal: "dinner", date: "2026-04-08" },
  { foodId: 52, amount: 60, meal: "breakfast", date: "2026-04-09" },
  { foodId: 57, amount: 100, meal: "snack", date: "2026-04-09" },
  { foodId: 58, amount: 200, meal: "dinner", date: "2026-04-09" },
  { foodId: 13, amount: 100, meal: "dinner", date: "2026-04-09" },
  { foodId: 54, amount: 16, meal: "dinner", date: "2026-04-09" },
  { foodId: 26, amount: 60, meal: "dinner", date: "2026-04-09" },
  { foodId: 59, amount: 75, meal: "dinner", date: "2026-04-09" },
  { foodId: 51, amount: 355, meal: "dinner", date: "2026-04-09" },
  { foodId: 60, amount: 50, meal: "lunch", date: "2026-04-10" },
  { foodId: 7, amount: 49, meal: "lunch", date: "2026-04-10" },
  { foodId: 32, amount: 3, meal: "lunch", date: "2026-04-10" },
  { foodId: 31, amount: 6, meal: "lunch", date: "2026-04-10" },
  { foodId: 63, amount: 150, meal: "lunch", date: "2026-04-10" },
  { foodId: 61, amount: 100, meal: "dinner", date: "2026-04-10" },
  { foodId: 62, amount: 60, meal: "dinner", date: "2026-04-10" },
  { foodId: 7, amount: 82, meal: "lunch", date: "2026-04-11" },
  { foodId: 31, amount: 5.6, meal: "lunch", date: "2026-04-11" },
  { foodId: 69, amount: 237, meal: "lunch", date: "2026-04-11" },
  { foodId: 31, amount: 5, meal: "lunch", date: "2026-04-11" },
  { foodId: 99, amount: 300, meal: "lunch", date: "2026-04-11" },
  { foodId: 69, amount: 120, meal: "dinner", date: "2026-04-11" },
  { foodId: 54, amount: 10, meal: "dinner", date: "2026-04-11" },
  { foodId: 26, amount: 30, meal: "dinner", date: "2026-04-11" },
  { foodId: 55, amount: 150, meal: "snack", date: "2026-04-11" },
  { foodId: 133, amount: 500, meal: "lunch", date: "2026-04-12" },
  { foodId: 19, amount: 120, meal: "breakfast", date: "2026-04-12" },
  { foodId: 134, amount: 180, meal: "breakfast", date: "2026-04-12" },
  { foodId: 135, amount: 125, meal: "lunch", date: "2026-04-13" },
  { foodId: 59, amount: 75, meal: "lunch", date: "2026-04-13" },
  { foodId: 137, amount: 150, meal: "dinner", date: "2026-04-13" },
  { foodId: 136, amount: 142, meal: "dinner", date: "2026-04-13" },
  { foodId: 117, amount: 7, meal: "dinner", date: "2026-04-13" },
  { foodId: 138, amount: 9, meal: "dinner", date: "2026-04-13" },
  { foodId: 54, amount: 5, meal: "snack", date: "2026-04-13" },
  { foodId: 26, amount: 30, meal: "snack", date: "2026-04-13" },
  { foodId: 44, amount: 165, meal: "dinner", date: "2026-04-14" },
  { foodId: 139, amount: 75, meal: "dinner", date: "2026-04-14" },
  { foodId: 140, amount: 60, meal: "dinner", date: "2026-04-14" },
  { foodId: 1, amount: 256, meal: "dinner", date: "2026-04-15" },
  { foodId: 141, amount: 15, meal: "dinner", date: "2026-04-15" },
  { foodId: 120, amount: 5, meal: "dinner", date: "2026-04-15" },
];

const exercises = [
  { name: "Yard work (shoveling, wheelbarrow, raking)", caloriesBurned: 550, duration: 100, date: "2026-04-11" },
  { name: "Walking pad (4mi, 5% incline, 3.6-4mph)", caloriesBurned: 440, duration: 67, date: "2026-04-14" },
  { name: "Walking pad (2mi, 5% incline, 4mph)", caloriesBurned: 250, duration: 30, date: "2026-04-15" },
];

const moods = [
  { date: "2026-04-09", tags: "content,energized", notes: "felt fine" },
  { date: "2026-04-10", tags: "hungry", notes: "" },
  { date: "2026-04-11", tags: "tired", notes: "" },
  { date: "2026-04-12", tags: "bm,content,full", notes: "" },
  { date: "2026-04-13", tags: "bm", notes: null },
];

const weights = [
  { weight: 136, date: "2026-04-06" },
  { weight: 135, date: "2026-04-09" },
  { weight: 135, date: "2026-04-10" },
  { weight: 134.4, date: "2026-04-15" },
];

async function main() {
  // This script requires a user to exist. Pass userId as CLI arg or default to 1.
  const userIdArg = process.argv[2];
  const userId = userIdArg ? parseInt(userIdArg, 10) : 1;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error(`User with id ${userId} not found. Sign up first, then run: npx tsx prisma/migrate-data.ts <userId>`);
    process.exit(1);
  }
  console.log(`Migrating data for user: ${user.name} (${user.email})`);

  console.log("Creating custom foods...");
  for (const food of customFoods) {
    await prisma.food.create({ data: food });
  }
  console.log(`Created ${customFoods.length} custom foods`);

  // Build name -> new ID map
  const allFoods = await prisma.food.findMany();
  const nameToId: Record<string, number> = {};
  for (const f of allFoods) {
    nameToId[f.name] = f.id;
  }

  console.log("Creating food logs...");
  for (const log of foodLogs) {
    const foodName = oldIdToName[log.foodId];
    const newId = nameToId[foodName];
    if (!newId) {
      console.error(`Missing food mapping: old id ${log.foodId} -> name "${foodName}"`);
      continue;
    }
    await prisma.foodLog.create({
      data: { userId, foodId: newId, amount: log.amount, meal: log.meal, date: log.date },
    });
  }
  console.log(`Created ${foodLogs.length} food logs`);

  console.log("Creating exercises...");
  for (const ex of exercises) {
    await prisma.exercise.create({ data: { userId, ...ex } });
  }

  console.log("Creating mood entries...");
  for (const mood of moods) {
    await prisma.moodEntry.create({ data: { userId, date: mood.date, tags: mood.tags, notes: mood.notes } });
  }

  console.log("Creating weight entries...");
  for (const w of weights) {
    await prisma.weightEntry.create({ data: { userId, ...w } });
  }

  console.log("Migration complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
