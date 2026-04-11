export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function calcMacros(food: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number }, amountG: number) {
  const factor = amountG / 100;
  return {
    calories: Math.round(food.calories * factor),
    protein: Math.round(food.protein * factor * 10) / 10,
    carbs: Math.round(food.carbs * factor * 10) / 10,
    fat: Math.round(food.fat * factor * 10) / 10,
    fiber: Math.round(food.fiber * factor * 10) / 10,
    sugar: Math.round(food.sugar * factor * 10) / 10,
  };
}

export function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// BMI: weight(kg) / height(m)^2
export function calcBMI(weightLbs: number, heightIn: number) {
  const kg = weightLbs * 0.453592;
  const m = heightIn * 0.0254;
  return Math.round((kg / (m * m)) * 10) / 10;
}

export function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: "Underweight", color: "#5bb8e8" };
  if (bmi < 25) return { label: "Normal", color: "#6bcb77" };
  if (bmi < 30) return { label: "Overweight", color: "#ffc145" };
  return { label: "Obese", color: "#ff4444" };
}

// Mifflin-St Jeor BMR
export function calcBMR(weightLbs: number, heightIn: number, age: number, gender: string) {
  const kg = weightLbs * 0.453592;
  const cm = heightIn * 2.54;
  if (gender === "male") {
    return Math.round(10 * kg + 6.25 * cm - 5 * age + 5);
  }
  return Math.round(10 * kg + 6.25 * cm - 5 * age - 161);
}

const activityMultipliers: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calcTDEE(bmr: number, activityLevel: string) {
  return Math.round(bmr * (activityMultipliers[activityLevel] || 1.2));
}

export const activityLabels: Record<string, string> = {
  sedentary: "Sedentary (little/no exercise)",
  light: "Light (1-3 days/week)",
  moderate: "Moderate (3-5 days/week)",
  active: "Active (6-7 days/week)",
  very_active: "Very Active (2x/day)",
};
