"use client";

import { useEffect, useState } from "react";

// Flip the black & white ("edge") theme. Sets the attribute the pre-paint
// script reads, persists it, and broadcasts so the Nav can re-sync its icons.
export function applyEdge(on: boolean) {
  if (on) {
    document.documentElement.setAttribute("data-theme", "edge");
    localStorage.setItem("theme", "edge");
  } else {
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem("theme");
  }
  window.dispatchEvent(new Event("themechange"));
}

// Half-filled circle = contrast/B&W. Plain SVG, no emoji.
function ContrastIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function ThemeToggle() {
  const [edge, setEdge] = useState(false);

  useEffect(() => {
    const sync = () => setEdge(document.documentElement.getAttribute("data-theme") === "edge");
    sync();
    window.addEventListener("themechange", sync);
    window.addEventListener("storage", sync); // sync across tabs
    return () => {
      window.removeEventListener("themechange", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => applyEdge(!edge)}
      className="theme-toggle"
      aria-label="Toggle black and white mode"
      aria-pressed={edge}
      title={edge ? "Switch to colour mode" : "Switch to black & white mode"}
    >
      <ContrastIcon />
    </button>
  );
}
