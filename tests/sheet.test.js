import { it, expect, beforeAll } from 'vitest';
import { openProductSheet } from '../src/ui/product-sheet.js';
beforeAll(() => { HTMLDialogElement.prototype.showModal ??= function () { this.open = true; };
  HTMLDialogElement.prototype.close ??= function () { this.open = false; this.dispatchEvent(new Event('close')); }; });
const base = { id: '1', nome: 'Camiseta', categoria: 'camisetas', preco: 89.9, fotos: ['https://a/1.jpg'], linkInstagram: 'https://instagram.com/p/x' };
const opts = { phone: '5511999990000', instagram: 'sportconceito_' };
it('size selection updates WhatsApp link', () => {
  openProductSheet({ ...base, tamanhos: ['P', 'M'] }, opts);
  const d = document.querySelector('dialog.sheet');
  d.querySelectorAll('.size')[1].click();
  expect(decodeURIComponent(d.querySelector('a.wa').href)).toContain('Tamanho: M');
  expect(d.querySelector('a.ig').href).toBe('https://instagram.com/p/x');
});
it('hides sizes when none and falls back to profile link', () => {
  document.body.innerHTML = '';
  openProductSheet({ ...base, tamanhos: [], linkInstagram: '' }, opts);
  const d = document.querySelector('dialog.sheet');
  expect(d.querySelector('.sizes')).toBeNull();
  expect(d.querySelector('a.ig').href).toBe('https://www.instagram.com/sportconceito_/');
});
it('close removes dialog', () => {
  document.body.innerHTML = '';
  const close = openProductSheet({ ...base, tamanhos: [] }, opts); close();
  expect(document.querySelector('dialog.sheet')).toBeNull();
});
it('shows the placeholder in the sheet when there are no photos', () => {
  document.body.innerHTML = '';
  openProductSheet({ ...base, tamanhos: [], fotos: [] }, opts);
  const imgs = document.querySelectorAll('dialog.sheet .sheet-gallery img');
  expect(imgs).toHaveLength(1); expect(imgs[0].getAttribute('src')).toBe('./placeholder.svg');
});
