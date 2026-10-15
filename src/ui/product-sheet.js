import { buildWhatsAppLink } from '../domain/whatsapp.js';
import { priceLabel } from '../domain/format.js';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

export function openProductSheet(product, { phone, instagram }) {
  const d = el('dialog', 'sheet'); d.setAttribute('aria-label', product.nome);
  const closeBtn = el('button', 'sheet-close', '×'); closeBtn.type = 'button'; closeBtn.setAttribute('aria-label', 'Fechar');
  const gallery = el('div', 'sheet-gallery');
  for (const src of product.fotos) { const i = el('img'); i.src = src; i.alt = product.nome;
    i.onerror = () => { i.onerror = null; i.src = './placeholder.svg'; }; gallery.append(i); }
  const wa = el('a', 'wa', 'Comprar pelo WhatsApp'); wa.target = '_blank'; wa.rel = 'noopener';
  const ig = el('a', 'ig', 'Ver no Instagram'); ig.target = '_blank'; ig.rel = 'noopener';
  ig.href = product.linkInstagram || `https://www.instagram.com/${instagram}/`;
  let size;
  const updateWa = () => { wa.href = buildWhatsAppLink(phone, product, size); };
  const body = el('div', 'sheet-body');
  body.append(el('h2', 'sheet-title', product.nome), el('p', 'sheet-price', priceLabel(product.preco)));
  if (product.tamanhos.length) {
    const sizes = el('div', 'sizes'); sizes.setAttribute('role', 'group'); sizes.setAttribute('aria-label', 'Tamanho');
    for (const t of product.tamanhos) {
      const b = el('button', 'size', t); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => { size = t;
        sizes.querySelectorAll('.size').forEach(x => x.setAttribute('aria-pressed', String(x === b))); updateWa(); });
      sizes.append(b);
    }
    body.append(sizes);
  }
  const actions = el('div', 'sheet-actions'); actions.append(wa, ig); body.append(actions);
  d.append(closeBtn, gallery, body); document.body.append(d);
  updateWa();
  const opener = document.activeElement;
  const close = () => { if (d.open) d.close(); d.remove(); document.body.classList.remove('no-scroll'); opener?.focus?.(); };
  closeBtn.addEventListener('click', close);
  d.addEventListener('click', e => { if (e.target === d) close(); });
  d.addEventListener('cancel', e => { e.preventDefault(); close(); });
  document.body.classList.add('no-scroll');
  d.showModal();
  return close;
}
