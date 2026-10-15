import { describe, it, expect, vi } from 'vitest';
import { normalizeRow, loadProducts } from '../src/data/products.js';

const row = (o = {}) => ({ id: '1', nome: 'Tênis X', categoria: '  Tênis ', preco: 'R$ 299,90',
  tamanhos: '38, 39 ,40', foto_url: 'https://a/1.jpg', foto2_url: '', link_instagram: 'https://instagram.com/p/x', disponivel: 'sim', ...o });

describe('normalizeRow', () => {
  it('normalizes a valid row', () => {
    expect(normalizeRow(row())).toEqual({ id: '1', nome: 'Tênis X', categoria: 'tênis', preco: 299.9,
      tamanhos: ['38', '39', '40'], fotos: ['https://a/1.jpg'], linkInstagram: 'https://instagram.com/p/x', featured: false });
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

describe('loadProducts header validation', () => {
  it('treats a 200 response without expected columns as failure and keeps cache', async () => {
    const storage = memStorage();
    const cachedJson = JSON.stringify([{ id: '9' }]);
    storage.setItem('sc:products:v1', cachedJson);
    const html = '<!doctype html>\n<html>\n<body>\n<p>Sign in</p>\n<p>Continue</p>\n</body>\n</html>';
    const r = await loadProducts({ url: 'u', fetchFn: vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(html) }), storage });
    expect(r).toEqual({ products: [{ id: '9' }], source: 'cache' });
    expect(storage.getItem('sc:products:v1')).toBe(cachedJson);
  });
  it('treats a valid sheet with all rows unavailable as empty network result', async () => {
    const storage = memStorage();
    const allFalse = 'id,nome,categoria,preco,tamanhos,foto_url,foto2_url,link_instagram,disponivel\n1,Boné,bonés,59,,https://a/b.jpg,,,FALSE';
    const r = await loadProducts({ url: 'u', fetchFn: vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(allFalse) }), storage });
    expect(r).toEqual({ products: [], source: 'network' });
  });
});

describe('link_instagram sanitising', () => {
  it('drops javascript: links', () => expect(normalizeRow(row({ link_instagram: 'javascript:alert(1)' })).linkInstagram).toBe(''));
  it('keeps http and https links', () => {
    expect(normalizeRow(row({ link_instagram: 'http://instagram.com/p/x' })).linkInstagram).toBe('http://instagram.com/p/x');
    expect(normalizeRow(row({ link_instagram: ' HTTPS://instagram.com/p/x ' })).linkInstagram).toBe('HTTPS://instagram.com/p/x');
  });
});

describe('optional price', () => {
  it('accepts empty preco as null', () => {
    expect(normalizeRow(row({ preco: '' })).preco).toBeNull();
    expect(normalizeRow(row({ preco: '   ' })).preco).toBeNull();
  });
});

describe('featured (destaque)', () => {
  it.each(['TRUE', 'sim', ' S ', '1', 'x', 'X'])('destaque=%s → featured true', v => expect(normalizeRow(row({ destaque: v })).featured).toBe(true));
  it.each(['FALSE', 'não', '', undefined])('destaque=%s → featured false', v => expect(normalizeRow(row({ destaque: v })).featured).toBe(false));
  it('missing destaque column → featured false', () => expect(normalizeRow(row()).featured).toBe(false));
});

describe('loadProducts featured ordering', () => {
  const head = 'id,nome,categoria,preco,tamanhos,foto_url,foto2_url,link_instagram,disponivel,destaque\n';
  const body = ['1,A,bonés,59,,https://a/1.jpg,,,TRUE,', '2,B,bonés,59,,https://a/2.jpg,,,TRUE,sim', '3,C,bonés,59,,https://a/3.jpg,,,TRUE,',
    '4,D,bonés,59,,https://a/4.jpg,,,TRUE,x'].join('\n');
  const load = text => loadProducts({ url: 'u', fetchFn: vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(text) }), storage: memStorage() });
  it('puts featured first, stable otherwise', async () => {
    expect((await load(head + body)).products.map(p => p.id)).toEqual(['2', '4', '1', '3']);
  });
  it('sheets without destaque column still work, order preserved', async () => {
    const r = await load(csv);
    expect(r.source).toBe('network'); expect(r.products.map(p => p.id)).toEqual(['1']);
  });
});
