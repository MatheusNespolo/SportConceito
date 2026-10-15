import { it, expect } from 'vitest';
import { filterByCategory } from '../src/domain/filter.js';
import { buildWhatsAppLink } from '../src/domain/whatsapp.js';
const ps = [{ id: '1', categoria: 'bonés' }, { id: '2', categoria: 'tênis' }];
it('todos returns all', () => expect(filterByCategory(ps, 'todos')).toEqual(ps));
it('filters by category', () => expect(filterByCategory(ps, 'tênis').map(p => p.id)).toEqual(['2']));
const p = { nome: 'Camiseta & Co', preco: 89.9, linkInstagram: 'https://instagram.com/p/x' };
it('builds message with size', () => {
  const url = buildWhatsAppLink('55 11 99999-0000', p, 'M');
  expect(url.startsWith('https://wa.me/5511999990000?text=')).toBe(true);
  const text = decodeURIComponent(url.split('text=')[1]);
  expect(text).toContain('Camiseta & Co'); expect(text).toContain('Tamanho: M'); expect(text).toContain('R$');
});
it('omits size line when none', () => {
  const text = decodeURIComponent(buildWhatsAppLink('1', p).split('text=')[1]);
  expect(text).not.toContain('Tamanho');
});
