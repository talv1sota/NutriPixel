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
    <div className="relative z-20">
      {/* Top bar */}
      <div className="window" style={{ borderRadius: 0, border: "none", borderBottom: "2px solid #8855aa" }}>
        <div className="window-title" style={{ borderRadius: 0 }}>
          <div className="flex items-center gap-3">
            <div className="decorations">
              <div className="dot dot-red" />
              <div className="dot dot-yellow" />
              <div className="dot dot-green" />
            </div>
            <span>NutriTracker</span>
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
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Marquee */}
      <div className="bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 py-1 marquee-wrap">
        <div className="marquee-inner text-xs font-bold text-purple-600">
          ✦ &nbsp;&nbsp; &quot;Nothing tastes as good as skinny feels&quot; — Kate Moss &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;I don&apos;t diet. I just don&apos;t eat as much as I&apos;d like to&quot; — Kate Moss &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;You&apos;re responsible for what you put in your body&quot; — Kate Moss &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;I don&apos;t think there&apos;s anything wrong with being thin&quot; — Naomi Campbell &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;The body achieves what the mind believes&quot; — Naomi Campbell &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;Elegance is elimination&quot; — Cristóbal Balenciaga &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;Discipline is the bridge between goals and accomplishment&quot; — Cindy Crawford &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;Nothing tastes as good as skinny feels&quot; — Kate Moss &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;I don&apos;t diet. I just don&apos;t eat as much as I&apos;d like to&quot; — Kate Moss &nbsp;&nbsp; ✦ &nbsp;&nbsp; &quot;I don&apos;t think there&apos;s anything wrong with being thin&quot; — Naomi Campbell &nbsp;&nbsp; ✦&nbsp;
        </div>
      </div>
    </div>
  );
}
