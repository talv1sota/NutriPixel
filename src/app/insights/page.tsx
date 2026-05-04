"use client";

import { useEffect, useState } from "react";
import Window from "@/components/Window";

interface DayData {
  date: string;
  net: number;
  calories: number;
  burned: number;
}

interface InsightsData {
  today: string[];
  week: string[];
  month: string[];
  overall: string[];
  days: DayData[];
}

function InsightList({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="text-xs leading-relaxed"
          style={{
            color: "#4a3560",
            padding: "5px 0",
            borderBottom: i < items.length - 1 ? "1px dashed #e8d4f5" : "none",
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
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

  if (!data) return null;

  const maxNet = Math.max(...(data.days.map((d) => d.net) || [1]), 1);

  return (
    <div className="space-y-5 pt-3 max-w-lg mx-auto">
      <div className="pixel-label text-center" style={{ fontSize: "10px" }}>✧ Insights ✧</div>

      {data.overall.length > 0 && (
        <Window title="🏆 Overall Progress">
          <InsightList items={data.overall} />
        </Window>
      )}

      {data.today.length > 0 && (
        <Window title="📅 Today">
          <InsightList items={data.today} />
        </Window>
      )}

      {data.week.length > 0 && (
        <Window title="📊 This Week">
          <InsightList items={data.week} />
        </Window>
      )}

      {data.month.length > 0 && (
        <Window title="📈 This Month">
          <InsightList items={data.month} />
        </Window>
      )}

      {data.days.length > 0 && (
        <Window title="📊 Daily Net Calories">
          <div className="space-y-1">
            {data.days.map((d) => {
              const pct = Math.min((d.net / maxNet) * 100, 100);
              const isHigh = d.net > 1100;
              const isLow = d.calories > 0 && d.net < 400;
              return (
                <div key={d.date} className="flex items-center gap-2 text-[10px]">
                  <span style={{ width: 42, color: "#9b80b8", flexShrink: 0 }}>
                    {d.date.slice(5)}
                  </span>
                  <div className="flex-1 h-3 rounded" style={{ background: "#f5eeff" }}>
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${pct}%`,
                        background: isHigh ? "#ff6b6b" : isLow ? "#ffc145" : "#6bcb77",
                      }}
                    />
                  </div>
                  <span
                    className="font-bold"
                    style={{
                      width: 40,
                      textAlign: "right",
                      color: isHigh ? "#ff4444" : isLow ? "#dda520" : "#6bcb77",
                      flexShrink: 0,
                    }}
                  >
                    {d.net}
                  </span>
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
