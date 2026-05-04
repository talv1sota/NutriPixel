import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
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

interface DayData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  burned: number;
  net: number;
  topFoods: { name: string; calories: number }[];
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const from = dateNDaysAgo(13);
  const to = todayStr();

  const [logs, exercises, weights, goal] = await Promise.all([
    prisma.foodLog.findMany({
      where: { userId: session.userId, date: { gte: from, lte: to } },
      include: { food: true },
      orderBy: { date: "asc" },
    }),
    prisma.exercise.findMany({
      where: { userId: session.userId, date: { gte: from, lte: to } },
    }),
    prisma.weightEntry.findMany({
      where: { userId: session.userId },
      orderBy: { date: "asc" },
    }),
    prisma.goal.findFirst({ where: { userId: session.userId } }),
  ]);

  // Build daily data
  const byDate = new Map<string, DayData>();
  for (const log of logs) {
    const d = byDate.get(log.date) || {
      date: log.date, calories: 0, protein: 0, carbs: 0, fat: 0, burned: 0, net: 0, topFoods: [],
    };
    const cal = log.food.calories * log.amount / 100;
    const pro = log.food.protein * log.amount / 100;
    const carb = log.food.carbs * log.amount / 100;
    const f = log.food.fat * log.amount / 100;
    d.calories += cal;
    d.protein += pro;
    d.carbs += carb;
    d.fat += f;
    d.topFoods.push({ name: log.food.name, calories: Math.round(cal) });
    byDate.set(log.date, d);
  }
  for (const ex of exercises) {
    const d = byDate.get(ex.date);
    if (d) d.burned += ex.caloriesBurned;
  }

  const days = [...byDate.values()].map(d => ({ ...d, net: d.calories - d.burned }));
  days.sort((a, b) => a.date.localeCompare(b.date));

  if (days.length === 0) {
    return NextResponse.json({ insights: ["No data in the last 14 days to analyze."] });
  }

  const insights: string[] = [];
  const targetCal = goal?.targetCalories ?? null;
  const targetProtein = goal?.targetProtein ?? goal?.minProtein ?? null;

  // --- Weight trend ---
  const recentWeights = weights.filter(w => w.date >= dateNDaysAgo(13));
  const allTimeWeights = weights;
  if (recentWeights.length >= 2) {
    const first = recentWeights[0];
    const last = recentWeights[recentWeights.length - 1];
    const diff = Math.round((last.weight - first.weight) * 10) / 10;
    const daySpan = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24);
    const weeklyRate = daySpan > 0 ? Math.round((diff / daySpan) * 7 * 10) / 10 : 0;
    if (diff < -0.3) {
      insights.push(`📉 Down ${Math.abs(diff)} lbs over the past ${Math.round(daySpan)} days (${Math.abs(weeklyRate)} lbs/week). Keep it up.`);
    } else if (diff > 0.3) {
      insights.push(`📈 Up ${diff} lbs over the past ${Math.round(daySpan)} days. Could be water retention from higher carb/sodium days — check the pattern below.`);
    } else {
      insights.push(`⚖️ Weight is flat over the past ${Math.round(daySpan)} days (${first.weight} → ${last.weight}). Plateau — might need to adjust intake or add exercise days.`);
    }
  }
  if (allTimeWeights.length >= 2) {
    const total = Math.round((allTimeWeights[0].weight - allTimeWeights[allTimeWeights.length - 1].weight) * 10) / 10;
    if (total > 0) insights.push(`🏆 Total progress: down ${total} lbs from ${allTimeWeights[0].weight} → ${allTimeWeights[allTimeWeights.length - 1].weight}.`);
  }

  // --- Calorie averages ---
  const avgCal = Math.round(days.reduce((s, d) => s + d.calories, 0) / days.length);
  const avgNet = Math.round(days.reduce((s, d) => s + d.net, 0) / days.length);
  insights.push(`🔥 Avg daily intake: ${avgCal} kcal | Avg net (after exercise): ${avgNet} kcal over ${days.length} logged days.`);

  // --- Swing days ---
  const highDays = days.filter(d => d.net > avgNet * 1.4).sort((a, b) => b.net - a.net);
  const lowDays = days.filter(d => d.net < avgNet * 0.5 && d.calories > 0).sort((a, b) => a.net - b.net);

  if (highDays.length > 0) {
    const worst = highDays[0];
    const topFood = worst.topFoods.sort((a, b) => b.calories - a.calories)[0];
    insights.push(`⚠️ Highest day: ${worst.date} at ${Math.round(worst.net)} net kcal. Biggest contributor: ${topFood.name} (${topFood.calories} kcal).`);
    if (highDays.length > 1) {
      insights.push(`📊 ${highDays.length} swing days above ${Math.round(avgNet * 1.4)} kcal: ${highDays.map(d => d.date.slice(5)).join(", ")}.`);
    }
  }

  if (lowDays.length > 0) {
    insights.push(`💡 Very low days (under ${Math.round(avgNet * 0.5)} kcal): ${lowDays.map(d => `${d.date.slice(5)} (${Math.round(d.calories)})`).join(", ")}. Extreme restriction can slow metabolism and lead to binge swings.`);
  }

  // --- Problem foods (highest calorie items across all days) ---
  const foodCals = new Map<string, { total: number; count: number }>();
  for (const d of days) {
    for (const f of d.topFoods) {
      const cur = foodCals.get(f.name) || { total: 0, count: 0 };
      cur.total += f.calories;
      cur.count += 1;
      foodCals.set(f.name, cur);
    }
  }
  const topCalFoods = [...foodCals.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 3);
  if (topCalFoods.length > 0) {
    const items = topCalFoods.map(([name, { total, count }]) =>
      `${name} (${total} kcal total, ${count}x)`
    ).join(" · ");
    insights.push(`🍽️ Top calorie sources this period: ${items}.`);
  }

  // --- Macro balance ---
  const avgProtein = Math.round(days.reduce((s, d) => s + d.protein, 0) / days.length);
  const avgCarbs = Math.round(days.reduce((s, d) => s + d.carbs, 0) / days.length);
  const avgFat = Math.round(days.reduce((s, d) => s + d.fat, 0) / days.length);
  insights.push(`📐 Avg macros: ${avgProtein}g protein · ${avgCarbs}g carbs · ${avgFat}g fat.`);

  if (targetProtein && avgProtein < targetProtein * 0.8) {
    insights.push(`🥩 Protein is low — averaging ${avgProtein}g vs ${Math.round(targetProtein)}g target. Prioritize lean protein to preserve muscle during deficit.`);
  }

  // --- Exercise impact ---
  const exerciseDays = days.filter(d => d.burned > 0);
  if (exerciseDays.length > 0) {
    const totalBurned = exerciseDays.reduce((s, d) => s + d.burned, 0);
    insights.push(`🏃 ${exerciseDays.length} exercise days, ${totalBurned} total kcal burned. That's ~${Math.round(totalBurned / 3500 * 10) / 10} lbs worth of deficit from exercise alone.`);
  } else {
    insights.push(`🏃 No exercise logged in this period. Even light walking adds up — 3 miles at 5% incline burns ~300 kcal.`);
  }

  // --- Consistency check ---
  const calVariance = days.map(d => d.net);
  const min = Math.min(...calVariance);
  const max = Math.max(...calVariance);
  if (max - min > 1000) {
    insights.push(`🎢 Big swings: ${Math.round(min)} to ${Math.round(max)} net kcal range. High variance can stall progress — aim for more consistent days.`);
  }

  // --- Target check ---
  if (targetCal) {
    const overDays = days.filter(d => d.net > targetCal);
    const underDays = days.filter(d => d.net <= targetCal);
    insights.push(`🎯 ${underDays.length}/${days.length} days at or under ${Math.round(targetCal)} kcal target. ${overDays.length} days over.`);
  }

  return NextResponse.json({ insights, days: days.map(d => ({ date: d.date, net: Math.round(d.net), calories: Math.round(d.calories), burned: d.burned })) });
}
