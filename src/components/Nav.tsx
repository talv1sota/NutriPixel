"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/log", label: "Log", icon: "🍰" },
  { href: "/exercise", label: "Exercise", icon: "🏃" },
  { href: "/weight", label: "Weight", icon: "⚖️" },
  { href: "/stats", label: "Stats", icon: "📊" },
  { href: "/recipes", label: "Recipes", icon: "📖" },
  { href: "/mood", label: "Mood", icon: "💭" },
  { href: "/goals", label: "Goals", icon: "⭐" },
  { href: "/insights", label: "Insights", icon: "🧠" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Desktop top nav */}
      <div className="relative z-20 hidden sm:block">
        <div className="window" style={{ borderRadius: 0, border: "none", borderBottom: "2px solid #8855aa" }}>
          <div className="window-title" style={{ borderRadius: 0 }}>
            <div className="flex items-center gap-3">
              <div className="decorations">
                <div className="dot dot-red" />
                <div className="dot dot-yellow" />
                <div className="dot dot-green" />
              </div>
              <Link href="/" style={{ color: "white", textDecoration: "none" }}>NutriTracker</Link>
            </div>
            <button
              onClick={handleLogout}
              style={{ fontSize: "8px", opacity: 0.7, background: "none", border: "none", color: "white", cursor: "pointer" }}
            >
              logout ✧
            </button>
          </div>

          <div className="flex items-stretch justify-center py-3 px-4 bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-tab ${pathname === link.href ? "active" : ""}`}
              >
                <span className="text-base">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 py-1 marquee-wrap">
          <div className="marquee-inner text-xs font-bold text-purple-600">
            ✦ &nbsp;&nbsp; &quot;Nothing tastes as good as skinny feels&quot; — Kate Moss &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;I don&apos;t diet. I just don&apos;t eat as much as I&apos;d like to&quot; — Kate Moss &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;You&apos;re responsible for what you put in your body&quot; — Kate Moss &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;I don&apos;t think there&apos;s anything wrong with being thin&quot; — Naomi Campbell &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;The body achieves what the mind believes&quot; — Naomi Campbell &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;Elegance is elimination&quot; — Cristóbal Balenciaga &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;Discipline is the bridge between goals and accomplishment&quot; — Cindy Crawford &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;Nothing tastes as good as skinny feels&quot; — Kate Moss &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;I don&apos;t diet. I just don&apos;t eat as much as I&apos;d like to&quot; — Kate Moss &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;I don&apos;t think there&apos;s anything wrong with being thin&quot; — Naomi Campbell &nbsp;&nbsp; ✦&nbsp;
          </div>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="sm:hidden relative z-20">
        <div className="flex items-center justify-between px-4 py-2" style={{ background: "linear-gradient(180deg, #c77dff, #9b5de5)", borderBottom: "2px solid #8855aa" }}>
          <Link href="/" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "9px", color: "white", textShadow: "1px 1px 0 rgba(0,0,0,0.3)", textDecoration: "none" }}>
            NutriTracker
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
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50" style={{ background: "#fff8ff", borderTop: "2px solid #d4b8e8", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${links.length}, 1fr)` }}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center py-2 gap-0.5"
              style={{
                color: pathname === link.href ? "#e84d98" : "#9b80b8",
                fontSize: "16px",
                textDecoration: "none",
                transition: "color 0.15s",
              }}
            >
              <span>{link.icon}</span>
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
