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
