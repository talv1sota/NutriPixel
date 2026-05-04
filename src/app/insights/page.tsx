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

      <Window title="🧠 Your Analysis">
        <div>
          {insights.map((item, i) => {
            if (item.startsWith("##")) {
              return (
                <div key={i} className="text-center" style={{ marginTop: i > 0 ? 18 : 0, marginBottom: 8 }}>
                  <span style={{ color: "#d4b8e8", fontSize: "8px", letterSpacing: 3 }}>✦ ˚ ✧ ˚ ✦</span>
                  <div className="pixel-label" style={{ fontSize: "8px", color: "#9b5de5", letterSpacing: 1, marginTop: 4 }}>
                    {item.slice(2)}
                  </div>
                </div>
              );
            }
            return (
              <p key={i} className="text-xs leading-relaxed" style={{ color: "#4a3560", padding: "5px 0" }}>
                {item}
              </p>
            );
          })}
        </div>
      </Window>
    </div>
  );
}
