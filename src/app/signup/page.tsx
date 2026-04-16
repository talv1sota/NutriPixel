"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must contain at least one letter and one number");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
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
          <span>✧ Join NutriPixel ✧</span>
          <div className="decorations">
            <div className="dot dot-red" />
            <div className="dot dot-yellow" />
            <div className="dot dot-green" />
          </div>
        </div>
        <div className="window-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input w-full"
                placeholder="your name"
                required
              />
            </div>
            <div>
              <label className="pixel-label block mb-1" style={{ fontSize: "7px" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="you@email.com"
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
                placeholder="min 8 chars, letter + number"
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
