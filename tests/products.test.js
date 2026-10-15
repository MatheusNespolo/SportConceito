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
