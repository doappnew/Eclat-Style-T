// Calculs en unités entières (1 Pi = 1e7 unités) pour éviter les erreurs d'arrondi.
const SCALE = 1e7;
export const toUnits = (n) => Math.round(Number(n) * SCALE);
export const fromUnits = (u) => u / SCALE;

export function unitPrice(p) {
  const base = Number(p.price_pi);
  const promo = p.promo_price_pi == null ? null : Number(p.promo_price_pi);
  return promo != null && promo > 0 && promo < base ? promo : base;
}

export function computeTotals(lines, fee) {
  const sub = lines.reduce((s, l) => s + toUnits(l.unit_price_pi) * l.qty, 0);
  const f = toUnits(fee);
  return { subtotal: fromUnits(sub), fee: fromUnits(f), total: fromUnits(sub + f) };
}
