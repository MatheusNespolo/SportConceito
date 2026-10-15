import { priceLabel } from '../domain/format.js';
const PLACEHOLDER = './placeholder.svg';
export function renderGrid(container, products, onOpen) {
  container.replaceChildren();
  if (!products.length) {
    const e = document.createElement('p'); e.className = 'empty';
    e.textContent = 'Nenhum produto nesta categoria no momento.'; container.append(e); return;
  }
  for (const p of products) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'card spotlight';
    const img = document.createElement('img');
    img.src = p.fotos[0]; img.alt = p.nome; img.loading = 'lazy';
    img.onerror = () => { img.onerror = null; img.src = PLACEHOLDER; };
    const name = document.createElement('span'); name.className = 'card-name'; name.textContent = p.nome;
    const price = document.createElement('span'); price.className = 'card-price'; price.textContent = priceLabel(p.preco);
    b.append(img, name, price);
    b.addEventListener('click', () => onOpen(p));
    container.append(b);
  }
}
