// The signed-in person at the top right of the header: avatar, name and a chevron, opening a small menu with the role,
// the light / dark theme switch and Sign out. Name and role come from GET /api/me; the theme is the same one the sign-in
// and account pages use (data-theme on <html>, remembered under the same key), and Sign out posts the same form as before.
import { useCallback, useEffect, useRef, useState } from 'react';

const THEME_KEY = 'erp_auth_theme';
interface Me { name: string; role: string }

const initials = (s: string) => s.replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

/** Puts the remembered theme on <html>. Safe to call again; the page script already did it before the first paint. */
export function applySavedTheme() {
  let saved: string | null = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch { /* storage blocked */ }
  document.documentElement.setAttribute('data-theme', saved === 'dark' ? 'dark' : 'light');
}

/** The theme on <html>, and the one place that changes it (the menu and the Settings page both use this). */
export function currentTheme(): 'light' | 'dark' { return isDark() ? 'dark' : 'light'; }
export function setTheme(next: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem(THEME_KEY, next); } catch { /* the theme still changes for this visit */ }
  window.dispatchEvent(new Event('erp-theme'));
}

let meCache: Me | null = null;
/** Who is signed in (GET /api/me), asked once and kept for the page. */
export function useMe(initial?: Me): Me | null {
  const [me, setMe] = useState<Me | null>(initial || meCache);
  useEffect(() => {
    if (initial || meCache) return undefined;
    let live = true;
    fetch('/api/me', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((j) => {
      if (j && j.name) { meCache = { name: String(j.name), role: String(j.role || '').replace(/^Hub administrator$/i, 'Administrator') }; if (live) setMe(meCache); }
    }).catch(() => { /* the page still works without a name */ });
    return () => { live = false; };
  }, [initial]);
  return me;
}

const ico = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
const Sun = () => <svg {...ico}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
const Moon = () => <svg {...ico}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>;
const Out = () => <svg {...ico}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>;
const SettingsIc = () => <svg {...ico}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>;
const Chev = () => <svg {...ico} strokeWidth={2.4}><path d="m6 9 6 6 6-6" /></svg>;

/** `onSettings` adds a Settings entry to the menu (shown on phones and tablets only); `side` is the copy kept in the navigation panel. */
export function AccountMenu({ initial, onSettings, side }: { initial?: Me; onSettings?: () => void; side?: boolean }) {
  const [open, setOpen] = useState(false);
  const me = useMe(initial);
  const [dark, setDark] = useState(isDark);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  // the Settings page can change the theme too
  useEffect(() => { const on = () => setDark(isDark()); window.addEventListener('erp-theme', on); return () => window.removeEventListener('erp-theme', on); }, []);

  const close = useCallback((back: boolean) => { setOpen(false); if (back) trigger.current?.focus(); }, []);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(true); };
    const down = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) close(false); };
    document.addEventListener('keydown', key); document.addEventListener('mousedown', down);
    window.setTimeout(() => menu.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus(), 0);
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('mousedown', down); };
  }, [open, close]);

  const items = () => Array.from(menu.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') || []);
  const onMenuKey = (e: React.KeyboardEvent) => {
    const list = items(); if (!list.length) return;
    const i = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); list[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); list[list.length - 1].focus(); }
    else if (e.key === 'Tab') close(false);
  };
  const toggleTheme = () => {
    setTheme(dark ? 'light' : 'dark');
    setDark(!dark);
  };

  const name = me?.name || 'Signed in';
  return (
    <div className={`acm${side ? ' acm--side' : ' acm--top'}`} ref={wrap}>
      <button ref={trigger} type="button" className={`acm-trigger${open ? ' is-open' : ''}`} aria-haspopup="menu" aria-expanded={open} aria-label={`Account menu, ${name}`} onClick={() => setOpen(!open)}>
        <span className="acm-av" aria-hidden="true">{initials(name)}</span>
        <span className="acm-id"><b>{name}</b><span>{me?.role || 'Administrator'}</span></span>
        <span className="acm-chev"><Chev /></span>
      </button>
      <div ref={menu} className={`acm-pop${open ? ' is-open' : ''}`} role="menu" aria-label="Account" aria-hidden={!open} onKeyDown={onMenuKey}>
        <div className="acm-head">
          <span className="acm-av acm-av--lg" aria-hidden="true">{initials(name)}</span>
          <div className="acm-who"><b title={name}>{name}</b><span>{me?.role || 'Administrator'}</span></div>
        </div>
        {onSettings ? (
          <>
            <div className="acm-sep acm-only-small" role="separator" />
            <button type="button" className="acm-item acm-only-small" role="menuitem" tabIndex={open ? 0 : -1} onClick={() => { close(false); onSettings(); }}><SettingsIc /><span>Settings</span></button>
          </>
        ) : null}
        <div className="acm-sep" role="separator" />
        <button type="button" className="acm-item" role="menuitemcheckbox" aria-checked={dark} tabIndex={open ? 0 : -1} onClick={toggleTheme}>
          {dark ? <Moon /> : <Sun />}
          <span>Theme: {dark ? 'Dark' : 'Light'}</span>
          <span className="acm-switch" aria-hidden="true"><i /></span>
        </button>
        <div className="acm-sep" role="separator" />
        <form method="post" action="/logout" role="none">
          <button type="submit" className="acm-item acm-out" role="menuitem" tabIndex={open ? 0 : -1}><Out /><span>Logout</span></button>
        </form>
      </div>
    </div>
  );
}
