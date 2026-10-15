# Sport Conceito Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Site vitrine single-page da Sport Conceito cujo catálogo vem de uma Google Sheet publicada como CSV, com contato via WhatsApp ou Instagram.

**Architecture:** Vite + JS puro (ES modules). Camada `data/` (CSV → produtos), `domain/` (funções puras), `ui/` (DOM). `main.js` compõe. Estilos em CSS com tokens (`styles/tokens.css`) e efeitos (`styles/effects.css`).

**Tech Stack:** Node 20+, Vite 5, Vitest 2 + jsdom. Sem frameworks de UI.

**Spec:** `docs/superpowers/specs/2026-10-15-sportconceito-site-design.md`

## Global Constraints
- Idioma da interface: pt-BR. Preço formatado `R$ 89,90`.
- Categorias exatas: `camisetas`, `bermudas`, `bonés`, `tênis` (aceitar também sem acento: `bones`, `tenis`, normalizando para a forma acentuada).
- Colunas CSV: `id,nome,categoria,preco,tamanhos,foto_url,foto2_url,link_instagram,disponivel`.
- `disponivel`: verdadeiro para `TRUE`, `true`, `sim`, `s`, `1`, `x` (case-insensitive, trim); qualquer outro valor = indisponível.
- Mobile-first; grade 2 colunas < 768px, 4 colunas ≥ 1024px (3 entre).
- Todos os efeitos animados desligados com `prefers-reduced-motion: reduce`; spotlight só com `(hover: hover)`.
- Contraste mínimo WCAG AA; todo `<img>` com `alt`.
- Design: implementador de UI deve invocar o skill `ui-ux-pro-max` (Task 4).
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus
1. Planilha com vírgulas/aspas/quebra de linha dentro de células (ex.: nome `Camiseta "Logo", preta`) → produto aparece correto. (Task 1)
2. Preço digitado como `89,90`, `R$ 89,90`, `89.90` ou `1.299,00` → exibe valor certo. (Task 2)
3. Planilha fora do ar / CSV vazio → usa cache; sem cache, mostra link do Instagram, nunca tela branca. (Task 2, Task 7)
4. Produto sem tamanhos (ex.: boné tamanho único) → mensagem do WhatsApp sem "Tamanho:" vazio e seletor oculto. (Task 3, Task 6)
5. Linhas com espaços extras/maiúsculas em categoria (`  Tênis `) → filtradas corretamente. (Task 2)

---

## File Structure
```
SportConceito/
  index.html                  # marcação da página
  package.json, vite.config.js
  public/placeholder.svg      # foto padrão
  public/sample.csv           # catálogo de exemplo (fallback de desenvolvimento)
  src/config.js               # dados da loja e URL do CSV
  src/main.js                 # composição + estados
  src/data/csv.js             # parseCSV
  src/data/products.js        # normalizeRow, loadProducts
  src/domain/filter.js        # filterByCategory
  src/domain/whatsapp.js      # buildWhatsAppLink
  src/domain/format.js        # formatPrice
  src/ui/grid.js              # renderGrid
  src/ui/filters.js           # renderFilters
  src/ui/product-sheet.js     # openProductSheet
  src/ui/spotlight.js         # efeito cursor
  src/styles/tokens.css, base.css, effects.css, components.css
  tests/*.test.js
  docs/guia-planilha.md
```

---

### Task 1: Scaffold + parser de CSV

**Files:**
- Create: `package.json`, `vite.config.js`, `.gitignore`, `src/data/csv.js`
- Test: `tests/csv.test.js`

**Interfaces:**
- Produces: `parseCSV(text: string): Array<Record<string,string>>` — primeira linha = cabeçalhos (trim, lowercase); linhas totalmente vazias ignoradas.

- [ ] **Step 1: Scaffold**

`package.json`:
```json
{
  "name": "sportconceito",
  "private": true,
  "type": "module",
  "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview", "test": "vitest run" },
  "devDependencies": { "vite": "^5.4.0", "vitest": "^2.1.0", "jsdom": "^25.0.0" }
}
```
`vite.config.js`:
```js
import { defineConfig } from 'vite';
export default defineConfig({ base: './', test: { environment: 'jsdom' } });
```
`.gitignore`: `node_modules/` e `dist/`. Run: `npm install`.

- [ ] **Step 2: Write the failing test** — `tests/csv.test.js`
```js
import { describe, it, expect } from 'vitest';
import { parseCSV } from '../src/data/csv.js';

describe('parseCSV', () => {
  it('parses header and rows', () => {
    expect(parseCSV('id,nome\n1,Boné\n2,Tênis')).toEqual([
      { id: '1', nome: 'Boné' }, { id: '2', nome: 'Tênis' },
    ]);
  });
  it('handles quotes, commas, escaped quotes and newlines in cells', () => {
    const csv = 'id,nome\r\n1,"Camiseta ""Logo"", preta"\r\n2,"linha1\nlinha2"';
    expect(parseCSV(csv)).toEqual([
      { id: '1', nome: 'Camiseta "Logo", preta' }, { id: '2', nome: 'linha1\nlinha2' },
    ]);
  });
  it('normalizes headers and skips blank lines', () => {
    expect(parseCSV(' ID , Nome \n\n1,A\n')).toEqual([{ id: '1', nome: 'A' }]);
  });
  it('returns [] for empty input', () => {
    expect(parseCSV('')).toEqual([]);
  });
});
```

- [ ] **Step 3: Run** `npx vitest run tests/csv.test.js` — Expected: FAIL (module not found).

- [ ] **Step 4: Implement** — `src/data/csv.js`
```js
export function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const nonEmpty = rows.filter(r => r.some(v => v.trim() !== ''));
  if (!nonEmpty.length) return [];
  const headers = nonEmpty[0].map(h => h.trim().toLowerCase());
  return nonEmpty.slice(1).map(r =>
    Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}
```

- [ ] **Step 5: Run** `npx vitest run tests/csv.test.js` — Expected: 4 passed.
- [ ] **Step 6: Commit** `git add -A && git commit -m "feat: scaffold project and CSV parser"`

---

### Task 2: Normalização e carregamento de produtos

**Files:**
- Create: `src/config.js`, `src/domain/format.js`, `src/data/products.js`, `public/sample.csv`
- Test: `tests/products.test.js`, `tests/format.test.js`

**Interfaces:**
- Consumes: `parseCSV` (Task 1).
- Produces:
  - `type Product = { id: string, nome: string, categoria: 'camisetas'|'bermudas'|'bonés'|'tênis', preco: number, tamanhos: string[], fotos: string[], linkInstagram: string }`
  - `parsePrice(raw: string): number|null`, `formatPrice(n: number): string` (em `domain/format.js`)
  - `normalizeRow(row): Product|null` — retorna `null` se inválida ou indisponível.
  - `loadProducts({ url, fetchFn = fetch, storage = localStorage }): Promise<{ products: Product[], source: 'network'|'cache'|'none' }>`; chave de cache `sc:products:v1`.

- [ ] **Step 1: Config** — `src/config.js`
```js
export const config = {
  storeName: 'Sport Conceito',
  csvUrl: import.meta.env.VITE_CSV_URL || './sample.csv',
  whatsapp: '5500000000000', // trocar pelo número real (DDI+DDD+número)
  instagram: 'sportconceito_',
  address: 'Endereço da loja',
  hours: 'Seg–Sáb, 9h–19h',
};
```
`public/sample.csv` com 8 linhas (2 por categoria, uma delas `disponivel=FALSE`, um boné com `tamanhos` vazio), fotos `https://picsum.photos/seed/sc1/600/750` … `sc8`.

- [ ] **Step 2: Failing tests** — `tests/format.test.js`
```js
import { it, expect } from 'vitest';
import { parsePrice, formatPrice } from '../src/domain/format.js';
it.each([['89,90', 89.9], ['R$ 89,90', 89.9], ['89.90', 89.9], ['1.299,00', 1299], ['120', 120], ['', null], ['abc', null]])
  ('parsePrice(%s)', (raw, out) => expect(parsePrice(raw)).toBe(out));
it('formatPrice', () => expect(formatPrice(1299).replace(/\s/g, ' ')).toBe('R$ 1.299,00'));
```
`tests/products.test.js`
```js
import { describe, it, expect, vi } from 'vitest';
import { normalizeRow, loadProducts } from '../src/data/products.js';

const row = (o = {}) => ({ id: '1', nome: 'Tênis X', categoria: '  Tênis ', preco: 'R$ 299,90',
  tamanhos: '38, 39 ,40', foto_url: 'https://a/1.jpg', foto2_url: '', link_instagram: 'https://instagram.com/p/x', disponivel: 'sim', ...o });

describe('normalizeRow', () => {
  it('normalizes a valid row', () => {
    expect(normalizeRow(row())).toEqual({ id: '1', nome: 'Tênis X', categoria: 'tênis', preco: 299.9,
      tamanhos: ['38', '39', '40'], fotos: ['https://a/1.jpg'], linkInstagram: 'https://instagram.com/p/x' });
  });
  it('maps unaccented categories', () => expect(normalizeRow(row({ categoria: 'BONES' })).categoria).toBe('bonés'));
  it.each(['FALSE', 'não', '', 'nao'])('rejects disponivel=%s', v => expect(normalizeRow(row({ disponivel: v }))).toBeNull());
  it.each(['TRUE', 'x', '1', ' S '])('accepts disponivel=%s', v => expect(normalizeRow(row({ disponivel: v }))).not.toBeNull());
  it.each([{ nome: '' }, { categoria: 'meias' }, { preco: 'abc' }, { foto_url: '' }])('rejects invalid %o', o => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(normalizeRow(row(o))).toBeNull();
    expect(warn).toHaveBeenCalled(); warn.mockRestore();
  });
  it('empty tamanhos → []', () => expect(normalizeRow(row({ tamanhos: '' })).tamanhos).toEqual([]));
});

const memStorage = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
const csv = 'id,nome,categoria,preco,tamanhos,foto_url,foto2_url,link_instagram,disponivel\n1,Boné,bonés,59,,https://a/b.jpg,,,TRUE\n2,Off,bonés,59,,https://a/c.jpg,,,FALSE';

describe('loadProducts', () => {
  it('loads from network and caches', async () => {
    const storage = memStorage();
    const fetchFn = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(csv) });
    const r = await loadProducts({ url: 'u', fetchFn, storage });
    expect(r.source).toBe('network'); expect(r.products.map(p => p.id)).toEqual(['1']);
    expect(storage.getItem('sc:products:v1')).toContain('Boné');
  });
  it('falls back to cache on failure', async () => {
    const storage = memStorage();
    storage.setItem('sc:products:v1', JSON.stringify([{ id: '9' }]));
    const r = await loadProducts({ url: 'u', fetchFn: vi.fn().mockRejectedValue(new Error('x')), storage });
    expect(r).toEqual({ products: [{ id: '9' }], source: 'cache' });
  });
  it('treats non-ok and empty CSV as failure', async () => {
    const r = await loadProducts({ url: 'u', fetchFn: vi.fn().mockResolvedValue({ ok: false }), storage: memStorage() });
    expect(r).toEqual({ products: [], source: 'none' });
    const r2 = await loadProducts({ url: 'u', fetchFn: vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('') }), storage: memStorage() });
    expect(r2.source).toBe('none');
  });
  it('survives a throwing storage', async () => {
    const storage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    const r = await loadProducts({ url: 'u', fetchFn: vi.fn().mockRejectedValue(new Error('x')), storage });
    expect(r.source).toBe('none');
  });
});
```

- [ ] **Step 3: Run** `npx vitest run` — Expected: FAIL (modules missing).

- [ ] **Step 4: Implement** — `src/domain/format.js`
```js
export function parsePrice(raw) {
  let s = String(raw ?? '').replace(/[^\d.,]/g, '');
  if (!s) return null;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatPrice = n => fmt.format(n);
```
`src/data/products.js`
```js
import { parseCSV } from './csv.js';
import { parsePrice } from '../domain/format.js';

const CACHE_KEY = 'sc:products:v1';
const CATEGORIES = { camisetas: 'camisetas', camiseta: 'camisetas', bermudas: 'bermudas', bermuda: 'bermudas',
  'bonés': 'bonés', bones: 'bonés', 'boné': 'bonés', bone: 'bonés', 'tênis': 'tênis', tenis: 'tênis' };
const TRUTHY = new Set(['true', 'sim', 's', '1', 'x']);

export function normalizeRow(r) {
  if (!TRUTHY.has(String(r.disponivel ?? '').trim().toLowerCase())) return null;
  const nome = (r.nome ?? '').trim();
  const categoria = CATEGORIES[(r.categoria ?? '').trim().toLowerCase()];
  const preco = parsePrice(r.preco);
  const fotos = [r.foto_url, r.foto2_url].map(f => (f ?? '').trim()).filter(Boolean);
  if (!nome || !categoria || preco === null || !fotos.length) {
    console.warn('[catálogo] linha ignorada:', r);
    return null;
  }
  return { id: (r.id ?? '').trim() || nome, nome, categoria, preco,
    tamanhos: (r.tamanhos ?? '').split(',').map(t => t.trim()).filter(Boolean),
    fotos, linkInstagram: (r.link_instagram ?? '').trim() };
}

function safe(fn) { try { return fn(); } catch { return null; } }

export async function loadProducts({ url, fetchFn = fetch, storage = globalThis.localStorage } = {}) {
  try {
    const res = await fetchFn(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP');
    const rows = parseCSV(await res.text());
    if (!rows.length) throw new Error('CSV vazio');
    const products = rows.map(normalizeRow).filter(Boolean);
    safe(() => storage.setItem(CACHE_KEY, JSON.stringify(products)));
    return { products, source: 'network' };
  } catch {
    const cached = safe(() => JSON.parse(storage.getItem(CACHE_KEY)));
    if (Array.isArray(cached)) return { products: cached, source: 'cache' };
    return { products: [], source: 'none' };
  }
}
```

- [ ] **Step 5: Run** `npx vitest run` — Expected: all pass.
- [ ] **Step 6: Commit** `git commit -am "feat: product normalization and loading with cache"` (após `git add -A`).

---

### Task 3: Filtro e link do WhatsApp

**Files:**
- Create: `src/domain/filter.js`, `src/domain/whatsapp.js`
- Test: `tests/domain.test.js`

**Interfaces:**
- Produces: `filterByCategory(products: Product[], cat: string): Product[]` (`'todos'` → todos); `buildWhatsAppLink(phone: string, product: Product, size?: string): string`.

- [ ] **Step 1: Failing test** — `tests/domain.test.js`
```js
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
```
- [ ] **Step 2: Run** `npx vitest run tests/domain.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement**
`src/domain/filter.js`
```js
export const filterByCategory = (products, cat) =>
  cat === 'todos' ? products : products.filter(p => p.categoria === cat);
```
`src/domain/whatsapp.js`
```js
import { formatPrice } from './format.js';
export function buildWhatsAppLink(phone, product, size) {
  const lines = [`Olá! Tenho interesse no produto: ${product.nome} (${formatPrice(product.preco)})`];
  if (size) lines.push(`Tamanho: ${size}`);
  if (product.linkInstagram) lines.push(product.linkInstagram);
  return `https://wa.me/${String(phone).replace(/\D/g, '')}?text=${encodeURIComponent(lines.join('\n'))}`;
}
```
- [ ] **Step 4: Run** — Expected: 4 passed.
- [ ] **Step 5: Commit** `feat: category filter and WhatsApp link builder`

---

### Task 4: Paleta, tokens e efeitos de luz/sombra

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/effects.css`, `src/ui/spotlight.js`, `public/placeholder.svg`, `docs/paleta.md`

**Interfaces:**
- Produces: CSS custom properties `--bg --surface --text --muted --line --accent --accent-rgb --radius --font-display --font-body`; classes `.glow-btn`, `.text-glow`, `.hero-blob`, `.bg-grid`, `.grain`, `.spotlight` (usa `--mx/--my`); `initSpotlight(root: Element): void`.

- [ ] **Step 1: Extrair paleta** — abrir `https://www.instagram.com/sportconceito_/` no navegador embutido (`get_page_text`/screenshot). Identificar cor dominante do logo/posts, fundo e acento. Se exigir login, PARAR e pedir ao usuário um print do perfil. Registrar hex + origem em `docs/paleta.md`.
- [ ] **Step 2: Invocar o skill `ui-ux-pro-max`** com: "vitrine de loja de moda esportiva/streetwear, mobile-first, referência Volcom, paleta: <hex>" — adotar pares de fonte (Google Fonts) e checar contraste AA dos pares texto/fundo. Registrar escolhas em `docs/paleta.md`.
- [ ] **Step 3: tokens.css** (valores de exemplo; substituir pelos extraídos)
```css
:root{
  --bg:#0b0b0d; --surface:#141418; --text:#f4f4f5; --muted:#a1a1aa; --line:#27272a;
  --accent:#e11d2e; --accent-rgb:225 29 46; --radius:14px;
  --font-display:'Archivo Black',system-ui,sans-serif; --font-body:'Inter',system-ui,sans-serif;
}
```
- [ ] **Step 4: effects.css** (portado de dataflow-inventory-site, violeta → `--accent-rgb`)
```css
.glow-btn{box-shadow:0 0 0 1px rgb(var(--accent-rgb)/.6),0 18px 60px -12px rgb(var(--accent-rgb)/.75);transition:box-shadow .3s,transform .2s}
.glow-btn:hover{transform:translateY(-1px);box-shadow:0 0 0 1px rgb(var(--accent-rgb)/.9),0 22px 70px -10px rgb(var(--accent-rgb)/.9)}
.text-glow{filter:drop-shadow(0 0 28px rgb(var(--accent-rgb)/.55)) drop-shadow(0 0 80px rgb(var(--accent-rgb)/.3))}
.hero-blob{position:absolute;width:60vmax;height:60vmax;border-radius:50%;background:rgb(var(--accent-rgb)/.35);filter:blur(140px);pointer-events:none;z-index:0}
.bg-grid{background-image:linear-gradient(90deg,rgb(var(--accent-rgb)/.09) 1px,transparent 1px),linear-gradient(rgb(var(--accent-rgb)/.09) 1px,transparent 1px);background-size:64px 64px;-webkit-mask-image:radial-gradient(80% 70% at 50% 40%,#000 30%,transparent 75%);mask-image:radial-gradient(80% 70% at 50% 40%,#000 30%,transparent 75%)}
.grain::after{content:"";position:fixed;inset:-50%;z-index:60;pointer-events:none;opacity:.075;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");animation:grain 1.2s steps(6,end) infinite}
@keyframes grain{0%{transform:translate(0)}20%{transform:translate(-5%,3%)}40%{transform:translate(3%,-4%)}60%{transform:translate(-3%,5%)}80%{transform:translate(4%,-2%)}100%{transform:translate(0)}}
.spotlight{position:relative;isolation:isolate}
@media (hover:hover){.spotlight::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:1;opacity:0;transition:opacity .3s;background:radial-gradient(420px circle at var(--mx,-400px) var(--my,-400px),rgb(var(--accent-rgb)/.22),transparent 65%)}.spotlight:hover::before{opacity:1}}
.icon-glow{transition:box-shadow .3s}.icon-glow:hover{box-shadow:0 0 16px 4px rgb(var(--accent-rgb)/.6)}
@media (prefers-reduced-motion:reduce){.grain::after{animation:none}*{transition-duration:.01ms!important;animation-duration:.01ms!important}}
```
`src/ui/spotlight.js`
```js
export function initSpotlight(root) {
  if (!matchMedia('(hover: hover)').matches) return;
  root.addEventListener('pointermove', e => {
    const el = e.target.closest('.spotlight'); if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
}
```
`base.css`: reset, `body{background:var(--bg);color:var(--text);font-family:var(--font-body)}`, `:focus-visible{outline:2px solid var(--accent);outline-offset:2px}`, `.sr-only`. `placeholder.svg`: retângulo `--surface` com ícone de camiseta.
- [ ] **Step 5: Commit** `feat: design tokens, palette and light/shadow effects`

---

### Task 5: Página, grade e filtros

**Files:**
- Create: `index.html`, `src/styles/components.css`, `src/ui/grid.js`, `src/ui/filters.js`
- Test: `tests/ui.test.js`

**Interfaces:**
- Consumes: `Product`, `formatPrice`, `config`.
- Produces: `renderGrid(container: Element, products: Product[], onOpen: (p: Product) => void): void`; `renderFilters(container: Element, active: string, onChange: (cat: string) => void): void`. Categorias UI: `[['todos','Todos'],['camisetas','Camisetas'],['bermudas','Bermudas'],['bonés','Bonés'],['tênis','Tênis']]`.

- [ ] **Step 1: Failing test** — `tests/ui.test.js`
```js
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
```
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** — `src/ui/grid.js` (somente `textContent`, nunca `innerHTML` com dados)
```js
import { formatPrice } from '../domain/format.js';
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
    const price = document.createElement('span'); price.className = 'card-price'; price.textContent = formatPrice(p.preco);
    b.append(img, name, price);
    b.addEventListener('click', () => onOpen(p));
    container.append(b);
  }
}
```
`src/ui/filters.js`
```js
export const CATEGORIES = [['todos','Todos'],['camisetas','Camisetas'],['bermudas','Bermudas'],['bonés','Bonés'],['tênis','Tênis']];
export function renderFilters(container, active, onChange) {
  container.replaceChildren(...CATEGORIES.map(([value, label]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = label;
    b.setAttribute('aria-pressed', String(value === active));
    b.addEventListener('click', () => onChange(value));
    return b;
  }));
}
```
`index.html`: `<body class="grain">` com `header.site-header` (logo texto, nav com links âncora `#catalogo`, link Instagram `.icon-glow` com `aria-label`), `section.hero.bg-grid` (`.hero-blob`, `h1.text-glow` "Novidades da semana", CTA `a.glow-btn href="#catalogo"`), `section#catalogo` com `div#filters role="group" aria-label="Categorias"` e `div#grid aria-live="polite"`, `footer` (endereço, horário, Instagram — preenchidos por `main.js` a partir de `config`), `a#wa-float.glow-btn` flutuante, `<script type="module" src="/src/main.js">`. Google Fonts via `<link>` com as fontes da Task 4.
`components.css`: header fixo com `backdrop-filter: blur(12px)`; grade `grid-template-columns: repeat(2,1fr)` → `repeat(3,1fr)` em ≥768px → `repeat(4,1fr)` em ≥1024px; `.card img{aspect-ratio:4/5;object-fit:cover;transition:transform .5s}` e `@media (hover:hover){.card:hover img{transform:scale(1.06)}}`; chips com `aria-pressed="true"` em `--accent`; skeleton `.card.skeleton` com shimmer; grade com transição de opacidade ao trocar filtro.
- [ ] **Step 4: Run** `npx vitest run` — all pass.
- [ ] **Step 5: Commit** `feat: page layout, product grid and category filters`

---

### Task 6: Painel de detalhe do produto

**Files:**
- Create: `src/ui/product-sheet.js` (+ estilos em `components.css`)
- Test: `tests/sheet.test.js`

**Interfaces:**
- Consumes: `buildWhatsAppLink`, `formatPrice`, `config`.
- Produces: `openProductSheet(product: Product, { phone: string, instagram: string }): () => void` (retorna `close`). Usa `<dialog class="sheet">` com `showModal()`.

- [ ] **Step 1: Failing test** — `tests/sheet.test.js`
```js
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
```
- [ ] **Step 2: Run** — FAIL.
- [ ] **Step 3: Implement** — `src/ui/product-sheet.js`
```js
import { buildWhatsAppLink } from '../domain/whatsapp.js';
import { formatPrice } from '../domain/format.js';
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

export function openProductSheet(product, { phone, instagram }) {
  const d = el('dialog', 'sheet'); d.setAttribute('aria-label', product.nome);
  const closeBtn = el('button', 'sheet-close icon-glow', '×'); closeBtn.type = 'button'; closeBtn.setAttribute('aria-label', 'Fechar');
  const gallery = el('div', 'sheet-gallery');
  for (const src of product.fotos) { const i = el('img'); i.src = src; i.alt = product.nome;
    i.onerror = () => { i.onerror = null; i.src = './placeholder.svg'; }; gallery.append(i); }
  const wa = el('a', 'wa glow-btn', 'Comprar pelo WhatsApp'); wa.target = '_blank'; wa.rel = 'noopener';
  const ig = el('a', 'ig', 'Ver no Instagram'); ig.target = '_blank'; ig.rel = 'noopener';
  ig.href = product.linkInstagram || `https://www.instagram.com/${instagram}/`;
  let size;
  const updateWa = () => { wa.href = buildWhatsAppLink(phone, product, size); };
  const body = el('div', 'sheet-body');
  body.append(el('h2', 'sheet-title', product.nome), el('p', 'sheet-price', formatPrice(product.preco)));
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
```
CSS: `.sheet` mobile = ancorado embaixo, `max-height:90dvh`, raio superior, animação `translateY(100%)→0`; ≥768px = drawer à direita, `width:min(480px,100vw)`, `height:100dvh`, animação `translateX`; `::backdrop{background:rgb(0 0 0/.6);backdrop-filter:blur(4px)}`; galeria com `scroll-snap-type:x mandatory`; tamanhos `aria-pressed="true"` em `--accent`.
- [ ] **Step 4: Run** — all pass.
- [ ] **Step 5: Commit** `feat: product detail sheet with WhatsApp and Instagram actions`

---

### Task 7: Composição, estados e guia da planilha

**Files:**
- Create: `src/main.js`, `docs/guia-planilha.md`, `README.md`

**Interfaces:**
- Consumes: tudo acima.

- [ ] **Step 1: Implement** — `src/main.js`
```js
import './styles/tokens.css'; import './styles/base.css'; import './styles/effects.css'; import './styles/components.css';
import { config } from './config.js';
import { loadProducts } from './data/products.js';
import { filterByCategory } from './domain/filter.js';
import { renderGrid } from './ui/grid.js';
import { renderFilters } from './ui/filters.js';
import { openProductSheet } from './ui/product-sheet.js';
import { initSpotlight } from './ui/spotlight.js';

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
  const a = document.createElement('a'); a.href = igUrl; a.textContent = 'Veja nosso catálogo no Instagram'; a.className = 'glow-btn';
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

fillStoreInfo(); initSpotlight(document.body); showSkeleton();
const { products: list, source } = await loadProducts({ url: config.csvUrl });
products = list;
if (source === 'none') showOffline(); else render();
```
- [ ] **Step 2: Docs** — `docs/guia-planilha.md`: criar planilha com o cabeçalho exato; validação de dados em `categoria` (lista) e caixa de seleção em `disponivel`; como hospedar fotos (Google Drive → link `https://drive.google.com/uc?export=view&id=<ID>` ou imgbb); publicar como CSV; colar URL em `.env` como `VITE_CSV_URL=` (ou em `config.js`); exemplos de "cadastrar produto" e "esgotar produto". `README.md`: `npm install`, `npm run dev`, `npm test`, `npm run build`, deploy Cloudflare Pages (build `npm run build`, output `dist`) e apontar subdomínio DigitalPlat (registro CNAME para `<projeto>.pages.dev` no painel DigitalPlat + domínio customizado no Cloudflare Pages).
- [ ] **Step 3: Verify** `npm test && npm run build` — Expected: tests pass, `dist/` gerado sem erros.
- [ ] **Step 4: Commit** `feat: compose app, loading/offline states and owner guide`

---

### Task 8: Verificação no navegador

**Files:** nenhum novo (correções pontuais se necessário).

- [ ] **Step 1:** Criar `.claude/launch.json` com `{"name":"sportconceito","runtimeExecutable":"npm","runtimeArgs":["run","dev"],"port":5173}` e iniciar com `preview_start`.
- [ ] **Step 2:** Em 375×812: skeleton → 7 produtos (o FALSE some); filtro "Tênis" mostra só tênis; abrir boné sem tamanho → sem seletor; abrir camiseta, escolher M → link do WhatsApp contém "Tamanho: M"; ESC e clique fora fecham; foco volta ao card.
- [ ] **Step 3:** Desktop: spotlight segue o cursor nos cards, glow nos botões, blob/grid/grain no hero; 4 colunas.
- [ ] **Step 4:** Trocar `csvUrl` para URL inválida → após um carregamento bom, mostra cache; limpando localStorage → mensagem com link do Instagram.
- [ ] **Step 5:** Emular `prefers-reduced-motion` → grain parado, sem animações. Conferir console sem erros.
- [ ] **Step 6:** `npm run build && npm run preview` e rodar Lighthouse mobile (meta ≥ 90 Performance e Acessibilidade). Corrigir o que faltar e commitar `fix: ...`.
