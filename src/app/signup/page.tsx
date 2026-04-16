"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, inviteCode }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Signup failed");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="window slidein" style={{ maxWidth: 400, width: "100%" }}>
        <div className="window-title">
          <span>✧ Join NutriTracker ✧</span>
          <div className="decorations">
            <div className="dot dot-red" />
            <div className="dot dot-yellow" />
            <div className="dot dot-green" />
          </div>
        </div>
        <div className="window-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input w-full"
                placeholder="username"
                required
              />
            </div>
            <div>
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Invite Code</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="input w-full"
                placeholder="invite code"
                required
              />
            </div>
            <div>
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
                placeholder="min 8 characters"
                required
              />
            </div>

            {error && (
              <p className="text-xs font-bold text-center" style={{ color: "#ff4444" }}>{error}</p>
            )}

            <button type="submit" className="btn-pink w-full py-2" disabled={loading}>
              {loading ? "creating account..." : "✧ Sign Up ✧"}
            </button>

            <p className="text-xs text-center" style={{ color: "#8b6a9e" }}>
              Already have an account?{" "}
              <Link href="/login" className="font-bold" style={{ color: "#9b5de5" }}>
                Log In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
