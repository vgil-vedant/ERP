// Settings: the signed-in administrator's own page. Account details, personalisation (theme and navigation) and a
// graph of what this account has done in the hub. Everything here is about this one account: the activity is read from
// the audit trail and the department activity logs the hub already loads, and kept to the events this account made.
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import './settings.css';
import { Svg, fmtDate, fmtTime, num, rel } from './lib';
import { D, parseUtc } from './model';
import { PageHead } from './workbench';
import { ActionBadge } from './timeline';
import { currentTheme, setTheme, useMe } from './accountmenu';
import { RangeToggle, daysIn, startOfDay } from './rangepicker';
import type { DateRange } from './rangepicker';

/* ================================================================ this account's activity */
export interface MyEvent { at: Date; source: 'Audit' | 'Office'; action: string; detail: string; where: string }

/** Whether a recorded maker or officer is this account: the bare username, or the hub's own prefix before it. */
export function isMine(who: string | null | undefined, username: string): boolean {
  const w = String(who || '').toLowerCase(), u = username.toLowerCase();
  return !!u && (w === u || w === 'hub:' + u || w === 'erp-hub:' + u);
}

/** Every event this account made that the hub holds: audit-trail entries and actions in the department offices. */
export function myActivity(username: string): MyEvent[] {
  const out: MyEvent[] = [];
  D.AUDIT.forEach((a) => {
    if (isMine(a.maker, username)) out.push({ at: a.at, source: 'Audit', action: a.action, detail: a.details, where: a.entity });
  });
  const depts = ((D.OFFICES && D.OFFICES.departments) || []) as { short: string; activity?: { at: string; officer: string; action: string; details?: string }[] }[];
  depts.forEach((d) => (d.activity || []).forEach((a) => {
    if (isMine(a.officer, username)) out.push({ at: parseUtc(a.at), source: 'Office', action: String(a.action), detail: a.details || '', where: d.short });
  }));
  return out.sort((x, y) => y.at.getTime() - x.at.getTime());
}

export interface Day { d: Date; audit: number; office: number }
/** One bar per day over the last `span` days, oldest first. */
export function perDay(events: MyEvent[], span: number, now = new Date()): Day[] {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (span - 1));
  const days: Day[] = Array.from({ length: span }, (_, i) => ({ d: new Date(start.getFullYear(), start.getMonth(), start.getDate() + i), audit: 0, office: 0 }));
  events.forEach((e) => {
    const i = Math.floor((new Date(e.at.getFullYear(), e.at.getMonth(), e.at.getDate()).getTime() - start.getTime()) / 86400000);
    if (i >= 0 && i < span) { if (e.source === 'Audit') days[i].audit += 1; else days[i].office += 1; }
  });
  return days;
}

export type Unit = 'hour' | 'day' | 'week' | 'month';
export interface Bucket { start: Date; end: Date; audit: number; office: number }
/** The events of a period (first to last day, both included) counted into bars: hours for one day, days up to about six weeks,
 *  then weeks, then months, so that a long period still draws a readable graph. */
export function perBucket(events: MyEvent[], from: Date, to: Date): { unit: Unit; buckets: Bucket[] } {
  const f = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const t = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  const days = Math.round((t.getTime() - f.getTime()) / 86400000) + 1;
  const unit: Unit = days <= 1 ? 'hour' : days <= 45 ? 'day' : days <= 270 ? 'week' : 'month';
  const stop = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1);
  const buckets: Bucket[] = [];
  const mk = (start: Date, end: Date) => buckets.push({ start, end: end.getTime() > stop.getTime() ? stop : end, audit: 0, office: 0 });
  if (unit === 'hour') for (let h = 0; h < 24; h += 1) mk(new Date(f.getFullYear(), f.getMonth(), f.getDate(), h), new Date(f.getFullYear(), f.getMonth(), f.getDate(), h + 1));
  else if (unit === 'day') for (let d = new Date(f); d < stop; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) mk(d, new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
  else if (unit === 'week') for (let d = new Date(f); d < stop; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)) mk(d, new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
  else for (let d = new Date(f); d < stop; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) mk(d, new Date(d.getFullYear(), d.getMonth() + 1, 1));
  events.forEach((e) => {
    const at = e.at.getTime();
    if (at < f.getTime() || at >= stop.getTime()) return;
    const b = buckets.find((x) => at >= x.start.getTime() && at < x.end.getTime());
    if (b) { if (e.source === 'Audit') b.audit += 1; else b.office += 1; }
  });
  return { unit, buckets };
}

/* ================================================================ preferences */
const NAV_KEY = 'erp_hub_nav';
export type NavPref = 'auto' | 'expanded' | 'collapsed';
export function readNavPref(): NavPref {
  try { const v = localStorage.getItem(NAV_KEY); return v === 'expanded' || v === 'collapsed' ? v : 'auto'; } catch { return 'auto'; }
}
function writeNavPref(v: NavPref) { try { if (v === 'auto') localStorage.removeItem(NAV_KEY); else localStorage.setItem(NAV_KEY, v); } catch { /* the choice still applies now */ } }

/* ================================================================ the page */
const initials = (s: string) => s.replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
const Def = ({ k, v }: { k: string; v: ReactNode }) => <div className="def-row"><div className="def-key">{k}</div><div className="def-val">{v}</div></div>;
/** A short label under a bar, by what a bar stands for. */
const tickLabel = (b: Bucket, i: number, unit: Unit, n: number) => {
  const d = b.start, day = d.getDate();
  const mon = d.toLocaleDateString('en-GB', { month: 'short' });
  if (unit === 'hour') return `${String(d.getHours()).padStart(2, '0')}:00`;
  if (unit === 'month') return `${mon} ${String(d.getFullYear()).slice(2)}`;
  if (unit === 'week') return `${day} ${mon}`;
  if (n <= 7) return `${d.toLocaleDateString('en-GB', { weekday: 'short' })} ${day}`;
  return i === 0 || day === 1 ? `${day} ${mon}` : String(day);
};
/** What one bar covers, in words (for its tooltip and for "busiest"). */
const bucketName = (b: Bucket, unit: Unit) => {
  if (unit === 'hour') return `${fmtDate(b.start)}, ${String(b.start.getHours()).padStart(2, '0')}:00–${String(b.end.getHours()).padStart(2, '0')}:00`;
  if (unit === 'week') return `${fmtDate(b.start)} – ${fmtDate(new Date(b.end.getFullYear(), b.end.getMonth(), b.end.getDate() - 1))}`;
  if (unit === 'month') return b.start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  return fmtDate(b.start);
};
const cap = (w: string) => w[0].toUpperCase() + w.slice(1);
const When = ({ d }: { d: Date }) => <><span>{fmtDate(d)}, {fmtTime(d)}</span><span className="micro st-rel">{rel(d)}</span></>;

function ThemeChoice({ value, current, label, hint, onPick }: { value: 'light' | 'dark'; current: string; label: string; hint: string; onPick: () => void }) {
  const on = current === value;
  return (
    <button type="button" role="radio" aria-checked={on} className={`st-theme st-theme--${value}${on ? ' is-on' : ''}`} onClick={onPick}>
      <span className="st-prev" aria-hidden="true"><i className="st-prev-side" /><i className="st-prev-bar" /><i className="st-prev-card" /><i className="st-prev-card st-prev-card--b" /></span>
      <span className="st-theme-txt"><b>{label}</b><span>{hint}</span></span>
      <span className="st-radio" aria-hidden="true">{on ? <Svg name="check" /> : null}</span>
    </button>
  );
}

function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div className="st-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={value === o.value ? 'is-on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>)}
    </div>
  );
}

export function SettingsView({ active, setCollapsed }: { active: boolean; collapsed?: boolean; setCollapsed: (v: boolean) => void }) {
  const me = useMe();
  const [theme, setThemeState] = useState(currentTheme);
  const [nav, setNav] = useState<NavPref>(readNavPref);
  const [range, setRange] = useState<DateRange | null>(null);   // null: overall
  useEffect(() => { const on = () => setThemeState(currentTheme()); window.addEventListener('erp-theme', on); return () => window.removeEventListener('erp-theme', on); }, []);

  const username = me ? me.name : '';
  const events = useMemo(() => (username ? myActivity(username) : []), [username, active]);   // eslint-disable-line react-hooks/exhaustive-deps
  // the period shown: everything this account has done, or the days picked in the calendar
  const today = startOfDay(new Date());
  const firstDay = events.length ? startOfDay(events[events.length - 1].at) : today;
  const lastDay = events.length && startOfDay(events[0].at) > today ? startOfDay(events[0].at) : today;
  const from = range ? range.from : firstDay, to = range ? range.to : lastDay;
  const { unit, buckets } = useMemo(() => perBucket(events, from, to), [events, from.getTime(), to.getTime()]);   // eslint-disable-line react-hooks/exhaustive-deps
  const span = daysIn({ from, to });
  const inRange = buckets.reduce((t, x) => t + x.audit + x.office, 0);
  const peak = Math.max(1, ...buckets.map((x) => x.audit + x.office));
  const busiest = buckets.reduce((m, x) => (x.audit + x.office > m.audit + m.office ? x : m), buckets[0]);
  const tickEvery = unit === 'hour' ? 3 : Math.max(1, Math.ceil(buckets.length / 8));
  const inPeriod = useMemo(() => events.filter((e) => e.at.getTime() >= from.getTime() && e.at.getTime() < to.getTime() + 86400000), [events, from, to]);
  const byAction = useMemo(() => {
    const m = new Map<string, number>();
    inPeriod.forEach((e) => m.set(e.action, (m.get(e.action) || 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [inPeriod]);
  const periodWords = range ? (span === 1 ? fmtDate(from) : `${fmtDate(from)} to ${fmtDate(to)}`) : `overall (${span} day${span === 1 ? '' : 's'})`;

  if (!active) return null;

  const pickNav = (v: NavPref) => { setNav(v); writeNavPref(v); if (v === 'collapsed') setCollapsed(true); else if (v === 'expanded') setCollapsed(false); };
  const reset = () => { setTheme('light'); setThemeState('light'); setNav('auto'); writeNavPref('auto'); };
  const name = me ? me.name : '…';

  return (
    <section className="view is-active st" id="view-settings">
      <PageHead title="Settings" desc="Your account, how the hub looks for you, and what this account has done in it." />

      <div className="st-grid">
        <div className="card st-card" aria-labelledby="st-acc">
          <div className="card-head"><div><div className="card-title" id="st-acc"><span className="card-ic" aria-hidden="true"><Svg name="user" /></span>Account details</div><div className="card-sub">Who is signed in</div></div></div>
          <div className="st-body">
            <div className="st-id">
              <span className="st-av" aria-hidden="true">{initials(name)}</span>
              <div className="def-list st-id-defs">
                <Def k="Username" v={<code>{name}</code>} />
                <Def k="Role" v={me ? me.role || 'Administrator' : '—'} />
              </div>
            </div>
            <div className="def-list st-defs">
              <Def k="Account" v="The hub's administrator account" />
              <Def k="Actions recorded" v={num(events.length)} />
              <Def k="First recorded" v={events.length ? <When d={events[events.length - 1].at} /> : '—'} />
              <Def k="Latest" v={events.length ? <When d={events[0].at} /> : '—'} />
            </div>
          </div>
          <div className="card-foot">
            <span>Ends your session in this browser</span>
            <form method="post" action="/logout"><button type="submit" className="btn btn-sm st-signout"><Svg name="logout" />Sign out</button></form>
          </div>
        </div>

        <div className="card st-card" aria-labelledby="st-per">
          <div className="card-head"><div><div className="card-title" id="st-per"><span className="card-ic" aria-hidden="true"><Svg name="settings" /></span>Personalisation</div><div className="card-sub">Saved in this browser</div></div></div>
          <div className="st-body">
            <div className="st-label" id="st-theme-l">Theme</div>
            <div className="st-themes" role="radiogroup" aria-labelledby="st-theme-l">
              <ThemeChoice value="light" current={theme} label="Light" hint="Bright surfaces, easy by day" onPick={() => { setTheme('light'); setThemeState('light'); }} />
              <ThemeChoice value="dark" current={theme} label="Dark" hint="Calm surfaces for long sessions" onPick={() => { setTheme('dark'); setThemeState('dark'); }} />
            </div>
            <div className="st-label" id="st-nav-l">Navigation bar</div>
            <Segmented<NavPref> label="Navigation bar" value={nav} onChange={pickNav}
              options={[{ value: 'auto', label: 'Automatic' }, { value: 'expanded', label: 'Always open' }, { value: 'collapsed', label: 'Icons only' }]} />
            
          </div>
          <div className="card-foot">
            <span>Changes apply straight away</span>
            <button type="button" className="btn btn-sm" onClick={reset}>Reset to defaults</button>
          </div>
        </div>
      </div>

      <div className="card st-card st-wide" aria-labelledby="st-act">
        <div className="card-head">
          <div><div className="card-title" id="st-act"><span className="card-ic" aria-hidden="true"><Svg name="pulse" /></span>Account activity</div><div className="card-sub">Only what this account did: lookups and audit entries, and actions in the department offices</div></div>
          <RangeToggle value={range} onChange={setRange} min={events.length ? firstDay : undefined} max={lastDay} />
        </div>
        <div className="st-body">
          {!events.length ? (
            <div className="st-empty"><Svg name="pulse" /><div>No activity is recorded for this account yet.</div><span>Searches, lookups and decisions you make will appear here.</span></div>
          ) : (
            <>
              <div className="st-stats">
                <div><i className="st-stat-ic" aria-hidden="true"><Svg name="pulse" /></i><span>Total actions</span><b>{num(inRange)}</b><em>{range && span === 1 ? fmtDate(from) : `over ${span} day${span === 1 ? '' : 's'}`}</em></div>
                <div><i className="st-stat-ic" aria-hidden="true"><Svg name="clock" /></i><span>{unit === 'day' ? 'Daily' : `${cap(unit)}ly`} average</span><b>{num(Math.round((inRange / Math.max(1, buckets.length)) * 10) / 10)}</b><em>actions a {unit}</em></div>
                <div><i className="st-stat-ic" aria-hidden="true"><Svg name="calendar" /></i><span>Busiest {unit}</span><b>{busiest && busiest.audit + busiest.office > 0 ? busiest.audit + busiest.office : '—'}</b><em>{busiest && busiest.audit + busiest.office > 0 ? bucketName(busiest, unit) : 'No actions yet'}</em></div>
              </div>
              <div className="st-chart" role="img" aria-label={`Actions per ${unit}, ${periodWords}: ${inRange} in all`}>
                <div className="st-ygrid" aria-hidden="true"><i><em>{peak}</em></i><i>{peak >= 4 ? <em>{Math.round(peak / 2)}</em> : null}</i><i><em>0</em></i></div>
                <div className="st-bars">
                  {buckets.map((x, i) => {
                    const t = x.audit + x.office;
                    const shown = (buckets.length - 1 - i) % tickEvery === 0;
                    return (
                      <div key={x.start.getTime()} className="st-col" title={`${bucketName(x, unit)}: ${t} action${t === 1 ? '' : 's'}${t ? ` (${x.audit} audit, ${x.office} office)` : ''}`}>
                        <div className="st-barwrap">
                          {t > 0 ? (
                            <div className="st-stack" style={{ height: `${(t / peak) * 100}%` }}>
                              {x.office > 0 ? <i className="st-seg-office" style={{ flexGrow: x.office }} /> : null}
                              {x.audit > 0 ? <i className="st-seg-audit" style={{ flexGrow: x.audit }} /> : null}
                            </div>
                          ) : <i className="st-zero" />}
                        </div>
                        <div className="st-xl" aria-hidden="true">{shown ? <span>{tickLabel(x, i, unit, buckets.length)}</span> : null}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="st-two">
                <div>
                  <div className="st-label">What you did most</div>
                  {byAction.length ? (
                    <ul className="st-top">
                      {byAction.map(([a, n]) => (
                        <li key={a}><ActionBadge action={a} /><span className="st-top-bar"><i style={{ width: `${(n / byAction[0][1]) * 100}%` }} /></span><b>{num(n)}</b></li>
                      ))}
                    </ul>
                  ) : <p className="st-note">Nothing in this period.</p>}
                </div>
                <div>
                  <div className="st-label">Latest actions</div>
                  {inPeriod.length ? <ol className="st-recent">
                    {inPeriod.slice(0, 5).map((e, i) => (
                      <li key={i}>
                        <ActionBadge action={e.action} />
                        <span className="st-r-main"><span className="st-r-detail">{e.detail || e.action}</span><span className="st-r-sub">{e.source === 'Audit' ? 'Audit' : 'Office'} · {e.where}</span></span>
                        <span className="st-r-time">{rel(e.at)}</span>
                      </li>
                    ))}
                  </ol> : <p className="st-note">Nothing in this period.</p>}
                </div>
              </div>
            </>
          )}
        </div>
        {events.length ? <div className="card-foot st-legend"><span><i className="st-seg-all" />Actions per {unit}</span></div> : null}
      </div>
    </section>
  );
}
