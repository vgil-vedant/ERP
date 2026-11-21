import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { D } from './model';
import { SettingsView, isMine, myActivity, perBucket, perDay, readNavPref } from './settings';

const at = (daysAgo: number, hour = 10) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(hour, 0, 0, 0); return d; };
const iso = (d: Date) => d.toISOString().replace('T', ' ').slice(0, 19);

const setData = () => {
  D.AUDIT = [
    { id: 1, at: at(0), entity: 'lookup', entityId: 'PSN-1', action: 'READ', maker: 'hub:admin', approver: null, details: 'Aadhaar shown', ref: '' },
    { id: 2, at: at(1), entity: 'lookup', entityId: '', action: 'SEARCH', maker: 'hub:admin', approver: null, details: 'search by name', ref: '' },
    { id: 3, at: at(1), entity: 'ingest', entityId: 'x', action: 'RECEIVE', maker: 'bus:uidai', approver: null, details: 'someone else', ref: '' },
    { id: 4, at: at(2), entity: 'lookup', entityId: '', action: 'READ', maker: 'hub:other', approver: null, details: 'another user', ref: '' },
  ] as never;
  D.OFFICES = { departments: [{ short: 'CCTNS', activity: [
    { at: iso(at(0, 12)), officer: 'erp-hub:admin', action: 'APPROVE', details: 'approved a request' },
    { at: iso(at(3)), officer: 'cctns.officer', action: 'CREATE', details: 'not this account' },
  ] }] } as never;
};

describe('whose events are whose', () => {
  it('matches the username, with or without the hub prefix, and nothing else', () => {
    expect(isMine('admin', 'admin')).toBe(true);
    expect(isMine('hub:admin', 'admin')).toBe(true);
    expect(isMine('erp-hub:Admin', 'admin')).toBe(true);
    expect(isMine('hub:administrator', 'admin')).toBe(false);
    expect(isMine('bus:uidai', 'admin')).toBe(false);
    expect(isMine(null, 'admin')).toBe(false);
    expect(isMine('hub:admin', '')).toBe(false);
  });
  it('collects this account’s audit entries and office actions, newest first', () => {
    setData();
    const ev = myActivity('admin');
    expect(ev).toHaveLength(3);
    expect(ev.map((e) => e.source)).toEqual(expect.arrayContaining(['Audit', 'Office']));
    expect(ev.every((e) => e.detail !== 'someone else' && e.detail !== 'another user' && e.detail !== 'not this account')).toBe(true);
    expect(ev[0].at.getTime()).toBeGreaterThanOrEqual(ev[1].at.getTime());
  });
  it('counts per day over a span, oldest first, leaving out what is older', () => {
    setData();
    const days = perDay(myActivity('admin'), 3);
    expect(days).toHaveLength(3);
    expect(days[2].audit).toBe(1);
    expect(days[2].office).toBe(1);
    expect(days[1].audit).toBe(1);
    expect(perDay(myActivity('admin'), 1)[0].audit + perDay(myActivity('admin'), 1)[0].office).toBe(2);
  });
});

describe('the Settings page', () => {
  beforeEach(() => {
    setData();
    try { localStorage.clear(); } catch { /* ignore */ }
    document.documentElement.setAttribute('data-theme', 'light');
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ name: 'admin', role: 'Administrator' }) })));
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('shows nothing until it is the page being looked at', () => {
    const { container } = render(<SettingsView active={false} collapsed={false} setCollapsed={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the account, and a graph of only this account’s activity', async () => {
    render(<SettingsView active collapsed={false} setCollapsed={() => {}} />);
    await waitFor(() => expect(screen.getAllByText('admin').length).toBeGreaterThan(0));
    expect(screen.getByText('Administrator', { selector: '.def-val' })).toBeTruthy();
    // three events are this account's; the others are not counted
    expect(screen.getByText('Actions recorded').nextSibling?.textContent).toBe('3');
    // overall: from the first action to today, a bar per day
    expect(screen.getByRole('img', { name: /Actions per day, overall \(2 days\): 3 in all/ })).toBeTruthy();
    expect(screen.queryByText('someone else')).toBeNull();
  });

  it('switches between overall and a day picked in the calendar, and the graph follows', async () => {
    render(<SettingsView active collapsed={false} setCollapsed={() => {}} />);
    await waitFor(() => expect(screen.getAllByText('admin').length).toBeGreaterThan(0));
    expect(screen.getByRole('radio', { name: 'Overall' }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: /Calendar/ }));
    const dlg = screen.getByRole('dialog', { name: 'Choose dates' });
    expect(dlg).toBeTruthy();
    const d = at(1);
    const label = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    fireEvent.click(screen.getByRole('gridcell', { name: label }));   // yesterday, once: one day
    expect(screen.getByRole('img', { name: /Actions per hour, .*: 1 in all/ })).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Overall' }));
    expect(screen.getByRole('img', { name: /Actions per day, overall/ })).toBeTruthy();
  });

  it('counts a long period by week and month', () => {
    const f = new Date(2026, 0, 1), t = new Date(2026, 5, 30);
    expect(perBucket([], f, t).unit).toBe('week');
    expect(perBucket([], new Date(2024, 0, 1), t).unit).toBe('month');
    const one = perBucket([{ at: new Date(2026, 0, 1, 13), source: 'Audit', action: 'READ', detail: '', where: '' }], f, f);
    expect(one.unit).toBe('hour');
    expect(one.buckets).toHaveLength(24);
    expect(one.buckets[13].audit).toBe(1);
  });

  it('says so when the account has no recorded activity', async () => {
    D.AUDIT = [] as never; D.OFFICES = { departments: [] } as never;
    render(<SettingsView active collapsed={false} setCollapsed={() => {}} />);
    expect(await screen.findByText('No activity is recorded for this account yet.')).toBeTruthy();
  });

  it('changes the theme for the whole page and remembers it', async () => {
    render(<SettingsView active collapsed={false} setCollapsed={() => {}} />);
    const dark = screen.getByRole('radio', { name: /Dark/ });
    expect(dark.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(dark);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('erp_auth_theme')).toBe('dark');
    expect(screen.getByRole('radio', { name: /Dark/ }).getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: /Light/ }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('keeps the navigation bar choice, applies it now, and resets', () => {
    const setCollapsed = vi.fn();
    render(<SettingsView active collapsed={false} setCollapsed={setCollapsed} />);
    expect(readNavPref()).toBe('auto');
    fireEvent.click(screen.getByRole('radio', { name: 'Icons only' }));
    expect(setCollapsed).toHaveBeenCalledWith(true);
    expect(readNavPref()).toBe('collapsed');
    fireEvent.click(screen.getByRole('radio', { name: 'Always open' }));
    expect(setCollapsed).toHaveBeenLastCalledWith(false);
    expect(readNavPref()).toBe('expanded');
    fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }));
    expect(readNavPref()).toBe('auto');
  });
});
