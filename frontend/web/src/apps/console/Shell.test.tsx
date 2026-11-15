import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Shell } from './Shell';
import type { ConsoleBoot } from './Shell';

const row = (i: number) => ({ intake_ref: 'ERP-' + String(i).padStart(7, '0'), source_system: i % 2 ? 'uidai' : 'cctns', source_form: 'f', subject: 'form ' + i, source_route: '/r',
  source_reference: 'T-' + i, full_name: 'Person ' + i, email: 'p' + i + '@x.test', received_at: '2026-11-0' + (1 + (i % 9)) + ' 10:00:00', fields: [{ name: 'a', label: 'A', value: 'v' + i }] });
const boot: ConsoleBoot = { page: 'intake', currentPath: '/intake', title: 'ERP - Received records', system: null, rows: Array.from({ length: 30 }, (_, i) => row(i + 1)),
  systems: [{ code: 'uidai', name: 'UIDAI' }, { code: 'cctns', name: 'CCTNS' }] };

describe('console shell', () => {
  it('shows 25 rows, pages them, searches across pages and opens the detail panel', async () => {
    render(<Shell boot={boot} />);
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(document.getElementById('pagerInfo')).toHaveTextContent('Showing 1–25 of 30');
    fireEvent.click(document.getElementById('pagerNext')!);
    expect(document.getElementById('pagerInfo')).toHaveTextContent('Showing 26–30 of 30');
    fireEvent.input(document.getElementById('tableSearch')!, { target: { value: 'person 7' } });
    expect(document.getElementById('pagerInfo')).toHaveTextContent('Showing 1–1 of 1');
    fireEvent.click(document.querySelector<HTMLElement>('tbody tr:not([style*="display: none"])')!);
    expect(document.getElementById('drawerTitle')).toHaveTextContent('ERP-0000007');
    expect(document.getElementById('drawerBody')).toHaveTextContent('Person 7');
    expect(screen.getByText('Intake record')).toBeInTheDocument();
  });
  it('escapes record values in the detail panel', async () => {
    const evil = { ...boot, rows: [{ ...row(1), full_name: '<img src=x onerror=alert(1)>' }] };
    render(<Shell boot={evil} />);
    fireEvent.click(document.querySelector('tbody tr')!);
    expect(document.querySelector('#drawerBody img')).toBeNull();
  });
});
