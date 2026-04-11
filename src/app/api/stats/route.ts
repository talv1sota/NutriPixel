import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

function dateNDaysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const activityMultipliers: Record<string, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};

function calcTDEE(weightLbs: number, heightIn: number, age: number, gender: string, activity: string) {
  const kg = weightLbs * 0.453592;
  const cm = heightIn * 2.54;
  const bmr = gender === "male"
    ? 10 * kg + 6.25 * cm - 5 * age + 5
    : 10 * kg + 6.25 * cm - 5 * age - 161;
  return Math.round(bmr * (activityMultipliers[activity] || 1.2));
}

interface DailyTotals {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  burned: number;
  net: number;
  hasLogs: boolean;
}

async function computeWindow(days: number, tdee: number | null, targetCalories: number | null, targetProtein: number | null) {
  const from = dateNDaysAgo(days - 1);
  const to = todayStr();

  const [logs, exercises] = await Promise.all([
    prisma.foodLog.findMany({
      where: { date: { gte: from, lte: to } },
      include: { food: true },
    }),
    prisma.exercise.findMany({
      where: { date: { gte: from, lte: to } },
    }),
  ]);

  const byDate = new Map<string, DailyTotals>();
  for (let i = 0; i < days; i++) {
    const d = dateNDaysAgo(days - 1 - i);
    byDate.set(d, { date: d, calories: 0, protein: 0, carbs: 0, fat: 0, burned: 0, net: 0, hasLogs: false });
  }

  for (const log of logs) {
    const day = byDate.get(log.date);
    if (!day) continue;
    const factor = log.amount / 100;
    day.calories += log.food.calories * factor;
    day.protein += log.food.protein * factor;
    day.carbs += log.food.carbs * factor;
    day.fat += log.food.fat * factor;
    day.hasLogs = true;
  }

  for (const ex of exercises) {
    const day = byDate.get(ex.date);
    if (!day) continue;
    day.burned += ex.caloriesBurned;
  }

  const daily = Array.from(byDate.values());
  for (const d of daily) d.net = d.calories - d.burned;

  const logged = daily.filter(d => d.hasLogs);
  const loggedCount = logged.length;

  const sum = logged.reduce(
    (a, d) => ({
      calories: a.calories + d.calories,
      protein: a.protein + d.protein,
      carbs: a.carbs + d.carbs,
      fat: a.fat + d.fat,
      burned: a.burned + d.burned,
      net: a.net + d.net,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, burned: 0, net: 0 },
  );

  const avg = loggedCount > 0 ? {
    calories: Math.round(sum.calories / loggedCount),
    protein: Math.round((sum.protein / loggedCount) * 10) / 10,
    carbs: Math.round((sum.carbs / loggedCount) * 10) / 10,
    fat: Math.round((sum.fat / loggedCount) * 10) / 10,
    burned: Math.round(sum.burned / loggedCount),
    net: Math.round(sum.net / loggedCount),
  } : null;

  // Deficit analysis (vs TDEE)
  const avgDeficitVsTDEE = tdee && avg ? tdee - avg.net : null;
  const weeklyDeficit = avgDeficitVsTDEE != null ? avgDeficitVsTDEE * 7 : null;
  const monthlyDeficit = avgDeficitVsTDEE != null ? avgDeficitVsTDEE * 30 : null;
  const projectedLbsPerWeek = weeklyDeficit != null ? Math.round((weeklyDeficit / 3500) * 100) / 100 : null;
  const projectedLbsPerMonth = monthlyDeficit != null ? Math.round((monthlyDeficit / 3500) * 100) / 100 : null;

  // On-track: at or under target = on target; over = over. Protein min separately.
  let daysOverCal = 0, daysOnCal = 0, daysHitProtein = 0;
  if (targetCalories) {
    for (const d of logged) {
      if (d.net > targetCalories * 1.1) daysOverCal++;
      else daysOnCal++;
    }
  }
  if (targetProtein) {
    for (const d of logged) if (d.protein >= targetProtein) daysHitProtein++;
  }

  return {
    days,
    from,
    to,
    loggedCount,
    avg,
    sumNet: Math.round(sum.net),
    sumBurned: Math.round(sum.burned),
    avgDeficitVsTDEE: avgDeficitVsTDEE != null ? Math.round(avgDeficitVsTDEE) : null,
    weeklyDeficit: weeklyDeficit != null ? Math.round(weeklyDeficit) : null,
    monthlyDeficit: monthlyDeficit != null ? Math.round(monthlyDeficit) : null,
    projectedLbsPerWeek,
    projectedLbsPerMonth,
    onTrack: targetCalories ? { daysOnCal, daysOverCal } : null,
    daysHitProtein: targetProtein ? daysHitProtein : null,
    daily,
  };
}

export async function GET() {
  const goal = await prisma.goal.findFirst();
  const weights = await prisma.weightEntry.findMany({ orderBy: { date: "asc" } });

  const currentWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
  const tdee = (currentWeight && goal?.height && goal?.age)
    ? calcTDEE(currentWeight, goal.height, goal.age, goal.gender, goal.activityLevel)
    : null;

  const [week, month] = await Promise.all([
    computeWindow(7, tdee, goal?.targetCalories ?? null, goal?.minProtein ?? goal?.targetProtein ?? null),
    computeWindow(30, tdee, goal?.targetCalories ?? null, goal?.minProtein ?? goal?.targetProtein ?? null),
  ]);

  // Weight progress
  const weightStats: {
    current: number | null;
    target: number | null;
    startWeight: number | null;
    lbsLost: number | null;
    lbsToGo: number | null;
    pctComplete: number | null;
    daysToGoal: number | null;
    projectedGoalDate: string | null;
    weeklyTrend: number | null;
  } = {
    current: currentWeight,
    target: goal?.targetWeight ?? null,
    startWeight: weights.length > 0 ? weights[0].weight : null,
    lbsLost: null,
    lbsToGo: null,
    pctComplete: null,
    daysToGoal: null,
    projectedGoalDate: null,
    weeklyTrend: null,
  };

  if (currentWeight && weights.length > 0) {
    weightStats.lbsLost = Math.round((weights[0].weight - currentWeight) * 10) / 10;
  }
  if (currentWeight && goal?.targetWeight != null) {
    weightStats.lbsToGo = Math.round((currentWeight - goal.targetWeight) * 10) / 10;
    if (weightStats.startWeight != null) {
      const totalToLose = weightStats.startWeight - goal.targetWeight;
      if (totalToLose > 0) {
        weightStats.pctComplete = Math.max(0, Math.min(100, Math.round(((weightStats.startWeight - currentWeight) / totalToLose) * 100)));
      }
    }
  }

  // Projected goal date based on weekly deficit (prefer 30-day avg)
  const usedWeeklyLbs = month.projectedLbsPerWeek ?? week.projectedLbsPerWeek;
  if (weightStats.lbsToGo != null && weightStats.lbsToGo > 0 && usedWeeklyLbs != null && usedWeeklyLbs > 0) {
    const weeksNeeded = weightStats.lbsToGo / usedWeeklyLbs;
    const days = Math.round(weeksNeeded * 7);
    weightStats.daysToGoal = days;
    const dt = new Date();
    dt.setDate(dt.getDate() + days);
    weightStats.projectedGoalDate = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  }

  // Actual weekly weight trend (last 14 days linear fit, lbs/week)
  const last14 = weights.filter(w => {
    const cutoff = dateNDaysAgo(13);
    return w.date >= cutoff;
  });
  if (last14.length >= 2) {
    const first = last14[0];
    const last = last14[last14.length - 1];
    const firstT = new Date(first.date + "T12:00:00").getTime();
    const lastT = new Date(last.date + "T12:00:00").getTime();
    const dayDiff = (lastT - firstT) / (1000 * 60 * 60 * 24);
    if (dayDiff > 0) {
      const perDay = (last.weight - first.weight) / dayDiff;
      weightStats.weeklyTrend = Math.round(perDay * 7 * 100) / 100;
    }
  }

  return NextResponse.json({
    tdee,
    goal: {
      targetCalories: goal?.targetCalories ?? null,
      targetProtein: goal?.targetProtein ?? null,
      targetCarbs: goal?.targetCarbs ?? null,
      targetFat: goal?.targetFat ?? null,
      minProtein: goal?.minProtein ?? null,
      targetWeight: goal?.targetWeight ?? null,
      targetDate: goal?.targetDate ?? null,
      unit: goal?.unit ?? "lbs",
    },
    week,
    month,
    weight: weightStats,
  });
}
