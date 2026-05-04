"use client";

import { useEffect, useState } from "react";
import Window from "@/components/Window";

function categorize(text: string) {
  if (text.startsWith("🚨") || text.includes("reverse") || text.includes("stalled") || text.includes("above maintenance")) return "alert";
  if (text.startsWith("⚠️") || text.startsWith("⚡") || text.includes("critically") || text.includes("counterproductive") || text.includes("suppress")) return "warning";
  if (text.startsWith("🏆") || text.startsWith("📍") || text.includes("solid") || text.includes("Keep it up") || text.includes("great consistency") || text.includes("Good habit") || text.includes("Good news") || text.includes("MVPs")) return "positive";
  return "neutral";
}

const cardColors = {
  alert: { bg: "#fff0f0", border: "#ffcccc", color: "#cc3333" },
  warning: { bg: "#fff8ed", border: "#ffe4b5", color: "#b8860b" },
  positive: { bg: "#edfff0", border: "#c8f0cc", color: "#2d8a4e" },
  neutral: { bg: "transparent", border: "transparent", color: "#4a3560" },
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

      <Window title="🧠 Your Analysis">
        <div className="space-y-2">
          {insights.map((item, i) => {
            if (item.startsWith("##")) {
              return (
                <div key={i} className="pixel-label" style={{ fontSize: "8px", color: "#9b5de5", paddingTop: i > 0 ? 10 : 2, paddingBottom: 2 }}>
                  {item.slice(2)}
                </div>
              );
            }
            const cat = categorize(item);
            const c = cardColors[cat];
            return (
              <div key={i} className="rounded-md" style={{ background: c.bg, border: cat !== "neutral" ? `1px solid ${c.border}` : "none", padding: cat !== "neutral" ? "8px 10px" : "4px 0" }}>
                <p className="text-xs leading-relaxed" style={{ color: c.color }}>{item}</p>
              </div>
            );
          })}
        </div>
      </Window>
    </div>
  );
}
