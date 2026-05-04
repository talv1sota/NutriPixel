"use client";

import { useEffect, useState } from "react";
import Window from "@/components/Window";

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
        <Window title="🧠 Your Analysis">
          <div className="space-y-4">
            {insights.map((insight, i) => (
              <p
                key={i}
                className="text-xs leading-relaxed"
                style={{
                  color: "#4a3560",
                  padding: "8px 0",
                  borderBottom: i < insights.length - 1 ? "1px solid #e8d4f5" : "none",
                }}
              >
                {insight}
              </p>
            ))}
          </div>
        </Window>
      ) : (
        <Window title="🧠 Insights">
          <p className="vt-text text-center py-4">Start logging food to get personalized feedback.</p>
        </Window>
      )}
    </div>
  );
}
