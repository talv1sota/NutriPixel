"use client";

import { useEffect, useState } from "react";
import Window from "@/components/Window";

function categorize(text: string) {
  if (text.startsWith("🚨") || text.includes("reverse") || text.includes("stalled") || text.includes("above maintenance")) return "alert";
  if (text.startsWith("⚠️") || text.startsWith("⚡") || text.includes("critically") || text.includes("counterproductive") || text.includes("suppress")) return "warning";
  if (text.startsWith("🏆") || text.startsWith("📍") || text.includes("solid") || text.includes("Keep it up") || text.includes("great consistency") || text.includes("Good habit") || text.includes("Good news") || text.includes("MVPs")) return "positive";
  return "neutral";
}

const cardStyles = {
  alert: { bg: "#fff0f0", border: "#ff6b6b", accent: "#cc3333" },
  warning: { bg: "#fff8ed", border: "#ffc145", accent: "#b8860b" },
  positive: { bg: "#edfff0", border: "#6bcb77", accent: "#2d8a4e" },
  neutral: { bg: "#f5eeff", border: "#d4b8e8", accent: "#6b4d8a" },
};

interface Section {
  title: string;
  items: string[];
}

function groupIntoSections(insights: string[]): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const item of insights) {
    if (item.startsWith("##")) {
      if (current && current.items.length > 0) sections.push(current);
      current = { title: item.slice(2), items: [] };
    } else if (current) {
      current.items.push(item);
    } else {
      // No section yet, create default
      current = { title: "Overview", items: [item] };
    }
  }
  if (current && current.items.length > 0) sections.push(current);
  return sections;
}

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

  const sections = groupIntoSections(insights);

  return (
    <div className="space-y-5 pt-3 max-w-lg mx-auto">
      <div className="pixel-label text-center" style={{ fontSize: "10px" }}>✧ Insights ✧</div>

      {sections.length > 0 ? (
        sections.map((section, si) => (
          <Window key={si} title={`✧ ${section.title} ✧`}>
            <div className="space-y-3">
              {section.items.map((insight, i) => {
                const cat = categorize(insight);
                const s = cardStyles[cat];
                return (
                  <div
                    key={i}
                    className="rounded-lg"
                    style={{
                      background: s.bg,
                      border: `1.5px solid ${s.border}`,
                      padding: "10px 12px",
                    }}
                  >
                    <p className="text-xs leading-relaxed" style={{ color: s.accent }}>
                      {insight}
                    </p>
                  </div>
                );
              })}
            </div>
          </Window>
        ))
      ) : (
        <Window title="🧠 Insights">
          <p className="vt-text text-center py-4">Start logging food to get personalized feedback.</p>
        </Window>
      )}
    </div>
  );
}
