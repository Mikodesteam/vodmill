// Excerpt from Vodmill (src/server/campaigns/fraud.ts). Shown for illustration only.
// The full source code is available at https://store.mikodes.com/p/vodmill/
//
// Scores a campaign clip submission for fraud from signals a person can verify.
// Each signal explains itself, and a high score only pauses the payout for a human
// review: nothing is rejected automatically.

// HOUR and FraudSignal come from ./types.js; sig() and n() are small helpers defined in the full file.

export interface Snapshot { at: number; views: number; likes: number | null; comments: number | null }
// …
export const median = (xs: number[]): number => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

/** Views per hour between the first reading and the last one inside the first 48 h. Null with fewer than two readings. */
export function earlyVelocity(snaps: Snapshot[]): number | null {
  if (snaps.length < 2) return null;
  const first = snaps[0]!;
  const inside = snaps.filter((s) => s.at - first.at <= 48 * HOUR);
  const last = inside[inside.length - 1]!;
  const hours = (last.at - first.at) / HOUR;
  return hours >= 1 ? Math.max(0, last.views - first.views) / hours : null;
}
// …
  // 2. step jump: one interval holds more than half of all growth, at least 5,000 views, at ten times the usual pace
  if (snaps.length < 4) out.push(sig("step_jump", 0, false, "Needs at least four readings."));
  else {
    const steps = snaps.slice(1).map((s, i) => ({ dv: Math.max(0, s.views - snaps[i]!.views), rate: Math.max(0, s.views - snaps[i]!.views) / Math.max(0.25, (s.at - snaps[i]!.at) / HOUR), at: s.at }));
    const total = steps.reduce((a, s) => a + s.dv, 0);
    const big = steps.reduce((a, s) => (s.dv > a.dv ? s : a), steps[0]!);
    const others = median(steps.filter((s) => s !== big).map((s) => s.rate));
    const share = total ? big.dv / total : 0;
    const hit = big.dv >= 5000 && share > 0.5 && big.rate >= Math.max(1, others) * 10;
    const half = !hit && big.dv >= 5000 && share > 0.5 && big.rate >= Math.max(1, others) * 5;
    out.push(sig("step_jump", hit ? 25 : half ? 12 : 0, true, total
      ? `Largest step: ${n(big.dv)} views (${Math.round(share * 100)} % of the growth) at ${n(big.rate)} views/h; the other steps ran at ${n(others)} views/h.`
      : "No growth between readings."));
  }
// …
export const fraudScore = (signals: FraudSignal[]): number => Math.max(0, Math.min(100, signals.reduce((a, s) => a + s.points, 0)));
