import './styles/tokens.css'; import './styles/base.css'; import './styles/components.css';
import { config } from './config.js';
import { loadProducts } from './data/products.js';
import { filterByCategory } from './domain/filter.js';
import { renderGrid } from './ui/grid.js';
import { renderFilters } from './ui/filters.js';
import { openProductSheet } from './ui/product-sheet.js';

const grid = document.getElementById('grid');
const filters = document.getElementById('filters');
const igUrl = `https://www.instagram.com/${config.instagram}/`;
let products = [], active = 'todos';

function showSkeleton() {
  grid.replaceChildren(...Array.from({ length: 8 }, () => {
    const s = document.createElement('div'); s.className = 'card skeleton'; s.setAttribute('aria-hidden', 'true'); return s; }));
}
function showOffline() {
  const p = document.createElement('p'); p.className = 'empty';
  const a = document.createElement('a'); a.href = igUrl; a.textContent = 'Veja nosso catálogo no Instagram';
  p.append('Não foi possível carregar os produtos agora. ', a); grid.replaceChildren(p);
}
function render() {
  renderFilters(filters, active, cat => { active = cat; render(); });
  grid.classList.add('is-switching');
  requestAnimationFrame(() => {
    renderGrid(grid, filterByCategory(products, active), p => openProductSheet(p, { phone: config.whatsapp, instagram: config.instagram }));
    grid.classList.remove('is-switching');
  });
}
function fillStoreInfo() {
  document.querySelectorAll('[data-ig]').forEach(a => { a.href = igUrl; });
  document.getElementById('wa-float').href = `https://wa.me/${config.whatsapp.replace(/\D/g, '')}`;
  document.getElementById('store-address').textContent = config.address;
  document.getElementById('store-hours').textContent = config.hours;
}

fillStoreInfo(); showSkeleton();
const { products: list, source } = await loadProducts({ url: config.csvUrl });
products = list;
if (source === 'none') showOffline(); else render();
