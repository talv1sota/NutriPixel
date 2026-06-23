"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const QUOTES_HIDDEN_KEY = "nav.quotesHidden";

// icon = default ("cute") theme emoji. In edge (black & white) mode we render
// the monochrome <NavGlyph> line icons below instead — no emoji.
const links = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/log", label: "Log", icon: "🍰" },
  { href: "/exercise", label: "Exercise", icon: "🏃" },
  { href: "/fasting", label: "Fasting", icon: "⏳" },
  { href: "/weight", label: "Weight", icon: "⚖️" },
  { href: "/stats", label: "Stats", icon: "📊" },
  { href: "/recipes", label: "Recipes", icon: "📖" },
  { href: "/mood", label: "Mood", icon: "💭" },
  { href: "/goals", label: "Goals", icon: "⭐" },
  { href: "/days", label: "Days", icon: "📅" },
  { href: "/insights", label: "Insights", icon: "🧠" },
];

// Monochrome line icons (stroke = currentColor) for edge mode.
function NavGlyph({ href }: { href: string }) {
  const p = {
    width: 20, height: 20, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.7,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (href) {
    case "/": return (<svg {...p}><path d="M3 11l9-8 9 8" /><path d="M5 9.5V21h14V9.5" /></svg>);
    case "/log": return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>);
    case "/exercise": return (<svg {...p}><path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12" /></svg>);
    case "/fasting": return (<svg {...p}><path d="M5 3h14M5 21h14" /><path d="M7 3v3l5 6 5-6V3" /><path d="M7 21v-3l5-6 5 6v3" /></svg>);
    case "/weight": return (<svg {...p}><path d="M12 3v18" /><path d="M8 21h8" /><path d="M5 6.5h14" /><path d="M5 6.5l-2.5 5.5a3 3 0 0 0 5 0z" /><path d="M19 6.5l-2.5 5.5a3 3 0 0 0 5 0z" /></svg>);
    case "/stats": return (<svg {...p}><path d="M5 21V11M10 21V6M15 21v-9M20 21V9" /><path d="M3 21h18" /></svg>);
    case "/recipes": return (<svg {...p}><path d="M12 6C10 4.5 7 4 4 4v15c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2z" /><path d="M12 6v15" /></svg>);
    case "/mood": return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8.5 14a4 4 0 0 0 7 0" /><path d="M9 9.5h.01M15 9.5h.01" /></svg>);
    case "/goals": return (<svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /></svg>);
    case "/days": return (<svg {...p}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>);
    case "/insights": return (<svg {...p}><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.4 1 2.5h6c0-1.1.3-1.8 1-2.5A6 6 0 0 0 12 3z" /></svg>);
    default: return null;
  }
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [quotesHidden, setQuotesHidden] = useState(false);
  // Start "cute" so SSR and first client render match; corrected in useEffect.
  const [edge, setEdge] = useState(false);

  useEffect(() => {
    setQuotesHidden(localStorage.getItem(QUOTES_HIDDEN_KEY) === "1");
    const sync = () => setEdge(document.documentElement.getAttribute("data-theme") === "edge");
    sync();
    window.addEventListener("themechange", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("themechange", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const iconFor = (l: (typeof links)[number]) =>
    edge ? <NavGlyph href={l.href} /> : l.icon;

  const setHidden = (h: boolean) => {
    setQuotesHidden(h);
    if (h) localStorage.setItem(QUOTES_HIDDEN_KEY, "1");
    else localStorage.removeItem(QUOTES_HIDDEN_KEY);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Desktop top nav */}
      <div className="relative z-20 hidden sm:block">
        <div className="window" style={{ borderRadius: 0, border: "none", borderBottom: "2px solid var(--win-border)" }}>
          <div className="window-title" style={{ borderRadius: 0 }}>
            <div className="flex items-center gap-3">
              <div className="decorations">
                <div className="dot dot-red" />
                <div className="dot dot-yellow" />
                <div className="dot dot-green" />
              </div>
              <Link href="/" style={{ color: "white", textDecoration: "none" }}>{edge ? "NIGHTMODE" : "NutriTracker"}</Link>
            </div>
            <button
              onClick={handleLogout}
              style={{ fontSize: "8px", opacity: 0.7, background: "none", border: "none", color: "white", cursor: "pointer" }}
            >
              logout ✧
            </button>
          </div>

          <div className="nav-row flex items-stretch justify-center py-3 px-4 bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-tab ${pathname === link.href ? "active" : ""}`}
              >
                <span className="text-base">{iconFor(link)}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {quotesHidden ? (
          <button
            onClick={() => setHidden(false)}
            aria-label="Show quotes"
            title="Show quotes"
            className="block w-full bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200"
            style={{ height: 5, border: "none", padding: 0, cursor: "pointer", opacity: 0.55 }}
          />
        ) : (
          <div className="relative bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 py-1 marquee-wrap">
            <div className="marquee-inner text-xs font-bold text-purple-600" style={{ paddingRight: 28 }}>
              ✦ &nbsp;&nbsp; &quot;Nothing tastes as good as skinny feels&quot; — Kate Moss &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;I don&apos;t diet. I just don&apos;t eat as much as I&apos;d like to&quot; — Kate Moss &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;You&apos;re responsible for what you put in your body&quot; — Kate Moss &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;I don&apos;t think there&apos;s anything wrong with being thin&quot; — Naomi Campbell &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;The body achieves what the mind believes&quot; — Naomi Campbell &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;Elegance is elimination&quot; — Cristóbal Balenciaga &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;Discipline is the bridge between goals and accomplishment&quot; — Cindy Crawford &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;Nothing tastes as good as skinny feels&quot; — Kate Moss &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;I don&apos;t diet. I just don&apos;t eat as much as I&apos;d like to&quot; — Kate Moss &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;I don&apos;t think there&apos;s anything wrong with being thin&quot; — Naomi Campbell &nbsp;&nbsp; ✦&nbsp;
            </div>
            <button
              onClick={() => setHidden(true)}
              aria-label="Hide quotes"
              title="Hide quotes"
              className="absolute top-1/2 right-2 -translate-y-1/2"
              style={{
                fontSize: 11,
                lineHeight: 1,
                color: "#7c3aed",
                background: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(124,58,237,0.35)",
                borderRadius: 999,
                width: 16,
                height: 16,
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Mobile top bar */}
      <div className="sm:hidden relative z-20">
        <div className="flex items-center justify-between px-4 py-2" style={{ background: "var(--titlebar)", borderBottom: "2px solid var(--win-border)" }}>
          <Link href="/" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "9px", color: "white", textShadow: "1px 1px 0 rgba(0,0,0,0.3)", textDecoration: "none" }}>
            {edge ? "NIGHTMODE" : "NutriTracker"}
          </Link>
          <button
            onClick={handleLogout}
            style={{ fontSize: "9px", opacity: 0.8, background: "none", border: "none", color: "white", cursor: "pointer", fontFamily: "'Quicksand', sans-serif", fontWeight: 600 }}
          >
            logout
          </button>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50" style={{ background: "var(--surface)", borderTop: "2px solid var(--win-border-soft)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${links.length}, 1fr)` }}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center py-2 gap-0.5"
              style={{
                color: pathname === link.href ? "var(--accent-pink)" : "var(--ink-muted)",
                fontSize: "16px",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
            >
              <span>{iconFor(link)}</span>
              <span style={{ fontSize: "7px", fontWeight: 700, fontFamily: "'Quicksand', sans-serif" }}>
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
