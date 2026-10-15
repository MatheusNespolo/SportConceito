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
    fotos, linkInstagram: safeUrl(r.link_instagram) };
}

function safe(fn) { try { return fn(); } catch { return null; } }

export async function loadProducts({ url, fetchFn = fetch, storage = globalThis.localStorage } = {}) {
  try {
    const res = await fetchFn(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP');
    const rows = parseCSV(await res.text());
    if (!rows.length) throw new Error('CSV vazio');
    if (!('nome' in rows[0]) || !('disponivel' in rows[0])) throw new Error('CSV sem colunas esperadas');
    const products = rows.map(normalizeRow).filter(Boolean);
    safe(() => storage.setItem(CACHE_KEY, JSON.stringify(products)));
    return { products, source: 'network' };
  } catch {
    const cached = safe(() => JSON.parse(storage.getItem(CACHE_KEY)));
    if (Array.isArray(cached)) return { products: cached, source: 'cache' };
    return { products: [], source: 'none' };
  }
}

function safeUrl(v) { const t = (v ?? '').trim(); return /^https?:\/\//i.test(t) ? t : ''; }
