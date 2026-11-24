// Excerpt from Vodmill (src/server/campaigns/ledger.ts). Shown for illustration only.
// The full source code is available at https://store.mikodes.com/p/vodmill/
//
// Payout math for views-for-pay campaigns. Everything is integer cents, a payout is a ledger
// row and never a money transfer, the operator's commission is capped, and a budget reservation
// guarantees that reserved plus paid never exceeds the campaign budget.

// The money side, as a ledger. Nothing here moves money: a payout row says what a clipper is owed for
// a clip, and a person marks it paid with the reference of the payment they made elsewhere.
// 
// Formulas (all integers, cents):
//   per-view part   = 0 while counted < min_views, else min(max_payout, floor(counted × rate / 1000))
//   clip cap        = flat_fee + (rate > 0 ? max_payout : 0)
//   reservation     = min(clip cap, budget − reserved − paid)      set at approval; ≤ 0 available refuses the approval
//   earned (gross)  = min(reservation, flat_fee + per-view part)
//   commission      = floor(gross × commission_bps / 10000)        the rate is copied onto each payout row when it is written
//   net             = gross − commission                           what the clipper receives
//   campaign.reserved = Σ over approved clips of max(0, reservation − paid for that clip)
//   campaign.paid     = Σ of paid payout rows (gross)
//   invariant: reserved + paid ≤ budget, always.
// …

// COMMISSION_CAP_BPS (5000 = 50 %) and Campaign are defined elsewhere in the module.

type Terms = Pick<Campaign, "rateCents" | "flatFeeCents" | "minViews" | "maxPayoutCents">;

export function perViewCents(c: Terms, countedViews: number): number {
  if (c.rateCents <= 0 || countedViews < c.minViews) return 0;
  const raw = Math.floor((countedViews * c.rateCents) / 1000);
  return c.maxPayoutCents > 0 ? Math.min(c.maxPayoutCents, raw) : raw;
}
export const clipCapCents = (c: Terms): number => c.flatFeeCents + (c.rateCents > 0 ? c.maxPayoutCents : 0);
export const earnedCents = (c: Terms, countedViews: number, reservedCents: number): number => Math.max(0, Math.min(reservedCents, c.flatFeeCents + perViewCents(c, countedViews)));
/** Rounded down: a fraction of a cent stays with the clipper. */
export const commissionCents = (grossCents: number, bps: number): number => Math.floor((grossCents * Math.max(0, Math.min(COMMISSION_CAP_BPS, Math.floor(bps)))) / 10000);
/** Views at which the per-view part stops growing (0 = no cap). */
export const capViews = (c: Terms): number => (c.rateCents > 0 && c.maxPayoutCents > 0 ? Math.ceil((c.maxPayoutCents * 1000) / c.rateCents) : 0);
