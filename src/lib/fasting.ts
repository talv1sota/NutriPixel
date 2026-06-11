// Domain logic for the fasting feature: presets, the "what your body is doing"
// timeline, and small pure helpers shared by the page and (potentially) the API.
//
// Supports both intermittent (12–23h) and extended / multi-day fasts (24h+),
// so the stage timeline runs all the way out to 72h+.

export interface FastingProtocol {
  key: string;
  label: string;     // e.g. "16:8"
  name: string;      // e.g. "Leangains"
  goalHours: number;
  blurb: string;
}

// Ordered shortest → longest. "custom" is handled separately in the UI.
export const FASTING_PROTOCOLS: FastingProtocol[] = [
  { key: "12:12", label: "12:12", name: "Circadian",   goalHours: 12, blurb: "Gentle daily fast. Great starting point." },
  { key: "14:10", label: "14:10", name: "Beginner",    goalHours: 14, blurb: "An easy step up — fat-burning begins." },
  { key: "16:8",  label: "16:8",  name: "Leangains",   goalHours: 16, blurb: "The classic. Autophagy starts to switch on." },
  { key: "18:6",  label: "18:6",  name: "Warrior-lite", goalHours: 18, blurb: "Deeper ketosis & cellular cleanup." },
  { key: "20:4",  label: "20:4",  name: "Warrior",     goalHours: 20, blurb: "One small eating window. Strong autophagy." },
  { key: "omad",  label: "23:1",  name: "OMAD",        goalHours: 23, blurb: "One meal a day. Maximal daily benefits." },
  { key: "24h",   label: "24h",   name: "Full-day",    goalHours: 24, blurb: "A full day. Glycogen fully depleted." },
  { key: "36h",   label: "36h",   name: "Monk fast",   goalHours: 36, blurb: "Extended fast. Deep autophagy & repair." },
  { key: "48h",   label: "48h",   name: "2-day",       goalHours: 48, blurb: "Immune & stem-cell renewal territory." },
  { key: "72h",   label: "72h",   name: "3-day",       goalHours: 72, blurb: "Advanced. Profound cellular regeneration." },
  { key: "100h",  label: "100h",  name: "4-day+",      goalHours: 100, blurb: "Hardcore. Prolonged autophagy — refeed with care." },
];

export interface FastingStage {
  hour: number;      // hours into the fast at which this stage begins
  emoji: string;
  title: string;
  // The "at X hours, your body…" insight.
  body: string;
  color: string;
}

// The metabolic timeline. The "current" stage is the last one whose `hour`
// is <= elapsed hours; the "next" stage is the one after it. Values reflect the
// commonly-cited intermittent/extended-fasting science (approximate — bodies
// vary with diet, activity and metabolism).
export const FASTING_STAGES: FastingStage[] = [
  { hour: 0,  emoji: "🍽️", title: "Fed state",          color: "#ffc145",
    body: "Your body is digesting and absorbing your last meal. Blood sugar and insulin are elevated, and fuel is being stored away." },
  { hour: 3,  emoji: "📉", title: "Blood sugar settling", color: "#ffb145",
    body: "Insulin is falling as the meal clears. Your body begins tapping stored glycogen for energy rather than incoming food." },
  { hour: 8,  emoji: "🔥", title: "Glycogen burning",     color: "#ff9a4d",
    body: "Liver glycogen is being drawn down. With glucose running lower, your body is starting to shift toward burning fat." },
  { hour: 12, emoji: "🔀", title: "Metabolic switch",     color: "#ff7a5c",
    body: "Glycogen is largely spent and the 'metabolic switch' flips: you move into fat-burning. Early ketone production begins." },
  { hour: 14, emoji: "💧", title: "Ketosis rising",       color: "#e84d98",
    body: "Your liver is converting fat into ketones for fuel. Human growth hormone climbs and insulin sensitivity improves." },
  { hour: 16, emoji: "♻️", title: "Autophagy switches on", color: "#c77dff",
    body: "Cellular 'spring cleaning' (autophagy) ramps up — cells recycle damaged parts. Fat-burning is now well established." },
  { hour: 18, emoji: "⚡", title: "Deeper ketosis",       color: "#9b5de5",
    body: "Ketones are powering your brain and body. Norepinephrine supports your metabolism, and mental clarity often sharpens." },
  { hour: 24, emoji: "🧹", title: "Full-day cleanse",     color: "#7b6cf6",
    body: "Glycogen is fully depleted and autophagy is significantly elevated. Inflammation markers begin to fall. Hunger often eases." },
  { hour: 36, emoji: "🛠️", title: "Deep repair",          color: "#5b8def",
    body: "Autophagy is running deep and growth hormone is markedly elevated, protecting muscle while your cells repair and recycle." },
  { hour: 48, emoji: "🧬", title: "Immune renewal",       color: "#5bb8e8",
    body: "Stem-cell production and immune-cell regeneration rise. Inflammation is low and insulin sensitivity keeps improving." },
  { hour: 72, emoji: "🌟", title: "Profound regeneration", color: "#6bcb77",
    body: "Sustained deep autophagy and immune reset. Your body is rebuilding from the cellular level up. Advanced territory — refeed mindfully." },
  { hour: 96, emoji: "🏔️", title: "Prolonged fast",       color: "#4fb39a",
    body: "Day four: ketones fuel your brain, autophagy and growth hormone stay elevated to spare muscle, and you're deep in fat-adapted repair. This is serious territory — stay hydrated, watch your electrolytes, and break the fast gently with light food." },
];

// Rotating motivation. Index by elapsed seconds so it changes over the fast
// without needing Math.random (which is also unavailable in some runtimes).
export const FASTING_MOTIVATION: string[] = [
  "Every hour fasted is your body healing itself. Stay strong ✦",
  "Hunger is a wave — it rises, then it passes. Ride it out 🌊",
  "Discipline is choosing what you want most over what you want now.",
  "You're not starving. You're sourcing energy from within 🔥",
  "The fast is working even when you can't feel it. Trust the process ✧",
  "Drink water. Breathe. You are stronger than the craving.",
  "Your future self is grateful for the hour you're in right now.",
  "Autophagy doesn't quit, and neither do you ♻️",
  "Comfort is the enemy of progress. You've got this 💪",
  "One more hour. Then one more. That's how it's done.",
];

export interface FastingSessionDTO {
  id: number;
  startTime: string; // ISO
  endTime: string | null;
  goalHours: number;
}

export function currentStageIndex(elapsedHours: number): number {
  let idx = 0;
  for (let i = 0; i < FASTING_STAGES.length; i++) {
    if (elapsedHours >= FASTING_STAGES[i].hour) idx = i;
    else break;
  }
  return idx;
}

// "1d 4h 32m 09s" style. Always shows seconds; drops the day part under 24h.
export function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (days > 0) return `${days}d ${hours}h ${pad(mins)}m ${pad(secs)}s`;
  return `${hours}h ${pad(mins)}m ${pad(secs)}s`;
}

// Compact form for history rows: "16h 12m" or "2d 3h".
export function formatDurationShort(ms: number): string {
  if (ms < 0) ms = 0;
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
