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

function dayName(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
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
  const weekFrom = dateNDaysAgo(6);
  const weekDays = allDays.filter(d => d.date >= weekFrom);

  const insights: string[] = [];

  if (allDays.length === 0) {
    return NextResponse.json({ insights: ["Start logging food to get personalized insights."], days: [] });
  }

  // ============ OVERALL PROGRESS ============
  insights.push("##Progress");
  if (weights.length >= 2) {
    const total = Math.round((weights[0].weight - weights[weights.length - 1].weight) * 10) / 10;
    const totalDays = Math.round((new Date(weights[weights.length - 1].date).getTime() - new Date(weights[0].date).getTime()) / (1000 * 60 * 60 * 24));
    if (total > 0) {
      insights.push(`You've lost ${total} lbs total (${weights[0].weight} → ${weights[weights.length - 1].weight}) over ${totalDays} days. That's solid, sustainable progress — about ${Math.round(total / totalDays * 7 * 10) / 10} lbs/week average.`);
    }
    if (goal?.targetWeight) {
      const toGo = Math.round((weights[weights.length - 1].weight - goal.targetWeight) * 10) / 10;
      if (toGo > 0) insights.push(`You're ${toGo} lbs from your goal of ${goal.targetWeight}. The last few pounds are always the slowest — your body has less to lose and fights harder to hold on. Stay patient.`);
      else insights.push(`You've hit your goal weight. Time to think about maintenance — gradually increase calories by 100-200/day and find your equilibrium.`);
    }
  }

  // ============ WEIGHT TREND (RECENT) ============
  insights.push("##Weight");
  const recentWeights = weights.filter(w => w.date >= weekFrom);
  const twoWeekWeights = weights.filter(w => w.date >= dateNDaysAgo(13));
  if (twoWeekWeights.length >= 2) {
    const first = twoWeekWeights[0];
    const last = twoWeekWeights[twoWeekWeights.length - 1];
    const diff = Math.round((last.weight - first.weight) * 10) / 10;
    const daySpan = Math.round((new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24));

    if (Math.abs(diff) <= 0.5 && daySpan >= 7) {
      // Plateau — dig into why
      const avgCarbs = weekDays.length > 0 ? Math.round(weekDays.reduce((s, d) => s + d.carbs, 0) / weekDays.length) : 0;
      const avgNet = weekDays.length > 0 ? Math.round(weekDays.reduce((s, d) => s + d.net, 0) / weekDays.length) : 0;
      let reason = `Your weight has been flat for ${daySpan} days (${first.weight} → ${last.weight}).`;

      if (avgNet < 800) {
        reason += ` Your net intake is very low (~${avgNet} kcal/day), which can actually stall weight loss — your body downregulates metabolism to match. Consider eating a bit more consistently around 1000-1200 kcal to keep your metabolism active.`;
      } else if (avgCarbs > 120) {
        reason += ` You're averaging ${avgCarbs}g carbs/day. Higher carb days cause glycogen storage (each gram holds ~3g water). This can mask fat loss on the scale for 3-5 days. If you've had pasta, rice, or chips recently, the scale will catch up once glycogen normalizes.`;
      } else {
        reason += ` At your current weight, your deficit is smaller than when you started. Your body also adapts to prolonged restriction. Try adding 2-3 walking sessions this week or cycling your calories (lower on rest days, slightly higher on active days).`;
      }
      insights.push(reason);
    } else if (diff > 0.5) {
      // Went up
      const highCarbDays = weekDays.filter(d => d.carbs > 100);
      let reason = `Scale went up ${diff} lbs recently.`;
      if (highCarbDays.length > 0) {
        reason += ` You had ${highCarbDays.length} higher-carb day(s) (${highCarbDays.map(d => dayName(d.date)).join(", ")}). Each 100g of stored glycogen holds ~300g of water. This is water weight, not fat gain — it'll come off in 2-3 days of normal eating.`;
      } else {
        reason += ` This is likely normal daily fluctuation from sodium, hydration, or digestion timing. Don't react to a single weigh-in — look at the 7-day trend.`;
      }
      insights.push(reason);
    } else if (diff < -0.5) {
      // Check if the drop is plausible as fat loss or mostly water
      const periodDays = allDays.filter(d => d.date >= first.date && d.date <= last.date);
      const avgNetPeriod = periodDays.length > 0 ? periodDays.reduce((s, d) => s + d.net, 0) / periodDays.length : 900;
      // Rough TDEE estimate
      const cw = last.weight;
      const estTdee = cw * 12; // rough sedentary estimate
      const dailyDeficit = estTdee - avgNetPeriod;
      const expectedFatLoss = Math.round((dailyDeficit * daySpan / 3500) * 10) / 10;

      if (Math.abs(diff) > expectedFatLoss * 2 && Math.abs(diff) > 1.5) {
        // Drop is way bigger than deficit explains — it's mostly water
        insights.push(`Down ${Math.abs(diff)} lbs in ${daySpan} days. Your calorie deficit only accounts for ~${expectedFatLoss} lbs of that, so a good chunk is water weight coming off (maybe from lower carb/sodium days recently, or post-period water release). The fat loss underneath is real — the water drop just makes the scale look more dramatic than it is. Don't expect this rate to continue linearly.`);
      } else {
        insights.push(`Down ${Math.abs(diff)} lbs in ${daySpan} days — this lines up well with your deficit. Steady, real progress.`);
      }
    }
  }

  // ============ EATING PATTERNS ============
  insights.push("##Eating Patterns");
  if (weekDays.length >= 3) {
    // Detect feast/famine cycling
    const sorted = [...weekDays].sort((a, b) => a.net - b.net);
    const lowest = sorted[0];
    const highest = sorted[sorted.length - 1];
    const range = highest.net - lowest.net;

    if (range > 800) {
      // Check if high follows low or vice versa
      let cycles = 0;
      for (let i = 1; i < weekDays.length; i++) {
        const prev = weekDays[i - 1].net;
        const curr = weekDays[i].net;
        if ((prev < 500 && curr > 1000) || (prev > 1000 && curr < 500)) cycles++;
      }

      if (cycles >= 2) {
        insights.push(`There's a restrict-then-overeat pattern happening — very low days (like ${dayName(lowest.date)} at ${Math.round(lowest.net)} kcal) followed by higher days (${dayName(highest.date)} at ${Math.round(highest.net)} kcal). This yo-yo pattern is counterproductive: the low days trigger hunger hormones (ghrelin spikes after ~16 hours of undereating), making the next day's overshoot almost inevitable. Aim for consistent 800-1100 kcal days instead of alternating between 200 and 1500.`);
      } else {
        insights.push(`Your intake ranged from ${Math.round(lowest.net)} (${dayName(lowest.date)}) to ${Math.round(highest.net)} kcal (${dayName(highest.date)}) this week. Some variation is fine, but a ${Math.round(range)} kcal swing makes it hard for your body to find a rhythm. Try to keep days within a ~300 kcal range of each other.`);
      }
    }

    // Check for days that are dangerously low
    const subMinDays = weekDays.filter(d => d.calories > 0 && d.calories < 400);
    if (subMinDays.length >= 2) {
      insights.push(`${subMinDays.length} days this week under 400 kcal. Under-fueling this much suppresses thyroid function (T3 drops), increases cortisol, and promotes muscle breakdown. Even on a cut, 800 kcal should be the floor. Your body doesn't distinguish between "dieting" and "starving" — it just slows everything down to survive.`);
    }
  }

  // ============ MACRO DEEP DIVE ============
  insights.push("##Macros");
  const days7 = weekDays.length > 0 ? weekDays : allDays.slice(-7);
  if (days7.length > 0) {
    const avgP = Math.round(days7.reduce((s, d) => s + d.protein, 0) / days7.length);
    const avgC = Math.round(days7.reduce((s, d) => s + d.carbs, 0) / days7.length);
    const avgF = Math.round(days7.reduce((s, d) => s + d.fat, 0) / days7.length);
    const avgCal = Math.round(days7.reduce((s, d) => s + d.calories, 0) / days7.length);

    // Protein
    const currentWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
    const idealProtein = currentWeight ? Math.round(currentWeight * 0.8) : targetProtein;
    if (idealProtein && avgP < idealProtein * 0.7) {
      insights.push(`Protein is critically low at ${avgP}g/day (recommended: ~${idealProtein}g for your weight). During a deficit, protein is non-negotiable — it's what prevents your body from burning muscle for fuel. Without enough protein, up to 25% of weight lost can be lean mass instead of fat. Add greek yogurt, egg whites, chicken breast, or tuna to every day.`);
    } else if (idealProtein && avgP < idealProtein) {
      insights.push(`Protein is at ${avgP}g/day — getting closer but still below the ~${idealProtein}g target for your weight. You're leaving muscle preservation on the table. Even small additions help: one can of tuna = 26g, a cup of greek yogurt = 17g.`);
    } else if (idealProtein && avgP >= idealProtein) {
      insights.push(`Protein is solid at ${avgP}g/day (target: ~${idealProtein}g). This is protecting your lean mass during the cut. Keep it up.`);
    }

    // Fat too low check
    if (avgF < 25 && avgCal > 500) {
      insights.push(`Fat intake is very low (${avgF}g/day). Dietary fat is essential for hormone production — going under 20-25g/day can disrupt estrogen, testosterone, and cortisol levels. Add small amounts of olive oil, avocado, or nuts.`);
    }

    // Carb/sodium and water retention
    const highCarbDays = days7.filter(d => d.carbs > 150);
    if (highCarbDays.length > 0 && recentWeights.length >= 1) {
      const latestW = recentWeights[recentWeights.length - 1];
      const beforeW = weights.filter(w => w.date < highCarbDays[0].date);
      if (beforeW.length > 0) {
        const wBefore = beforeW[beforeW.length - 1].weight;
        if (latestW.weight >= wBefore) {
          insights.push(`High-carb days on ${highCarbDays.map(d => dayName(d.date)).join(", ")} (${highCarbDays.map(d => Math.round(d.carbs) + "g").join(", ")}) likely caused temporary water retention. For every 1g of glycogen stored, your body holds 3-4g of water. A 200g carb day can add 1-2 lbs of water weight that takes 2-3 days to clear. This isn't fat — don't panic-restrict in response.`);
        }
      }
    }
  }

  // ============ FOOD-LEVEL INSIGHTS ============
  insights.push("##Foods");
  // Build per-food stats with protein info
  const foodStats = new Map<string, { totalCal: number; totalProtein: number; count: number }>();
  for (const log of logs) {
    const cal = log.food.calories * log.amount / 100;
    const pro = log.food.protein * log.amount / 100;
    const cur = foodStats.get(log.food.name) || { totalCal: 0, totalProtein: 0, count: 0 };
    cur.totalCal += cal;
    cur.totalProtein += pro;
    cur.count += 1;
    foodStats.set(log.food.name, cur);
  }

  // Separate foods by protein efficiency: cal per gram of protein
  // < 10 cal/g protein = great (lean turkey, chicken, egg whites, tuna)
  // > 25 cal/g protein or low protein = calorie-dense, low-protein
  const calorieSinks = [...foodStats.entries()]
    .filter(([, v]) => {
      const avgCal = v.totalCal / v.count;
      const avgPro = v.totalProtein / v.count;
      const calPerProtein = avgPro > 1 ? avgCal / avgPro : 999;
      return avgCal > 200 && calPerProtein > 20 && v.count >= 2;
    })
    .sort((a, b) => b[1].totalCal - a[1].totalCal)
    .slice(0, 3);

  const proteinMVPs = [...foodStats.entries()]
    .filter(([, v]) => {
      const avgPro = v.totalProtein / v.count;
      const avgCal = v.totalCal / v.count;
      return avgPro > 15 && avgCal > 0 && (avgCal / avgPro) < 12 && v.count >= 2;
    })
    .sort((a, b) => b[1].totalProtein - a[1].totalProtein)
    .slice(0, 3);

  if (proteinMVPs.length > 0) {
    const items = proteinMVPs.map(([name, v]) => {
      const avgP = Math.round(v.totalProtein / v.count);
      const avgC = Math.round(v.totalCal / v.count);
      return `${name} (${avgP}g protein / ${avgC} kcal)`;
    }).join("; ");
    insights.push(`Your best protein-per-calorie foods: ${items}. These are your MVPs — lean, high-protein, and efficient. Build meals around these.`);
  }

  if (calorieSinks.length > 0) {
    const items = calorieSinks.map(([name, v]) => {
      const avg = Math.round(v.totalCal / v.count);
      return `${name} (~${avg} kcal, ${v.count}x)`;
    }).join("; ");
    insights.push(`Calorie-dense, low-protein recurring items: ${items}. These contribute the most calories relative to their nutritional value. Swapping or reducing portions here has the biggest impact without sacrificing protein.`);
  }

  // Zero-calorie drink patterns (positive reinforcement)
  // Only match items that are actually beverages with very low calories per serving
  const zeroDrinks = [...foodStats.entries()].filter(([name, v]) => {
    const avgCal = v.totalCal / v.count;
    const lc = name.toLowerCase();
    const isDrink = lc.includes("sprite") || lc.includes("diet") || lc.includes("iced tea") ||
      lc.includes("espresso") || lc.includes("coffee") || lc.includes("yerba") ||
      lc.includes("green tea") || lc.includes("water");
    return isDrink && avgCal < 25;
  });
  if (zeroDrinks.length > 0) {
    insights.push(`Good habit: reaching for low/zero-calorie drinks (${zeroDrinks.map(([n]) => n).join(", ")}). Liquid calories are the easiest to cut without feeling it.`);
  }

  // ============ EXERCISE PATTERNS ============
  insights.push("##Exercise");
  const exDays = allDays.filter(d => d.burned > 0);
  const noExWeek = weekDays.filter(d => d.burned > 0).length === 0;
  if (noExWeek && exDays.length > 0) {
    insights.push(`No exercise logged this week. You had ${exDays.length} active days in the past month. Even 3 walking sessions per week at your current incline routine adds ~900 kcal/week of deficit — that's roughly a quarter pound per week from exercise alone.`);
  } else if (exDays.length === 0) {
    insights.push(`No exercise logged recently. You don't need to run marathons — your walking pad at 5% incline for 30-45 minutes is a great calorie burner with low injury risk. Try to build a 3-4 day/week habit.`);
  } else if (exDays.length >= 3) {
    const weekEx = weekDays.filter(d => d.burned > 0);
    if (weekEx.length >= 3) {
      insights.push(`${weekEx.length} exercise days this week — great consistency. Regular movement not only burns calories but improves insulin sensitivity, which helps your body partition nutrients toward muscle instead of fat storage.`);
    }
  }

  // ============ PROJECTION / TRAJECTORY ============
  insights.push("##Trajectory");
  const currentWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
  if (currentWeight && weekDays.length >= 3 && goal) {
    const weekAvgNet = Math.round(weekDays.reduce((s, d) => s + d.net, 0) / weekDays.length);
    const weekBurned = weekDays.reduce((s, d) => s + d.burned, 0);

    // Estimate TDEE from goal profile or rough estimate
    const heightIn = goal.height || 64;
    const age = goal.age || 25;
    const kg = currentWeight * 0.453592;
    const cm = heightIn * 2.54;
    const bmr = goal.gender === "male" ? 10 * kg + 6.25 * cm - 5 * age + 5 : 10 * kg + 6.25 * cm - 5 * age - 161;
    const actMult: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    const tdee = Math.round(bmr * (actMult[goal.activityLevel] || 1.2));

    const dailyDeficit = tdee - weekAvgNet;
    const weeklyDeficitCal = dailyDeficit * 7;
    const projectedLbsPerWeek = Math.round((weeklyDeficitCal / 3500) * 10) / 10;

    if (projectedLbsPerWeek > 0 && goal.targetWeight) {
      const lbsToGo = currentWeight - goal.targetWeight;
      if (lbsToGo > 0) {
        const weeksToGoal = Math.round(lbsToGo / projectedLbsPerWeek);
        const goalDate = new Date();
        goalDate.setDate(goalDate.getDate() + weeksToGoal * 7);
        const goalDateStr = goalDate.toLocaleDateString("en-US", { month: "long", day: "numeric" });

        if (projectedLbsPerWeek > 2.5) {
          insights.push(`⚡ At your current pace (~${projectedLbsPerWeek} lbs/week), you'd hit ${goal.targetWeight} by ${goalDateStr}. But this rate is aggressive — losing more than 2 lbs/week increases muscle loss and makes rebound more likely. Consider slowing down slightly for more sustainable results.`);
        } else if (projectedLbsPerWeek > 1) {
          insights.push(`📍 Trajectory: at ~${projectedLbsPerWeek} lbs/week, you're on track to reach ${goal.targetWeight} around ${goalDateStr}. This is a healthy pace. Stay consistent and you'll get there.`);
        } else if (projectedLbsPerWeek > 0.3) {
          insights.push(`📍 Trajectory: ~${projectedLbsPerWeek} lbs/week puts your goal of ${goal.targetWeight} around ${goalDateStr}. Progress is real but slow. Adding 2-3 exercise sessions per week could nearly double your rate.`);
        } else {
          insights.push(`🐌 At current intake, you're barely in deficit (~${projectedLbsPerWeek} lbs/week). At this rate, reaching ${goal.targetWeight} would take ${weeksToGoal}+ weeks. Either reduce intake by 200-300 kcal/day or add consistent exercise to move the needle.`);
        }
      }
    } else if (projectedLbsPerWeek <= 0) {
      insights.push(`🚨 Based on this week's eating, you're at or above maintenance (~${tdee} kcal TDEE vs ~${weekAvgNet} net intake). Weight loss has stalled or will reverse if this continues. You need to either cut ~${Math.abs(Math.round(dailyDeficit))} kcal/day or burn more through exercise.`);
    }

    // Trend direction change detection
    if (twoWeekWeights.length >= 3) {
      const midpoint = Math.floor(twoWeekWeights.length / 2);
      const firstHalf = twoWeekWeights.slice(0, midpoint);
      const secondHalf = twoWeekWeights.slice(midpoint);
      const firstAvg = firstHalf.reduce((s, w) => s + w.weight, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, w) => s + w.weight, 0) / secondHalf.length;
      const firstTrend = firstHalf.length >= 2 ? firstHalf[firstHalf.length - 1].weight - firstHalf[0].weight : 0;
      const secondTrend = secondHalf.length >= 2 ? secondHalf[secondHalf.length - 1].weight - secondHalf[0].weight : 0;

      if (firstTrend < -0.3 && secondTrend > 0.1) {
        insights.push(`📊 Your downward trend appears to be reversing — weight was dropping in the first half of the past 2 weeks but has ticked up recently. Check if your intake crept up or exercise dropped off. Early intervention now prevents a full stall.`);
      } else if (firstTrend > 0.1 && secondTrend < -0.3) {
        insights.push(`📊 Good news — after a slight uptick, your weight is trending down again. Whatever you adjusted is working. Keep this week's habits going.`);
      }
    }
  }

  // ============ WEEKLY SUMMARY ============
  if (weekDays.length > 0) {
    const weekAvgNet = Math.round(weekDays.reduce((s, d) => s + d.net, 0) / weekDays.length);
    const weekAvgCal = Math.round(weekDays.reduce((s, d) => s + d.calories, 0) / weekDays.length);
    insights.push(`This week: averaging ${weekAvgCal} kcal eaten, ${weekAvgNet} net after exercise, across ${weekDays.length} logged days.`);
  }

  return NextResponse.json({ insights });
}
