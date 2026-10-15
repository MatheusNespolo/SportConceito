export function parsePrice(raw) {
  let s = String(raw ?? '').replace(/[^\d.,]/g, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatPrice = n => fmt.format(n);
export const priceLabel = n => (n === null ? 'Consulte o preço' : formatPrice(n));
