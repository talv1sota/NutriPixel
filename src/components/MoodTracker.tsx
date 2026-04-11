"use client";

import { useEffect, useState, useCallback } from "react";
import Window from "./Window";

interface MoodTrackerProps {
  date: string;
}

interface MoodEntry {
  id?: number;
  date: string;
  tags: string;
  notes: string | null;
}

// Mood tags — grouped by vibe
const MOOD_TAGS = [
  // positive
  { label: "content", emoji: "🙂", color: "#b5ead7" },
  { label: "energized", emoji: "⚡", color: "#ffc145" },
  { label: "happy", emoji: "😊", color: "#ff8ec4" },
  { label: "focused", emoji: "🎯", color: "#5bb8e8" },
  { label: "motivated", emoji: "💪", color: "#c8a0e8" },
  { label: "calm", emoji: "🌸", color: "#a8d8ea" },
  // negative
  { label: "tired", emoji: "🥱", color: "#d4b8e8" },
  { label: "irritable", emoji: "😤", color: "#ff8a80" },
  { label: "anxious", emoji: "😰", color: "#ffb8d9" },
  { label: "stressed", emoji: "😵", color: "#e8a0d0" },
  { label: "sad", emoji: "😢", color: "#a8c8e8" },
  { label: "moody", emoji: "😒", color: "#c0a0d8" },
  // body
  { label: "bloated", emoji: "🎈", color: "#e8c0a0" },
  { label: "hungry", emoji: "🍽️", color: "#ff9c9c" },
  { label: "full", emoji: "😋", color: "#fff59d" },
  { label: "PMS", emoji: "🩸", color: "#ff6b8a" },
  { label: "cramps", emoji: "💢", color: "#ff85a2" },
  { label: "headache", emoji: "🤕", color: "#c5b5e0" },
];

export default function MoodTracker({ date }: MoodTrackerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [hasEntry, setHasEntry] = useState(false);

  const fetchEntry = useCallback(async () => {
    const res = await fetch(`/api/mood?date=${date}`);
    const data: MoodEntry | null = await res.json();
    if (data) {
      setSelected(new Set(data.tags ? data.tags.split(",").filter(Boolean) : []));
      setNotes(data.notes || "");
      setHasEntry(true);
    } else {
      setSelected(new Set());
      setNotes("");
      setHasEntry(false);
    }
  }, [date]);

  useEffect(() => { fetchEntry(); }, [fetchEntry]);

  const toggleTag = (tag: string) => {
    setSelected(s => {
      const next = new Set(s);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleSave = async () => {
    await fetch("/api/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        tags: Array.from(selected).join(","),
        notes,
      }),
    });
    setHasEntry(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Window title="✧ How are you feeling? ✧">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {MOOD_TAGS.map((t) => {
            const isSelected = selected.has(t.label);
            return (
              <button
                key={t.label}
                onClick={() => toggleTag(t.label)}
                className="transition-all"
                style={{
                  padding: "6px 12px",
                  borderRadius: 20,
                  background: isSelected ? t.color : "#f5eeff",
                  border: `2px solid ${isSelected ? t.color : "#e0d0f0"}`,
                  color: isSelected ? "#4a2d6b" : "#8b6a9e",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  boxShadow: isSelected ? `2px 2px 0 ${t.color}80` : "none",
                  transform: isSelected ? "scale(1.03)" : "scale(1)",
                }}
              >
                {t.emoji} {t.label}
              </button>
            );
          })}
        </div>

        <div>
          <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Note (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="dear diary..."
            className="input"
            rows={3}
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />
        </div>

        <button onClick={handleSave} className="btn-pink w-full py-2">
          {saved ? "✦ Saved! ✦" : hasEntry ? "✧ Update ✧" : "✧ Save ✧"}
        </button>
      </div>
    </Window>
  );
}
