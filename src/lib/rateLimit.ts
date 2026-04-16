// In-memory sliding window rate limiter.
// Resets on cold starts (serverless), which is fine — it's a speed bump, not a fortress.

const windows = new Map<string, number[]>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, timestamps] of windows) {
    const filtered = timestamps.filter((t) => t > cutoff);
    if (filtered.length === 0) windows.delete(key);
    else windows.set(key, filtered);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number } {
  cleanup(windowMs);

  const now = Date.now();
  const cutoff = now - windowMs;
  const timestamps = (windows.get(key) || []).filter((t) => t > cutoff);

  if (timestamps.length >= limit) {
    return { ok: false, remaining: 0 };
  }

  timestamps.push(now);
  windows.set(key, timestamps);
  return { ok: true, remaining: limit - timestamps.length };
}
