// Dropdown and calendar controls drawn in the hub's own style, in place of the browser's native pop-ups
// (which cannot be styled). Keyboard: arrows, Enter, Escape, Home/End, type-ahead; the pop-up is a
// fixed-position portal, so no card or table can clip it.
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './controls.css';
import { Svg } from './lib';

export interface Opt { value: string; label: string }

/* ------------------------------ pop-up placement ------------------------------ */
function usePopup(open: boolean, close: () => void, trigger: React.RefObject<HTMLElement>, pop: React.RefObject<HTMLElement>, matchWidth: boolean) {
  const [style, setStyle] = useState<CSSProperties>({ position: 'fixed', top: 0, left: 0, visibility: 'hidden' });
  const place = useCallback(() => {
    const t = trigger.current, p = pop.current;
    if (!t || !p) return;
    const r = t.getBoundingClientRect();
    const h = p.offsetHeight, w = p.offsetWidth;
    const below = window.innerHeight - r.bottom, above = r.top;
    const up = below < h + 12 && above > below;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - Math.max(w, matchWidth ? r.width : 0) - 8));
    setStyle({
      position: 'fixed', left, zIndex: 3000, visibility: 'visible',
      ...(matchWidth ? { minWidth: r.width } : null),
      ...(up ? { bottom: window.innerHeight - r.top + 6, maxHeight: Math.max(160, above - 14) } : { top: r.bottom + 6, maxHeight: Math.max(160, below - 14) }),
    });
  }, [trigger, pop, matchWidth]);
  useLayoutEffect(() => { if (open) place(); }, [open, place]);
  useEffect(() => {
    if (!open) return;
    const inPop = (n: EventTarget | null) => n instanceof Element && !!n.closest('.ui-pop');
    const down = (e: MouseEvent) => { const n = e.target as Node; if (!pop.current?.contains(n) && !trigger.current?.contains(n) && !inPop(n)) close(); };
    // a pop-up stays open until the user clicks outside it (or chooses / presses Escape); scrolling or resizing only moves it with its field
    const reflow = (e?: Event) => { if (e && e.target instanceof Element && inPop(e.target)) return; place(); };
    document.addEventListener('mousedown', down); window.addEventListener('resize', reflow); window.addEventListener('scroll', reflow, true);
    return () => { document.removeEventListener('mousedown', down); window.removeEventListener('resize', reflow); window.removeEventListener('scroll', reflow, true); };
  }, [open, close, pop, trigger, place]);
  return style;
}

/* ----------------------------------- Select ----------------------------------- */
export interface SelectProps {
  value: string; onChange: (v: string) => void; options: Opt[];
  /** shown when nothing is chosen; when `clearable` it is also the first row, which clears the choice */
  placeholder?: string; clearable?: boolean;
  ariaLabel?: string; id?: string; disabled?: boolean; invalid?: boolean; describedBy?: string; required?: boolean;
  /** "field" = compact toolbar look, "form" = full-width form look */
  variant?: 'field' | 'form'; className?: string;
}
export function Select({ value, onChange, options, placeholder, clearable, ariaLabel, id, disabled, invalid, describedBy, required, variant = 'field', className }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [q, setQ] = useState('');
  const btn = useRef<HTMLButtonElement>(null), pop = useRef<HTMLDivElement>(null), searchBox = useRef<HTMLInputElement>(null), buf = useRef({ s: '', t: 0 });
  const uid = useId();
  const rows: Opt[] = useMemo(() => (clearable && placeholder ? [{ value: '', label: placeholder }] : []).concat(options), [options, clearable, placeholder]);
  const cur = rows.findIndex((o) => o.value === value);
  // the search box narrows the list; `vis` holds the rows still shown, with their place in `rows`
  const vis = useMemo(() => { const t = q.trim().toLowerCase(); return rows.map((o, i) => ({ o, i })).filter(({ o }) => !t || (o.value !== '' && o.label.toLowerCase().includes(t))); }, [rows, q]);
  const shown = options.find((o) => o.value === value);
  const close = useCallback(() => setOpen(false), []);
  const style = usePopup(open, close, btn, pop, true);

  const openIt = () => { if (disabled) return; setQ(''); setActive(Math.max(0, cur)); setOpen(true); };
  const choose = (i: number) => { const o = vis[i] && vis[i].o; if (o) onChange(o.value); setOpen(false); btn.current?.focus({ preventScroll: true }); };
  useEffect(() => { if (open) requestAnimationFrame(() => searchBox.current?.focus({ preventScroll: true })); }, [open]);
  // keep the highlighted row visible by scrolling the list itself; scrollIntoView would also scroll the page (and the date pop-up it sits in)
  useLayoutEffect(() => {
    const list = pop.current?.querySelector<HTMLElement>('.ui-opts'); const row = list?.querySelector<HTMLElement>('[data-active="true"]');
    if (!list || !row) return;
    if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop - 6;
    else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight + 6;
  }, [open, active, style.maxHeight]);

  const key = (e: KeyboardEvent, inSearch = false) => {
    if (disabled) return;
    const k = e.key;
    if (!open) { if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ') { e.preventDefault(); openIt(); } return; }
    if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (k === 'Tab') { close(); return; }
    if (k === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(vis.length - 1, a + 1)); }
    else if (k === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (!inSearch && k === 'Home') { e.preventDefault(); setActive(0); }
    else if (!inSearch && k === 'End') { e.preventDefault(); setActive(vis.length - 1); }
    else if (k === 'Enter' || (!inSearch && k === ' ')) { e.preventDefault(); choose(active); }
    else if (!inSearch && k.length === 1) {
      const now = Date.now(); const b = buf.current; b.s = now - b.t > 700 ? k.toLowerCase() : b.s + k.toLowerCase(); b.t = now;
      const i = vis.findIndex(({ o }) => o.label.toLowerCase().startsWith(b.s));
      if (i >= 0) setActive(i);
    }
  };

  return (
    <>
      <button ref={btn} type="button" id={id} role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? uid : undefined}
        aria-label={ariaLabel} aria-invalid={invalid || undefined} aria-describedby={describedBy} aria-required={required || undefined} disabled={disabled}
        className={`ui-select ui-select--${variant}${open ? ' is-open' : ''}${invalid ? ' is-invalid' : ''}${shown ? '' : ' is-empty'}${className ? ' ' + className : ''}`}
        onClick={() => (open ? close() : openIt())} onKeyDown={key}>
        <span className="ui-select-val">{shown ? shown.label : (placeholder || 'Choose…')}</span>
        <Svg name="chevDown" cls="ui-select-chev" />
      </button>
      {open && createPortal(
        <div ref={pop} className="ui-pop ui-list" style={style}>
          <div className="ui-search">
            <Svg name="search" />
            <input ref={searchBox} type="search" autoComplete="off" spellCheck={false} placeholder="Search…" aria-label={`Search ${ariaLabel || 'the list'}`} aria-controls={uid} value={q}
              onChange={(e) => { setQ(e.target.value); setActive(0); }} onKeyDown={(e) => key(e, true)} />
          </div>
          <div className="ui-opts" id={uid} role="listbox" aria-label={ariaLabel}>
            {vis.map(({ o, i: ri }, i) => (
              <div key={o.value + ':' + ri} role="option" aria-selected={o.value === value} data-active={i === active} className={`ui-opt${o.value === value ? ' is-sel' : ''}${i === active ? ' is-active' : ''}${clearable && placeholder && ri === 0 ? ' is-clear' : ''}`}
                onMouseMove={() => setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(i)}>
                <span>{o.label}</span>{o.value === value && (value !== '' || !(clearable && placeholder)) ? <Svg name="check" cls="ui-opt-tick" /> : null}
              </div>
            ))}
            {!vis.length ? <div className="ui-opt ui-opt-empty">{rows.length ? 'No match' : 'Nothing to choose from'}</div> : null}
          </div>
        </div>, document.body)}
    </>
  );
}

/* ---------------------------------- dates ---------------------------------- */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON3 = MONTHS.map((m) => m.slice(0, 3));
const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const p2 = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${p2(m + 1)}-${p2(d)}`;
const todayIsoStr = () => { const t = new Date(); return iso(t.getFullYear(), t.getMonth(), t.getDate()); };
function parseIso(s: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); if (!m) return null;
  const y = +m[1], mo = +m[2] - 1, d = +m[3]; const t = new Date(y, mo, d);
  return t.getFullYear() === y && t.getMonth() === mo && t.getDate() === d ? { y, m: mo, d } : null;
}
const fmtShow = (s: string) => { const v = parseIso(s); return v ? `${v.d} ${MON3[v.m]} ${v.y}` : ''; };

function Calendar({ value, min, max, onPick, footer }: { value: string; min?: string; max?: string; onPick: (iso: string) => void; footer?: ReactNode }) {
  const sel = parseIso(value);
  const now = new Date();
  const [view, setView] = useState({ y: sel ? sel.y : now.getFullYear(), m: sel ? sel.m : now.getMonth() });
  const [focus, setFocus] = useState<string>(sel ? value.slice(0, 10) : todayIsoStr());
  const grid = useRef<HTMLDivElement>(null);
  const lead = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells: Array<{ y: number; m: number; d: number; out: boolean }> = [];
  for (let i = 0; i < 42; i++) { const dt = new Date(view.y, view.m, 1 - lead + i); cells.push({ y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate(), out: dt.getMonth() !== view.m }); }
  void days;
  const off = (s: string) => (!!min && s < min) || (!!max && s > max);
  const go = (dm: number) => setView((v) => { const dt = new Date(v.y, v.m + dm, 1); return { y: dt.getFullYear(), m: dt.getMonth() }; });
  const years = useMemo(() => { const y0 = now.getFullYear(); const lo = Math.min(y0 - 100, view.y), hi = Math.max(y0 + 10, view.y); const a: Opt[] = []; for (let y = hi; y >= lo; y--) a.push({ value: String(y), label: String(y) }); return a; }, [view.y]); // eslint-disable-line react-hooks/exhaustive-deps

  const move = (e: KeyboardEvent<HTMLElement>) => {
    const f = parseIso(focus); if (!f) return;
    let dd = 0;
    if (e.key === 'ArrowLeft') dd = -1; else if (e.key === 'ArrowRight') dd = 1; else if (e.key === 'ArrowUp') dd = -7; else if (e.key === 'ArrowDown') dd = 7;
    else if (e.key === 'PageUp') dd = -30; else if (e.key === 'PageDown') dd = 30; else return;
    e.preventDefault();
    const t = new Date(f.y, f.m, f.d + dd); const s = iso(t.getFullYear(), t.getMonth(), t.getDate());
    setFocus(s); setView({ y: t.getFullYear(), m: t.getMonth() });
    requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>(`[data-iso="${s}"]`)?.focus({ preventScroll: true }));
  };

  const today = todayIsoStr();
  return (
    <div className="ui-cal">
      <div className="ui-cal-head">
        <button type="button" className="ui-cal-nav" aria-label="Previous month" onClick={() => go(-1)}><Svg name="chevLeft" /></button>
        <div className="ui-cal-sel">
          <Select variant="field" className="ui-cal-pick" ariaLabel="Month" value={String(view.m)} onChange={(v) => setView({ ...view, m: +v })} options={MONTHS.map((m, i) => ({ value: String(i), label: m }))} />
          <Select variant="field" className="ui-cal-pick" ariaLabel="Year" value={String(view.y)} onChange={(v) => setView({ ...view, y: +v })} options={years} />
        </div>
        <button type="button" className="ui-cal-nav" aria-label="Next month" onClick={() => go(1)}><Svg name="arrowRight" /></button>
      </div>
      <div className="ui-cal-dow" aria-hidden="true">{DOW.map((d) => <span key={d}>{d}</span>)}</div>
      <div className="ui-cal-grid" role="grid" aria-label={`${MONTHS[view.m]} ${view.y}`} ref={grid} onKeyDown={move}>
        {cells.map((c) => {
          const s = iso(c.y, c.m, c.d); const dis = off(s);
          return (
            <button key={s} type="button" role="gridcell" data-iso={s} tabIndex={s === focus ? 0 : -1} disabled={dis} aria-selected={s === value.slice(0, 10)} aria-current={s === today ? 'date' : undefined}
              className={`ui-day${c.out ? ' is-out' : ''}${s === value.slice(0, 10) ? ' is-sel' : ''}${s === today ? ' is-today' : ''}`}
              onClick={() => onPick(s)}>{c.d}</button>
          );
        })}
      </div>
      <div className="ui-cal-foot">
        <button type="button" className="ui-link" disabled={off(today)} onClick={() => onPick(today)}>Today</button>
        {footer}
      </div>
    </div>
  );
}

interface DateBase { value: string; onChange: (v: string) => void; min?: string; max?: string; id?: string; disabled?: boolean; invalid?: boolean; describedBy?: string; required?: boolean; ariaLabel?: string; placeholder?: string; clearable?: boolean }

function DateShell({ value, shownText, id, disabled, invalid, describedBy, required, ariaLabel, placeholder, children }: Pick<DateBase, 'value' | 'id' | 'disabled' | 'invalid' | 'describedBy' | 'required' | 'ariaLabel' | 'placeholder'> & { shownText: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null), pop = useRef<HTMLDivElement>(null);
  const close = useCallback(() => { setOpen(false); }, []);
  const style = usePopup(open, close, btn, pop, false);
  useEffect(() => { if (open) requestAnimationFrame(() => pop.current?.querySelector<HTMLElement>('.ui-day[tabindex="0"]')?.focus({ preventScroll: true })); }, [open]);
  void value;
  return (
    <>
      <button ref={btn} type="button" id={id} aria-haspopup="dialog" aria-expanded={open} aria-label={ariaLabel} aria-invalid={invalid || undefined} aria-describedby={describedBy} aria-required={required || undefined} disabled={disabled}
        className={`ui-select ui-select--form ui-date${open ? ' is-open' : ''}${invalid ? ' is-invalid' : ''}${shownText ? '' : ' is-empty'}`}
        onClick={() => setOpen((o) => !o)} onKeyDown={(e) => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); } }}>
        <span className="ui-select-val">{shownText || placeholder || 'Select a date'}</span>
        <Svg name="calendar" cls="ui-select-chev ui-date-ic" />
      </button>
      {open && createPortal(
        <div ref={pop} role="dialog" aria-label="Choose a date" className="ui-pop ui-datepop" style={style} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); btn.current?.focus({ preventScroll: true }); } }}>
          {children(() => { close(); btn.current?.focus({ preventScroll: true }); })}
        </div>, document.body)}
    </>
  );
}

export function DatePicker(p: DateBase) {
  return (
    <DateShell {...p} shownText={fmtShow(p.value)}>
      {(done) => <Calendar value={p.value} min={p.min} max={p.max} onPick={(s) => { p.onChange(s); done(); }}
        footer={p.clearable && p.value ? <button type="button" className="ui-link ui-link--muted" onClick={() => { p.onChange(''); done(); }}>Clear</button> : null} />}
    </DateShell>
  );
}

/** value is "YYYY-MM-DDTHH:mm", the same shape a datetime-local input gives */
export function DateTimePicker(p: DateBase) {
  const day = p.value.slice(0, 10); const tm = /T(\d{2}):(\d{2})/.exec(p.value);
  const hh = tm ? tm[1] : '09', mm = tm ? tm[2] : '00';
  const text = parseIso(day) ? `${fmtShow(day)} · ${hh}:${mm}` : '';
  const set = (d: string, h: string, m: string) => p.onChange(d ? `${d}T${h}:${m}` : '');
  const hours = useMemo<Opt[]>(() => Array.from({ length: 24 }, (_, i) => ({ value: p2(i), label: p2(i) })), []);
  const mins = useMemo<Opt[]>(() => Array.from({ length: 12 }, (_, i) => ({ value: p2(i * 5), label: p2(i * 5) })).concat(mm && +mm % 5 ? [{ value: mm, label: mm }] : []).sort((a, b) => +a.value - +b.value), [mm]);
  return (
    <DateShell {...p} shownText={text} placeholder={p.placeholder || 'Select date and time'}>
      {(done) => (
        <>
          <Calendar value={day} min={p.min?.slice(0, 10)} max={p.max?.slice(0, 10)} onPick={(s) => set(s, hh, mm)} />
          <div className="ui-time">
            <span className="ui-time-l">Time</span>
            <Select variant="field" className="ui-time-pick" ariaLabel="Hour" value={hh} onChange={(v) => set(day || todayIsoStr(), v, mm)} options={hours} />
            <b>:</b>
            <Select variant="field" className="ui-time-pick" ariaLabel="Minute" value={mm} onChange={(v) => set(day || todayIsoStr(), hh, v)} options={mins} />
            <button type="button" className="ui-btn-done" onClick={done}>Done</button>
          </div>
        </>
      )}
    </DateShell>
  );
}
