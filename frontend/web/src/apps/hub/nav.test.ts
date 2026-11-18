import { describe, expect, it } from 'vitest';
import { D, buildNav } from './model';

const sys = (code: string, name: string) => ({ code, name, short: name, port: 4000, hostname: '', forms: 0 });
const dept = (code: string, total: number, pending: number, rejected: number) => ({ code, totalRecords: total, integration: { pending, rejected, delivered: total } });

describe('hub navigation', () => {
  it('follows the data flow: command centre, ERP, departments, integration bus, access and audit, system', () => {
    D.SYSTEMS = [sys('eprisons', 'ePrisons'), sys('cctns', 'CCTNS')];
    D.OFFICES = null;
    const nav = buildNav();
    expect(nav.map((g) => g.label)).toEqual(['Overview', 'Workbench', 'ERP · record of truth', 'Departments', 'Integration bus', 'Access & audit', 'System']);
    expect(nav[1].items.map((i) => i.view)).toEqual(['apply', 'approvals', 'work']);
    expect(nav[3].items.map((i) => i.view)).toEqual(['dept:eprisons', 'dept:cctns']);
    expect(nav[4].items.map((i) => i.view)).toEqual(['queue', 'failures', 'sync', 'recon']);
  });
  it('shows counts from the offices, and flags waiting or rejected events', () => {
    D.SYSTEMS = [sys('eprisons', 'ePrisons'), sys('cctns', 'CCTNS')];
    D.OFFICES = { departments: [dept('eprisons', 46, 0, 0), dept('cctns', 34, 2, 1)] };
    const nav = buildNav();
    const items = Object.fromEntries(nav.flatMap((g) => g.items).map((i) => [i.view, i]));
    expect(items['dept:cctns'].count).toBe(34);
    expect(items['records'].count).toBe(80);
    expect(items['queue'].count).toBe(3);
    expect(items['queue'].warn).toBe(true);
    expect(items['failures'].count).toBe(1);
  });
  it('hides the queue count when everything is delivered', () => {
    D.SYSTEMS = [sys('eprisons', 'ePrisons')];
    D.OFFICES = { departments: [dept('eprisons', 5, 0, 0)] };
    const items = Object.fromEntries(buildNav().flatMap((g) => g.items).map((i) => [i.view, i]));
    expect(items['queue'].count).toBeNull();
    expect(items['failures'].count).toBeNull();
  });
});
