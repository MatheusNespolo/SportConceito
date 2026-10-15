import { it, expect, vi } from 'vitest';
import { renderGrid } from '../src/ui/grid.js';
import { renderFilters } from '../src/ui/filters.js';
const p = { id: '1', nome: 'Boné <b>', categoria: 'bonés', preco: 59, tamanhos: [], fotos: ['https://a/b.jpg'], linkInstagram: '' };
it('renders cards safely and opens on click', () => {
  const c = document.createElement('div'); const onOpen = vi.fn();
  renderGrid(c, [p], onOpen);
  const card = c.querySelector('.card');
  expect(card.tagName).toBe('BUTTON'); expect(card.textContent).toContain('Boné <b>');
  expect(c.querySelector('b')).toBeNull(); expect(c.querySelector('img').alt).toBe('Boné <b>');
  card.click(); expect(onOpen).toHaveBeenCalledWith(p);
});
it('shows empty state', () => {
  const c = document.createElement('div'); renderGrid(c, [], () => {});
  expect(c.textContent).toContain('Nenhum produto');
});
it('filters mark active chip and emit change', () => {
  const c = document.createElement('div'); const onChange = vi.fn();
  renderFilters(c, 'todos', onChange);
  expect(c.querySelectorAll('button')).toHaveLength(5);
  expect(c.querySelector('[aria-pressed="true"]').textContent).toBe('Todos');
  c.querySelectorAll('button')[4].click(); expect(onChange).toHaveBeenCalledWith('tênis');
});
it('filters restore focus to the active chip when a chip had focus', () => {
  const c = document.createElement('div'); document.body.append(c);
  let active = 'todos';
  const draw = () => renderFilters(c, active, v => { active = v; draw(); });
  draw();
  c.querySelectorAll('button')[2].focus(); c.querySelectorAll('button')[2].click();
  expect(document.activeElement.getAttribute('aria-pressed')).toBe('true');
  expect(document.activeElement.textContent).toBe('Bermudas');
  c.remove();
});
it('filters do not steal focus when no chip had focus', () => {
  const c = document.createElement('div'); document.body.append(c);
  renderFilters(c, 'todos', () => {});
  expect(c.contains(document.activeElement)).toBe(false); c.remove();
});
it('shows "Consulte o preço" when price is null', () => {
  const c = document.createElement('div');
  renderGrid(c, [{ ...p, preco: null }], () => {});
  expect(c.querySelector('.card-price').textContent).toBe('Consulte o preço');
});

it('renders the Destaque tag only for featured products', () => {
  const c = document.createElement('div');
  renderGrid(c, [{ ...p, featured: true }, { ...p, id: '2', featured: false }], () => {});
  const cards = c.querySelectorAll('.card');
  expect(cards[0].querySelector('.tag').textContent).toBe('Destaque');
  expect(cards[1].querySelector('.tag')).toBeNull();
  expect(cards[0].querySelector('img').alt).toBe('Boné <b>');
});
