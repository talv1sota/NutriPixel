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

function buildDays(
  logs: { date: string; amount: number; food: { name: string; calories: number; protein: number; carbs: number; fat: number } }[],
  exercises: { date: string; caloriesBurned: number }[],
): DayData[] {
  const byDate = new Map<string, DayData>();
  for (const log of logs) {
    const d = byDate.get(log.date) || {
      date: log.date, calories: 0, protein: 0, carbs: 0, fat: 0, burned: 0, net: 0, topFoods: [],
    };
    const cal = log.food.calories * log.amount / 100;
    d.calories += cal;
    d.protein += log.food.protein * log.amount / 100;
    d.carbs += log.food.carbs * log.amount / 100;
    d.fat += log.food.fat * log.amount / 100;
    d.topFoods.push({ name: log.food.name, calories: Math.round(cal) });
    byDate.set(log.date, d);
  }
  for (const ex of exercises) {
    const d = byDate.get(ex.date);
    if (d) d.burned += ex.caloriesBurned;
  }
  return [...byDate.values()]
    .map(d => ({ ...d, net: d.calories - d.burned }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function analyzeWindow(label: string, days: DayData[], weights: { date: string; weight: number }[], from: string, targetCal: number | null, targetProtein: number | null) {
  const insights: string[] = [];
  const w = weights.filter(w => w.date >= from);

  if (days.length === 0) {
    insights.push(`No logged days in the ${label} window.`);
    return insights;
  }

  // Weight trend
  if (w.length >= 2) {
    const first = w[0];
    const last = w[w.length - 1];
    const diff = Math.round((last.weight - first.weight) * 10) / 10;
    const daySpan = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24);
    const weeklyRate = daySpan > 0 ? Math.round((diff / daySpan) * 7 * 10) / 10 : 0;
    if (diff < -0.3) {
      insights.push(`📉 Down ${Math.abs(diff)} lbs this ${label} (${Math.abs(weeklyRate)} lbs/week).`);
    } else if (diff > 0.3) {
      insights.push(`📈 Up ${diff} lbs this ${label}. Likely water/sodium — check high-carb days.`);
    } else {
      insights.push(`⚖️ Weight flat this ${label} (${first.weight} → ${last.weight}). Plateau zone.`);
    }
  }

  // Averages
  const avgCal = Math.round(days.reduce((s, d) => s + d.calories, 0) / days.length);
  const avgNet = Math.round(days.reduce((s, d) => s + d.net, 0) / days.length);
  insights.push(`🔥 Avg intake: ${avgCal} kcal | Net: ${avgNet} kcal (${days.length} days).`);

  // Swing days
  const highDays = days.filter(d => d.net > avgNet * 1.4).sort((a, b) => b.net - a.net);
  const lowDays = days.filter(d => d.net < avgNet * 0.5 && d.calories > 0);

  if (highDays.length > 0) {
    const worst = highDays[0];
    const topFood = worst.topFoods.sort((a, b) => b.calories - a.calories)[0];
    insights.push(`⚠️ Highest: ${worst.date.slice(5)} (${Math.round(worst.net)} net). Top item: ${topFood.name} (${topFood.calories} kcal).`);
  }

  if (lowDays.length > 0) {
    insights.push(`💡 Very low days: ${lowDays.map(d => d.date.slice(5)).join(", ")}. Extreme restriction can trigger swings.`);
  }

  // Consistency
  const nets = days.map(d => d.net);
  const range = Math.round(Math.max(...nets)) - Math.round(Math.min(...nets));
  if (range > 1000) {
    insights.push(`🎢 ${Math.round(Math.min(...nets))} to ${Math.round(Math.max(...nets))} kcal range. More consistency = steadier results.`);
  }

  // Macros
  const avgP = Math.round(days.reduce((s, d) => s + d.protein, 0) / days.length);
  const avgC = Math.round(days.reduce((s, d) => s + d.carbs, 0) / days.length);
  const avgF = Math.round(days.reduce((s, d) => s + d.fat, 0) / days.length);
  insights.push(`📐 Avg macros: ${avgP}g P · ${avgC}g C · ${avgF}g F.`);

  if (targetProtein && avgP < targetProtein * 0.8) {
    insights.push(`🥩 Protein low — ${avgP}g vs ${Math.round(targetProtein)}g target. Prioritize lean protein.`);
  }

  // Exercise
  const exDays = days.filter(d => d.burned > 0);
  if (exDays.length > 0) {
    const total = exDays.reduce((s, d) => s + d.burned, 0);
    insights.push(`🏃 ${exDays.length} exercise days, ${total} kcal burned (~${Math.round(total / 3500 * 10) / 10} lbs).`);
  } else {
    insights.push(`🏃 No exercise this ${label}. Walking 3mi @ 5% incline ≈ 300 kcal.`);
  }

  // Target
  if (targetCal) {
    const under = days.filter(d => d.net <= targetCal).length;
    insights.push(`🎯 ${under}/${days.length} days at/under ${Math.round(targetCal)} kcal target.`);
  }

  // Top calorie foods
  const foodCals = new Map<string, { total: number; count: number }>();
  for (const d of days) {
    for (const f of d.topFoods) {
      const cur = foodCals.get(f.name) || { total: 0, count: 0 };
      cur.total += f.calories;
      cur.count += 1;
      foodCals.set(f.name, cur);
    }
  }
  const top3 = [...foodCals.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 3);
  if (top3.length > 0) {
    insights.push(`🍽️ Top sources: ${top3.map(([n, { total, count }]) => `${n} (${total} kcal, ${count}x)`).join(" · ")}.`);
  }

  return insights;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allFrom = dateNDaysAgo(29);
  const to = todayStr();

  const [logs, exercises, weights, goal] = await Promise.all([
    prisma.foodLog.findMany({
      where: { userId: session.userId, date: { gte: allFrom, lte: to } },
      include: { food: true },
      orderBy: { date: "asc" },
    }),
    prisma.exercise.findMany({
      where: { userId: session.userId, date: { gte: allFrom, lte: to } },
    }),
    prisma.weightEntry.findMany({
      where: { userId: session.userId },
      orderBy: { date: "asc" },
    }),
    prisma.goal.findFirst({ where: { userId: session.userId } }),
  ]);

  const allDays = buildDays(logs, exercises);
  const targetCal = goal?.targetCalories ?? null;
  const targetProtein = goal?.targetProtein ?? goal?.minProtein ?? null;

  // Today's snapshot
  const todayData = allDays.find(d => d.date === to);
  const todayInsights: string[] = [];
  if (todayData) {
    todayInsights.push(`Today so far: ${Math.round(todayData.calories)} kcal eaten, ${todayData.burned} burned, ${Math.round(todayData.net)} net.`);
    if (targetCal) {
      const remaining = Math.round(targetCal - todayData.net);
      todayInsights.push(remaining > 0
        ? `${remaining} kcal remaining for today.`
        : `Over target by ${Math.abs(remaining)} kcal.`
      );
    }
    const todayTop = todayData.topFoods.sort((a, b) => b.calories - a.calories).slice(0, 2);
    if (todayTop.length > 0) {
      todayInsights.push(`Biggest items: ${todayTop.map(f => `${f.name} (${f.calories})`).join(", ")}.`);
    }
  } else {
    todayInsights.push("Nothing logged today yet.");
  }

  // Weekly (7 days)
  const weekFrom = dateNDaysAgo(6);
  const weekDays = allDays.filter(d => d.date >= weekFrom);
  const weekInsights = analyzeWindow("week", weekDays, weights, weekFrom, targetCal, targetProtein);

  // Monthly (30 days)
  const monthInsights = analyzeWindow("month", allDays, weights, allFrom, targetCal, targetProtein);

  // Overall progress
  const overall: string[] = [];
  if (weights.length >= 2) {
    const total = Math.round((weights[0].weight - weights[weights.length - 1].weight) * 10) / 10;
    const totalDays = (new Date(weights[weights.length - 1].date).getTime() - new Date(weights[0].date).getTime()) / (1000 * 60 * 60 * 24);
    if (total > 0) {
      overall.push(`🏆 Total: down ${total} lbs (${weights[0].weight} → ${weights[weights.length - 1].weight}) over ${Math.round(totalDays)} days.`);
      if (goal?.targetWeight) {
        const toGo = Math.round((weights[weights.length - 1].weight - goal.targetWeight) * 10) / 10;
        if (toGo > 0) overall.push(`🎯 ${toGo} lbs to goal (${goal.targetWeight}).`);
        else overall.push(`🎉 You've reached your goal weight!`);
      }
    }
  }

  // Daily chart data
  const days30 = allDays.map(d => ({ date: d.date, net: Math.round(d.net), calories: Math.round(d.calories), burned: d.burned }));

  return NextResponse.json({ today: todayInsights, week: weekInsights, month: monthInsights, overall, days: days30 });
}
