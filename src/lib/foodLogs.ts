// Shared helpers for handling FoodLog rows whose Food row may have been
// deleted. When a custom food is removed the log's snapshot* fields capture
// the macros; this helper synthesizes a Food-shaped object from them so
// downstream code can stay simple.

export interface FoodShape {
  id: number;
  name: string;
  brand: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  serving: number;
  unit: string;
}

interface LogWithSnapshot {
  food: FoodShape | null;
  snapshotName: string | null;
  snapshotBrand: string | null;
  snapshotCalories: number | null;
  snapshotProtein: number | null;
  snapshotCarbs: number | null;
  snapshotFat: number | null;
  snapshotFiber: number | null;
  snapshotSugar: number | null;
  snapshotServing: number | null;
  snapshotUnit: string | null;
}

export function resolveFood(log: LogWithSnapshot): FoodShape {
  if (log.food) return log.food;
  return {
    id: 0,
    name: log.snapshotName ?? "(deleted food)",
    brand: log.snapshotBrand,
    calories: log.snapshotCalories ?? 0,
    protein: log.snapshotProtein ?? 0,
    carbs: log.snapshotCarbs ?? 0,
    fat: log.snapshotFat ?? 0,
    fiber: log.snapshotFiber ?? 0,
    sugar: log.snapshotSugar ?? 0,
    serving: log.snapshotServing ?? 100,
    unit: log.snapshotUnit ?? "g",
  };
}
