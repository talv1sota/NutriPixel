"use client";

import { useEffect, useState } from "react";
import Window from "@/components/Window";

function categorize(text: string) {
  if (text.startsWith("🚨") || text.includes("reverse") || text.includes("stalled") || text.includes("above maintenance")) return "alert";
  if (text.startsWith("⚠️") || text.startsWith("⚡") || text.includes("critically") || text.includes("counterproductive") || text.includes("suppress")) return "warning";
  if (text.startsWith("🏆") || text.startsWith("📍") || text.includes("solid") || text.includes("Keep it up") || text.includes("great consistency") || text.includes("Good habit") || text.includes("Good news")) return "positive";
  return "neutral";
}

const styles = {
  alert: { bg: "#fff0f0", border: "#ff6b6b", accent: "#cc3333", icon: "🚨" },
  warning: { bg: "#fff8ed", border: "#ffc145", accent: "#b8860b", icon: "⚠️" },
  positive: { bg: "#edfff0", border: "#6bcb77", accent: "#2d8a4e", icon: "✓" },
  neutral: { bg: "#f5eeff", border: "#d4b8e8", accent: "#6b4d8a", icon: "→" },
};

export default function InsightsPage() {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => r.json())
      .then((d) => {
        if (d.insights) setInsights(d.insights);
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

  return (
    <div className="space-y-5 pt-3 max-w-lg mx-auto">
      <div className="pixel-label text-center" style={{ fontSize: "10px" }}>✧ Insights ✧</div>

      {insights.length > 0 ? (
        <div className="space-y-3">
          {insights.map((insight, i) => {
            const cat = categorize(insight);
            const s = styles[cat];
            return (
              <div
                key={i}
                className="rounded-lg"
                style={{
                  background: s.bg,
                  border: `1.5px solid ${s.border}`,
                  padding: "12px 14px",
                }}
              >
                <p className="text-xs leading-relaxed" style={{ color: s.accent }}>
                  {insight}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <Window title="🧠 Insights">
          <p className="vt-text text-center py-4">Start logging food to get personalized feedback.</p>
        </Window>
      )}
    </div>
  );
}
