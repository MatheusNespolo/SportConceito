import { it, expect } from 'vitest';
import { parsePrice, formatPrice } from '../src/domain/format.js';
it.each([['89,90', 89.9], ['R$ 89,90', 89.9], ['89.90', 89.9], ['1.299,00', 1299], ['120', 120], ['', null], ['abc', null]])
  ('parsePrice(%s)', (raw, out) => expect(parsePrice(raw)).toBe(out));
it('formatPrice', () => expect(formatPrice(1299).replace(/\s/g, ' ')).toBe('R$ 1.299,00'));
import { priceLabel } from '../src/domain/format.js';
it('priceLabel', () => {
  expect(priceLabel(null)).toBe('Consulte o preço');
  expect(priceLabel(59).replace(/\s/g, ' ')).toBe('R$ 59,00');
});
