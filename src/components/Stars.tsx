"use client";

import { useEffect, useState } from "react";

const CHARS = ["✦", "✧", "♡", "☆", "✿", "⋆", "♪"];

export default function Stars() {
  const [items, setItems] = useState<{ x: number; y: number; delay: number; floatDelay: number; char: string; size: number; color: string }[]>([]);

  useEffect(() => {
    const colors = ["#e8a0d0", "#ffd700", "#a0c8e8", "#c8a0e8", "#a0e8c0", "#f0c0d0"];
    setItems(
      Array.from({ length: 30 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3,
        floatDelay: Math.random() * 4,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        size: Math.random() * 12 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
      }))
    );
  }, []);

  return (
    <>
      {items.map((s, i) => (
        <div
          key={i}
          className="star-float"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            fontSize: s.size,
            color: s.color,
            animationDelay: `${s.floatDelay}s, ${s.delay}s`,
          }}
        >
          {s.char}
        </div>
      ))}
    </>
  );
}
