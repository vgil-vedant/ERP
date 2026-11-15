import { describe, expect, it } from 'vitest';
import { D } from './model';
import { officeDaily, officeMetrics } from './offices';

const dept = (code: string, total: number, i: [number, number, number]) => ({
  code, short: code, totalRecords: total, integration: { delivered: i[0], pending: i[1], rejected: i[2] },
  summary: { types: [{ open: 2 }, { open: null }], people: 3 },
  daily: { records: [{ d: new Date().toISOString().slice(0, 10), n: total }], undelivered: [] }, records: [], events: [], activity: [],
});

describe('dashboard department figures', () => {
  D.OFFICES = { departments: [dept('a', 46, [46, 0, 0]), dept('b', 34, [30, 3, 1])] } as never;
  it('sums records and bus outcomes across the offices', () => {
    const m = officeMetrics();
    expect([m.records, m.delivered, m.pending, m.rejected, m.events]).toEqual([80, 76, 3, 1, 80]);
    expect(m.per[0].open).toBe(2);
  });
  it('puts today\'s records in the last day of the series', () => {
    const s = officeDaily(7);
    expect(s).toHaveLength(7);
    expect(s[6].received).toBe(80);
    expect(officeDaily(7, 'a')[6].received).toBe(46);
  });
});
