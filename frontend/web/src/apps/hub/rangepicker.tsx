// A period control for a graph header: an "Overall" / "Calendar" toggle. Overall means everything there is; Calendar
// opens a month calendar to pick one day (click it twice, or click once and press Esc) or a range (click two days).
// It only holds the choice: the graph that owns it decides what to draw for the range it gets back.
import { useEffect, useMemo, useRef, useState } from 'react';
import './rangepicker.css';
import { Svg } from './lib';

export interface DateRange { from: Date; to: Date }

const DAY = 86400000;
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a: Date, b: Date) => a.getTime() === b.getTime();
const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
export const daysIn = (r: DateRange) => Math.round((r.to.getTime() - r.from.getTime()) / DAY) + 1;

const short = (d: Date, year: boolean) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}) });
/** "18 Nov 2026", or "14 – 18 Nov 2026" / "30 Oct – 4 Nov 2026" for a range. */
export function rangeText(r: DateRange): string {
  if (sameDay(r.from, r.to)) return short(r.from, true);
  const sameYear = r.from.getFullYear() === r.to.getFullYear();
  if (sameYear && r.from.getMonth() === r.to.getMonth()) return `${r.from.getDate()} – ${short(r.to, true)}`;
  return `${short(r.from, !sameYear)} – ${short(r.to, true)}`;
}

export function RangeToggle({ value, onChange, min, max, label = 'Period' }: { value: DateRange | null; onChange: (r: DateRange | null) => void; min?: Date; max?: Date; label?: string }) {
  const hi = useMemo(() => startOfDay(max || new Date()), [max]);
  const lo = useMemo(() => (min ? startOfDay(min) : null), [min]);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => monthStart(value ? value.from : hi));
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [hover, setHover] = useState<Date | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const close = (back = false) => { setOpen(false); setAnchor(null); setHover(null); if (back) trigger.current?.focus(); };
  useEffect(() => {
    if (!open) return undefined;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(true); };
    const down = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) close(false); };
    document.addEventListener('keydown', key); document.addEventListener('mousedown', down);
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('mousedown', down); };
  }, [open]);   // eslint-disable-line react-hooks/exhaustive-deps

  const allowed = (d: Date) => d.getTime() <= hi.getTime() && (!lo || d.getTime() >= lo.getTime());
  const first = monthStart(view);
  const lead = (first.getDay() + 6) % 7;                       // weeks start on Monday
  const cells = Array.from({ length: 42 }, (_, i) => addDays(first, i - lead));
  const prevOk = !lo || addMonths(first, -1).getTime() >= monthStart(lo).getTime();
  const nextOk = addMonths(first, 1).getTime() <= monthStart(hi).getTime();

  // what is drawn as the selection: the range being chosen, or the one already applied
  const shown: DateRange | null = anchor ? (hover ? { from: anchor < hover ? anchor : hover, to: anchor < hover ? hover : anchor } : { from: anchor, to: anchor }) : value;
  const within = (d: Date) => !!shown && d.getTime() >= shown.from.getTime() && d.getTime() <= shown.to.getTime();

  const pick = (d: Date) => {
    if (!allowed(d)) return;
    if (!anchor) { setAnchor(d); onChange({ from: d, to: d }); return; }
    const from = d < anchor ? d : anchor, to = d < anchor ? anchor : d;
    onChange({ from, to }); close(true);
  };
  const preset = (days: number | 'month') => {
    const to = hi;
    const from = days === 'month' ? monthStart(hi) : addDays(hi, -(days - 1));
    onChange({ from: lo && from < lo ? lo : from, to }); setView(monthStart(from)); close(true);
  };

  const monthName = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  return (
    <div className="rt" ref={wrap}>
      <div className="st-seg rt-seg" role="radiogroup" aria-label={label}>
        <button type="button" role="radio" aria-checked={!value} className={!value ? 'is-on' : ''} onClick={() => { onChange(null); close(false); }}>Overall</button>
        <button ref={trigger} type="button" role="radio" aria-checked={!!value} aria-haspopup="dialog" aria-expanded={open} className={value ? 'is-on' : ''}
          onClick={() => { if (!open) setView(monthStart(value ? value.from : hi)); setOpen(!open); setAnchor(null); }}>
          <Svg name="calendar" /><span>{value ? rangeText(value) : 'Calendar'}</span>
        </button>
      </div>
      {open ? (
        <div className="rt-pop" role="dialog" aria-label="Choose dates">
          <div className="rt-nav">
            <button type="button" className="rt-step" aria-label="Previous month" disabled={!prevOk} onClick={() => setView(addMonths(first, -1))}><Svg name="chevUp" /></button>
            <b aria-live="polite">{monthName}</b>
            <button type="button" className="rt-step rt-step--next" aria-label="Next month" disabled={!nextOk} onClick={() => setView(addMonths(first, 1))}><Svg name="chevUp" /></button>
          </div>
          <div className="rt-grid" role="grid" aria-label={monthName} onMouseLeave={() => setHover(null)}>
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((w) => <span key={w} className="rt-wd" role="columnheader">{w}</span>)}
            {cells.map((d) => {
              const out = d.getMonth() !== first.getMonth();
              const ok = allowed(d);
              const edge = !!shown && (sameDay(d, shown.from) || sameDay(d, shown.to));
              return (
                <button key={d.getTime()} type="button" role="gridcell" disabled={!ok}
                  className={`rt-day${out ? ' is-out' : ''}${within(d) ? ' is-in' : ''}${edge ? ' is-edge' : ''}${sameDay(d, hi) ? ' is-today' : ''}`}
                  aria-selected={within(d)} aria-label={d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  onMouseEnter={() => anchor && ok && setHover(d)} onClick={() => pick(d)}>{d.getDate()}</button>
              );
            })}
          </div>
          <p className="rt-hint">{anchor ? 'Now click the last day, or the same day again for one day.' : 'Click a day, then a second day for a range.'}</p>
          <div className="rt-presets">
            <button type="button" onClick={() => preset(7)}>Last 7 days</button>
            <button type="button" onClick={() => preset(30)}>Last 30 days</button>
            <button type="button" onClick={() => preset('month')}>This month</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
