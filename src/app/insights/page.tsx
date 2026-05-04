"use client";

import { useEffect, useState } from "react";
import Window from "@/components/Window";

interface DayData {
  date: string;
  net: number;
  calories: number;
  burned: number;
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<string[]>([]);
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => r.json())
      .then((d) => {
        if (d.insights) setInsights(d.insights);
        if (d.days) setDays(d.days);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-5 pt-3 max-w-lg mx-auto">
        <div className="pixel-label text-center" style={{ fontSize: "10px" }}>✧ Insights ✧</div>
        <div className="text-center py-8"><p className="vt-text">analyzing your data...</p></div>
      </div>
    );
  }

  const maxNet = Math.max(...days.map((d) => d.net), 1);

  return (
    <div className="space-y-5 pt-3 max-w-lg mx-auto">
      <div className="pixel-label text-center" style={{ fontSize: "10px" }}>✧ Insights ✧</div>

      {insights.length > 0 && (
        <Window title="🧠 Your Analysis">
          <div className="space-y-4">
            {insights.map((insight, i) => (
              <div
                key={i}
                className="text-xs leading-relaxed"
                style={{
                  color: "#4a3560",
                  padding: "8px 0",
                  borderBottom: i < insights.length - 1 ? "1px solid #e8d4f5" : "none",
                }}
              >
                {insight}
              </div>
            ))}
          </div>
        </Window>
      )}

      {days.length > 0 && (
        <Window title="📊 Daily Net Calories">
          <div className="space-y-1">
            {days.map((d) => {
              const pct = Math.min((d.net / maxNet) * 100, 100);
              const isHigh = d.net > 1100;
              const isLow = d.calories > 0 && d.net < 400;
              return (
                <div key={d.date} className="flex items-center gap-2 text-[10px]">
                  <span style={{ width: 42, color: "#9b80b8", flexShrink: 0 }}>{d.date.slice(5)}</span>
                  <div className="flex-1 h-3 rounded" style={{ background: "#f5eeff" }}>
                    <div className="h-full rounded" style={{
                      width: `${pct}%`,
                      background: isHigh ? "#ff6b6b" : isLow ? "#ffc145" : "#6bcb77",
                    }} />
                  </div>
                  <span className="font-bold" style={{
                    width: 40, textAlign: "right", flexShrink: 0,
                    color: isHigh ? "#ff4444" : isLow ? "#dda520" : "#6bcb77",
                  }}>{d.net}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-4 mt-3 text-[9px]" style={{ color: "#9b80b8" }}>
            <span><span style={{ color: "#6bcb77" }}>■</span> on track</span>
            <span><span style={{ color: "#ffc145" }}>■</span> very low</span>
            <span><span style={{ color: "#ff6b6b" }}>■</span> high</span>
          </div>
        </Window>
      )}
    </div>
  );
}
