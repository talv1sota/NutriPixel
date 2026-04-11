"use client";

import { useState, useEffect } from "react";
import MoodTracker from "@/components/MoodTracker";
import { todayStr, formatDate } from "@/lib/helpers";

interface MoodEntry {
  id: number;
  date: string;
  tags: string;
  notes: string | null;
}

export default function MoodPage() {
  const [date, setDate] = useState(todayStr());
  const [history, setHistory] = useState<MoodEntry[]>([]);

  useEffect(() => {
    fetch("/api/mood").then(r => r.json()).then(setHistory);
  }, [date]);

  const changeDate = (d: number) => {
    const dt = new Date(date + "T12:00:00");
    dt.setDate(dt.getDate() + d);
    setDate(dt.toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-5 pt-3 max-w-lg mx-auto">
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => changeDate(-1)} className="btn-blue btn-sm">◀ Prev</button>
        <div className="pixel-label text-center" style={{ fontSize: "10px", minWidth: 120 }}>
          {date === todayStr() ? "✧ Today ✧" : formatDate(date)}
        </div>
        <button onClick={() => changeDate(1)} className="btn-blue btn-sm">Next ▶</button>
      </div>

      <MoodTracker date={date} />

      {history.length > 0 && (
        <div className="window slidein">
          <div className="window-title">
            <span>📖 History</span>
            <div className="decorations">
              <div className="dot dot-red" />
              <div className="dot dot-yellow" />
              <div className="dot dot-green" />
            </div>
          </div>
          <div className="window-body">
            <div className="max-h-80 overflow-y-auto space-y-3">
              {[...history].reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="cursor-pointer"
                  onClick={() => setDate(entry.date)}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    background: date === entry.date ? "#f5eeff" : "transparent",
                    border: `2px solid ${date === entry.date ? "#d4b8e8" : "transparent"}`,
                  }}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold" style={{ color: "#9b5de5" }}>
                      {formatDate(entry.date)}
                    </span>
                  </div>
                  {entry.tags && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {entry.tags.split(",").filter(Boolean).map((tag) => (
                        <span key={tag} className="badge text-[10px]">{tag}</span>
                      ))}
                    </div>
                  )}
                  {entry.notes && (
                    <p className="text-xs italic" style={{ color: "#7a5a9e" }}>
                      &quot;{entry.notes}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
