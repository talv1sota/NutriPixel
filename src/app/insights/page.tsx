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

  // Group into sections
  const sections: { title: string; items: string[] }[] = [];
  let current: { title: string; items: string[] } | null = null;
  for (const item of insights) {
    if (item.startsWith("##")) {
      if (current && current.items.length > 0) sections.push(current);
      current = { title: item.slice(2), items: [] };
    } else if (current) {
      current.items.push(item);
    } else {
      current = { title: "", items: [item] };
    }
  }
  if (current && current.items.length > 0) sections.push(current);

  return (
    <div className="space-y-5 pt-3 max-w-lg mx-auto">
      <div className="pixel-label text-center" style={{ fontSize: "10px" }}>✧ Insights ✧</div>

      {sections.length > 0 ? (
        <Window title="🧠 Your Analysis">
          {sections.map((sec, si) => (
            <div key={si}>
              {si > 0 && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1" style={{ height: 1, background: "linear-gradient(90deg, transparent, #d4b8e8)" }} />
                  <span style={{ color: "#d4b8e8", fontSize: "9px", letterSpacing: 2, flexShrink: 0 }}>✦✧✦</span>
                  <div className="flex-1" style={{ height: 1, background: "linear-gradient(90deg, #d4b8e8, transparent)" }} />
                </div>
              )}
              {sec.title && (
                <div className="pixel-label" style={{ fontSize: "7px", color: "#b098c8", marginBottom: 8, letterSpacing: 1.5 }}>
                  {sec.title}
                </div>
              )}
              <div className="space-y-3">
                {sec.items.map((item, i) => (
                  <p key={i} className="text-xs leading-relaxed" style={{ color: "#4a3560", paddingLeft: 8, borderLeft: "2px solid #e8d4f5" }}>
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </Window>
      ) : (
        <Window title="🧠 Insights">
          <p className="vt-text text-center py-4">Start logging food to get personalized feedback.</p>
        </Window>
      )}
    </div>
  );
}
