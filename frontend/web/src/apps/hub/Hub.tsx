// The ERP Hub dashboard (ported from erp-hub.js + the shell of erp-hub.html). All data comes from GET /api/dashboard.
import { AuditGroupTable } from './tables';
import vgLogo from '../../assets/icon/virtual-galaxy-logo.png';
import erpLogo from '../../assets/icon/erp-logo.png';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AccountMenu } from './accountmenu';
import { SettingsView, readNavPref } from './settings';
import { RangeToggle, daysIn, rangeText, startOfDay } from './rangepicker';
import type { DateRange } from './rangepicker';
import { Svg, clock, fmtDate, fmtDateTime, fmtTime, hideTip, num, rel } from './lib';
import { D, DEPT_HUE, PORTAL_ICON, applyData, buildNav, dailySeries, officeRecords, hostPort, metrics, portalOrigin, sysName, sysPort } from './model';
import type { Audit, Citizen, Days, Intake, Sync } from './model';
import { AreaChart, Bars, DonutPro, RadarChart, HealthRows, Meter, OpenBars, PeopleHeat, Sparkline, StatusBars } from './charts';
import { DataTable } from './DataTable';
import { HttpPill, ResultPill, defineTables } from './tables';
import { Views } from './views.generated';
import { LookupView, syncLookup } from './LookupView';
import { OverviewBody, DeptKpis, DepartmentDatabases, FlowDiagram, OfficeFeed, OfficeViews, isOfficeView, officeDailyBetween, officeFirstDay, officeMetrics, recentEventsCfg, recentRecordsCfg } from './offices';
import type { OfficeCtx } from './offices';
import type { Crumb } from './workbench';
import { WorkbenchViews, isWorkbenchView, loadWorkbench, workbenchMeta, workbenchTrail } from './workbench';

// Views in the navigation, plus three older pages kept reachable by link ('portals', 'integration', 'submissions').
const VALID = ['dashboard', 'intake', 'lookup', 'citizens', 'audit', 'portals', 'sync', 'integration', 'submissions', 'database', 'health', 'docs', 'settings'];
const isValid = (v: string) => VALID.includes(v) || isOfficeView(v) || isWorkbenchView(v);
// The view is part of the address (#citizens, #dept:cctns ...), so a page of the
// hub can be linked to, reloaded, and reached again with the Back button.
const viewFromUrl = () => {
  const v = decodeURIComponent((window.location.hash || '').replace(/^#/, ''));
  return isValid(v) ? v : 'dashboard';
};
// Where a move leads. The hub owns the #view; the Person Lookup writes ?ref= and
// ?q= of its own while it has a person on screen, and a move drops them - going
// to a view starts it, so the lookup opens on its idle panes rather than on
// whoever was being read last time. Those parameters stay in the entries the
// lookup itself pushed, which is what makes the back button walk back into them.
const hubUrl = (v: string) => window.location.pathname + '#' + v;
const here = () => window.location.pathname + window.location.search + window.location.hash;
const ERP_TABLE_ROLE: Record<string, string> = {
  source_system: 'The registered source portals', citizen: 'People seen by the ERP', intake: 'Records received through the intake API',
  intake_field: 'Field-level values per record', audit_log: 'Append-only audit events',
};
// where a breadcrumb section leads: the first page of that section
// the icon tile of each sidebar group has its own colour (departments keep theirs)
const GROUP_HUE: Record<string, string> = { g1: '#0E9F6B', gw: '#4F46E5', g2: '#2563EB', g4: '#D97706', g5: '#BE185D', g6: '#475569' };
// ...and each item its own colour, chosen by what it does
const VIEW_HUE: Record<string, string> = {
  dashboard: '#0E9F6B',
  apply: '#4F46E5', approvals: '#16A34A', work: '#0D9488',
  lookup: '#7C3AED', citizens: '#2563EB', records: '#0891B2', intake: '#0284C7', audit: '#DC2626',
  queue: '#D97706', failures: '#E11D48', sync: '#0EA5E9', recon: '#65A30D',
  officers: '#6366F1', lookupaudit: '#9333EA', activity: '#EA580C',
  health: '#DB2777', database: '#92400E', docs: '#475569',
};
const SECTION_HOME: Record<string, string> = { Workbench: 'approvals', 'Overview': 'dashboard', ERP: 'lookup', Departments: 'dept:eprisons', 'Integration bus': 'queue', Account: 'settings', 'Access & audit': 'officers', System: 'health' };
const DOCS = [
  { name: 'Project README', path: 'README.md', note: 'Architecture, API, schema, ports, testing' },
  { name: 'Architecture notes', path: 'info/docs/architecture/ARCHITECTURE.md', note: 'Runtime topology and write-through in text' },
  { name: 'Architecture blueprint', path: 'info/docs/architecture/blueprint.html', note: 'Drawn ER diagrams, self-contained' },
  { name: 'ERP schema', path: 'database/sqlite/erp/schema.sql', note: 'source_system · citizen · intake · intake_field · audit_log' },
  { name: 'Platform schema', path: 'database/sqlite/platform/schema.sql', note: 'person · submission · erp_sync · portal tables' },
  { name: 'PostgreSQL migration', path: 'database/postgres/README.md', note: 'Read-only copy into demo_replica' },
  { name: 'Docker guide', path: 'docker/README.md', note: 'Hardened stack, ERP_ objects' },
  { name: 'End-to-end tests', path: 'tests/e2e/run-e2e-tests.js', note: '77 checks across both databases' },
  { name: 'Replica notes', path: 'backend/gov_replica/README.md', note: 'Field-level fidelity, replica notice' },
];
const mono11: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 11 };
const codeMono: React.CSSProperties = { fontFamily: 'var(--mono)' };

interface Toast { id: number; title: string; body?: ReactNode; icon: string; out?: boolean }
interface Drawer { kicker: string; title: string; body: ReactNode; foot: ReactNode }

/** The department offices (GET /api/offices). A failure keeps the last good data; the views say so when there is none. */
async function fetchOffices() {
  try {
    const res = await fetch('/api/offices', { cache: 'no-store' });
    if (res.ok) D.OFFICES = await res.json();
  } catch { /* keep what is on screen */ }
}

async function fetchDashboard() {
  const res = await fetch('/api/dashboard', { cache: 'no-store' });
  if (res.status === 401) { window.location.replace('/login'); throw new Error('signed out'); }   // the session ended: replace, so Back does not return to a page that cannot load
  if (!res.ok) throw new Error('the hub answered HTTP ' + res.status);
  return res.json();
}

export function Hub() {
  const [ready, setReady] = useState(false);
  const [, setRev] = useState(0);                       // bumped when data or a size changes, to redraw
  const [days, setDays] = useState<Days>(30);
  // the period of three dashboard graphs: null is overall, otherwise the days picked in the calendar
  const [actRange, setActRange] = useState<DateRange | null>(null);
  const [recRange, setRecRange] = useState<DateRange | null>(null);
  const [peopleRange, setPeopleRange] = useState<DateRange | null>(null);
  const [view, setView] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [scrimShown, setScrimShown] = useState(false);
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});
  const [noticeOff, setNoticeOff] = useState(false);
  const [drawer, setDrawer] = useState<Drawer | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [tip, setTip] = useState<{ text: string; left: number; top: number } | null>(null);
  const [donutHover, setDonutHover] = useState<number | null>(null);
  const [counts, setCounts] = useState<Record<string, number | null>>({ intake: null, citizens: null, audit: null, sync: null, submissions: null });
  const [retrying, setRetrying] = useState<string | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const refreshing = useRef(false);
  const toastId = useRef(0);
  const redraw = useCallback(() => setRev((n) => n + 1), []);
  useEffect(() => { const on = () => setRev((n) => n + 1); window.addEventListener('erp-theme', on); return () => window.removeEventListener('erp-theme', on); }, []);

  /* ------------------------------ toasts ------------------------------ */
  const toast = useCallback((title: string, body?: ReactNode, icon?: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, title, body, icon: icon || 'info' }]);
    window.setTimeout(() => {
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, out: true } : x)));
      window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 220);
    }, 4400);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.map((x) => (x.id === id ? { ...x, out: true } : x)));
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 220);
  }, []);

  /* ------------------------------ data ------------------------------- */
  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try { const [dash] = await Promise.all([fetchDashboard(), fetchOffices(), loadWorkbench()]); applyData(dash); D.LOAD_ERROR = null; }
    catch (err) { D.LOAD_ERROR = (err as Error).message || String(err); }   /* the last good data stays on screen, flagged */
    refreshing.current = false;
    setNoticeOff(false);
    redraw();
  }, [redraw]);

  useEffect(() => {
    (async () => {
      try { const [dash] = await Promise.all([fetchDashboard(), fetchOffices(), loadWorkbench()]); applyData(dash); } catch (err) { D.LOAD_ERROR = (err as Error).message || String(err); }
      const pref = readNavPref();   // the choice made in Settings, if any
      setCollapsed(pref === 'collapsed' ? true : pref === 'expanded' ? false : window.innerWidth < 1180 && window.innerWidth > 900);
      const first = viewFromUrl();
      setView(first);
      try { history.replaceState({ view: first }, '', '#' + first); } catch { /* ignore */ }   // the old page wrote the view into the URL at load too
      setReady(true);
    })();
    const timer = window.setInterval(refresh, 30000);
    const vis = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', vis);
    // Restored from the browser's cache by Back or Forward (which runs no code
    // on the page): ask for the data again, so a session that ended in the
    // meantime is noticed here and the visitor is sent to /login.
    const shown = (e: PageTransitionEvent) => { if (e.persisted) refresh(); };
    window.addEventListener('pageshow', shown);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('pageshow', shown);
    };
  }, [refresh]);

  /* Back and Forward move between the views of the hub, not out of it. */
  useEffect(() => {
    const onPop = () => {
      setView(viewFromUrl());
      setTip(null); setDrawer(null);
      setNavOpen(false); setScrimShown(false);
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /* ----------------------------- navigation --------------------------- */
  const goto = useCallback((v: string) => {
    if (!isValid(v)) return;
    setView(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTip(null);
   
    // One history entry per move, so Back returns to the previous view of the
    // hub. Arriving on the view already shown only rewrites the address.
    try {
      const url = hubUrl(v);
      // A move that changes nothing in the address (the same view again) rewrites
      // the entry; anything else is a new one, so Back undoes the move - including
      // leaving a person's profile for the breadcrumb's "ERP".
      if (url === here()) history.replaceState({ view: v }, '', url);
      else history.pushState({ view: v }, '', url);
    } catch { /* ignore */ }
    // The address has just changed; the lookup pane follows it. (On the way in
    // for the first time it is not mounted yet and reads the address itself.)
    if (v === 'lookup') syncLookup();
  }, []);
  const openMobileNav = () => { setNavOpen(true); setScrimShown(true); };
  const closeMobileNav = useCallback(() => { setNavOpen(false); window.setTimeout(() => setScrimShown(false), 240); }, []);

  /* ------------------------------ details ----------------------------- */
  const copyText = useCallback((text: string) => {
    const done = () => toast('Copied', <span style={mono11}>{text}</span>, 'copy');
    const fallback = () => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); done();
      } catch { toast('Copy blocked', 'Select the text and copy it manually.', 'alert'); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback); else fallback();
  }, [toast]);
  const closeDrawer = useCallback(() => setDrawer(null), []);
  const kv = (k: ReactNode, v: ReactNode, kCls = '', vCls = '') => <div className="kv-row"><span className={`kv-k ${kCls}`.trim()}>{k}</span><span className={`kv-v ${vCls}`.trim()}>{v}</span></div>;
  const closeBtn = <button className="btn btn-sm btn-primary" type="button" onClick={closeDrawer}>Close</button>;
  const copyBtn = (t: string) => <button className="btn btn-sm" type="button" onClick={() => copyText(t)}><Svg name="copy" /> Copy ref</button>;

  const openRecord = useCallback((r: Intake) => {
    const attempts = D.SYNC.filter((s) => s.submission === r.sourceReference);
    setDrawer({ kicker: 'Received record', title: r.intakeRef, body: (<>
      <div className="drawer-sec"><h4>Record</h4><div className="kv">
        {kv('Intake ref', r.intakeRef, '', 'mono')}{kv('Source system', `${sysName(r.system)} · :${sysPort(r.system)}`)}{kv('Source form', r.form, '', 'mono')}
        {kv('Source reference', r.sourceReference, '', 'mono')}{kv('Received', `${fmtDateTime(r.receivedAt)} · ${rel(r.receivedAt)}`)}{kv('Subject', r.subject || '—')}
      </div></div>
      <div className="drawer-sec"><h4>Citizen</h4><div className="kv">
        {kv('Name', r.citizen.fullName)}{kv('Citizen ref', r.citizen.ref, '', 'mono')}{kv('Email', r.citizen.email, '', 'mono')}{kv('Mobile', r.citizen.mobile, '', 'mono')}
      </div></div>
      <div className="drawer-sec"><h4>intake_field values</h4>
        <div>{r.fields.map((f, i) => <span className="field-chip" key={i}><span className="fc-label">{f.label}</span><span className="fc-val">{f.value}</span></span>)}</div></div>
      <div className="drawer-sec"><h4>Write-through attempts (erp_sync)</h4><div className="kv">
        {attempts.length ? attempts.map((a) => kv(`${fmtTime(a.at)} · ${rel(a.at)}`, <><HttpPill code={a.http} /> <ResultPill r={a.result} /></>)) : kv('—', 'No ledger row')}
      </div></div></>),
    foot: <><span style={{ flex: 1 }} />{copyBtn(r.intakeRef)}{closeBtn}</> });
  }, [closeDrawer, copyText]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCitizen = useCallback((c: Citizen) => {
    const records = D.INTAKES.filter((r) => r.citizen === c).slice().reverse();
    setDrawer({ kicker: 'Citizen', title: c.ref, body: (<>
      <div className="drawer-sec"><h4>Citizen</h4><div className="kv">
        {kv('Citizen ref', c.ref, '', 'mono')}{kv('Name', c.fullName)}{kv('Email', c.email, '', 'mono')}{kv('Mobile', c.mobile, '', 'mono')}
        {kv('First seen in', sysName(c.firstSeenIn))}{kv('First received', fmtDate(c.createdAt))}{kv('Records', num(records.length))}
      </div></div>
      <div className="drawer-sec"><h4>Recent records</h4><div className="kv">
        {records.slice(0, 8).map((r) => kv(r.intakeRef, <>{sysName(r.system)}<span style={{ color: 'var(--text-3)', fontWeight: 500 }}> · {fmtDate(r.receivedAt)}</span></>, 'mono'))}
        {!records.length && kv('—', 'No records')}
      </div></div></>),
    foot: <><span style={{ flex: 1 }} />{copyBtn(c.ref)}{closeBtn}</> });
  }, [closeDrawer, copyText]); // eslint-disable-line react-hooks/exhaustive-deps

  const openSync = useCallback((s: Sync) => {
    setDrawer({ kicker: 'Write-through attempt', title: s.submission, body: (<>
      <div className="drawer-sec"><h4>Attempt</h4><div className="kv">
        {kv('Attempted at', `${fmtDateTime(s.at)} · ${rel(s.at)}`)}{kv('Source system', `${sysName(s.system)} · :${sysPort(s.system)}`)}{kv('Entity', s.entity, '', 'mono')}
        {kv('Submission ref', s.submission, '', 'mono')}{kv('ERP intake ref', s.erpRef || '— not created', '', 'mono')}{kv('HTTP status', <HttpPill code={s.http} />)}{kv('Result', <ResultPill r={s.result} />)}
        {s.reason && kv('Reason', s.reason, '', 'mono')}
      </div></div>
      <div className="drawer-sec"><h4>What this means</h4>
        <div className="f" style={{ fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.6 }}>
          {s.result === 'rolled_back'
            ? 'The ERP refused the write, so the platform rolled its own row back. Nothing exists on either side, and there is no queue holding the record for a later retry.'
            : s.result === 'duplicate'
              ? <>The same <code style={codeMono}>sourceSystem + sourceReference</code> arrived twice. The ERP answered 200 with <code style={codeMono}>duplicate: true</code>, so no second intake row was created.</>
              : 'The ERP wrote the intake row and answered 201. The platform then committed its own row — both databases or neither.'}
        </div></div></>),
    foot: <><span style={{ flex: 1 }} />{closeBtn}</> });
  }, [closeDrawer]);

  const openAudit = useCallback((a: Audit) => {
    setDrawer({ kicker: 'Audit event', title: '#' + a.id, body: (<>
      <div className="drawer-sec"><h4>Event</h4><div className="kv">
        {kv('Event #', a.id, '', 'mono')}{kv('Occurred at', `${fmtDateTime(a.at)} · ${rel(a.at)}`)}{kv('Action', <span className="pill pill-mint">{a.action}</span>)}
      </div></div>
      <div className="drawer-sec"><h4>Subject</h4><div className="kv">
        {kv('Entity', a.entity, '', 'mono')}{kv('Entity ID', a.entityId, '', 'mono')}{kv('Reference', a.ref, '', 'mono')}
      </div></div>
      <div className="drawer-sec"><h4>People</h4><div className="kv">
        {kv('Maker', a.maker)}{kv('Approver', a.approver || '—')}
      </div></div>
      <div className="drawer-sec"><h4>Details</h4>
        <div style={{ fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.6, overflowWrap: 'anywhere' }}>{a.details || 'No details were recorded for this event.'}</div></div></>),
    foot: <><span style={{ flex: 1 }} />{copyBtn('#' + a.id)}{closeBtn}</> });
  }, [closeDrawer, copyText]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (drawer && drawerRef.current) drawerRef.current.focus({ preventScroll: true }); }, [drawer]);
  useEffect(() => { document.body.classList.toggle('no-scroll', !!drawer); }, [drawer]);

  const openPortal = useCallback((code: string) => {
    const s = D.SYS_MAP[code];
    if (!s || !s.port) { toast('Portal unavailable', 'No port is known for this portal.', 'alert'); return; }
    const url = portalOrigin(s.port) + '/';
    let opened: Window | null = null;
    try { opened = window.open(url, '_blank', 'noopener'); } catch { /* blocked */ }
    toast('Local replica: ' + s.name, <>{opened ? 'Opened ' : 'Open '}<span style={mono11}>{url}</span>{opened ? ' in a new tab.' : ' in a new tab (your browser blocked the pop-up).'} A demonstration environment, not a government website.</>, 'external');
  }, [toast]);

  /* ------------------------------ export ------------------------------ */
  const downloadCSV = useCallback((filename: string, text: string) => {
    try {
      const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 400);
    } catch { toast('Download blocked', 'Your browser blocked the file download in this preview.', 'alert'); }
  }, [toast]);
  const onExport = useCallback((name: string, csv: string, count: number) => { downloadCSV(name, csv); toast('CSV exported', num(count) + ' rows from the current filter.', 'download'); }, [downloadCSV, toast]);
  const exportSummary = () => {
    const o = officeMetrics();
    const lines: (string | number)[][] = [
      ['EkSetu — summary'], ['Generated', fmtDateTime(clock.now)], [],
      ['Metric', 'Value'], ['Department records', o.records], ['Events delivered to the ERP', o.delivered], ['Events waiting', o.pending], ['Events rejected', o.rejected], [],
      ['Department', 'Records', 'Open', 'People', 'Delivered', 'Waiting', 'Rejected'],
      ...o.per.map((x) => [x.d.title, x.records, x.open, x.people, x.delivered, x.pending, x.rejected]),
    ];
    downloadCSV('erp-summary.csv', lines.map((l) => l.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n'));
    toast('Summary exported', 'The live counts shown on the dashboard.', 'download');
  };

  /* ------------------------------- period ----------------------------- */
  const applyPeriod = (value: string) => {
    const next: Days = value === 'all' ? 'all' : Number(value);
    setDays(next);
    toast('Date range applied', 'Showing ' + (next === 'all' ? 'all recorded activity' : 'the last ' + next + ' days') + ' of recorded activity.', 'filter');
  };

  /* ------------------------- keyboard, resize, scroll ----------------- */
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (drawer) closeDrawer(); else if (navOpen) closeMobileNav();
        hideTip();
      }
    };
    let timer: number;
    const resize = () => { window.clearTimeout(timer); timer = window.setTimeout(() => { if (window.innerWidth > 900 && navOpen) closeMobileNav(); setTip(null); redraw(); }, 220); };
    document.addEventListener('keydown', key);
    window.addEventListener('resize', resize); window.addEventListener('scroll', hideTip, { passive: true });
    return () => { document.removeEventListener('keydown', key); window.removeEventListener('resize', resize); window.removeEventListener('scroll', hideTip); window.clearTimeout(timer); };
  }, [drawer, navOpen, closeDrawer, closeMobileNav, redraw]);

  /* ------------------------------ derived ----------------------------- */
  const nav = buildNav();
  const m = metrics(days);
  const buckets14 = dailySeries(days).slice(-14);
  const cSeries = buckets14.map((b) => D.CITIZENS.filter((c) => {
    const d = new Date(c.createdAt.getFullYear(), c.createdAt.getMonth(), c.createdAt.getDate());
    return +d === +new Date(b.d.getFullYear(), b.d.getMonth(), b.d.getDate());
  }).length);
  const om = officeMetrics();
  const dayOne = officeFirstDay(), dayNow = startOfDay(new Date());
  const whole: DateRange = { from: dayOne, to: dayNow };
  const actSpan = actRange || whole;
  const heatSpan = peopleRange || whole;
  // a long period is shown a week to a cell, so that the heat map stays readable
  const heatWeekly = daysIn(heatSpan) > 60;
  const heatDaily = officeDailyBetween(heatSpan.from, heatSpan.to);
  const heatBin = (series: number[]) => (heatWeekly ? Array.from({ length: Math.ceil(series.length / 7) }, (_, k) => series.slice(k * 7, k * 7 + 7).reduce((t, v) => t + v, 0)) : series);
  const heatDates = (heatWeekly ? heatDaily.filter((_, i) => i % 7 === 0) : heatDaily).map((b) => b.d);
  const heatRows = om.per.map((x) => { const series = heatBin(officeDailyBetween(heatSpan.from, heatSpan.to, x.code).map((b) => b.people)); return { code: x.code, name: x.name, total: peopleRange ? series.reduce((t, v) => t + v, 0) : x.people, series }; });
  const recOf = (x: (typeof om.per)[number]) => (recRange ? officeDailyBetween(recRange.from, recRange.to, x.code).reduce((t, b) => t + b.received, 0) : x.records);
  const donutItems = om.per.map((x) => ({ x, n: recOf(x) })).filter((r) => r.n > 0).map(({ x, n }) => ({ name: x.name, value: n, color: DEPT_HUE[x.code] || D.SYS_COLOR[x.code] || '#87968F' })).sort((a, b) => b.value - a.value);
  const busM = { kept: om.delivered, dup: om.pending, rolled: om.rejected, totalAttempts: om.events };
  const mAll = metrics('all');
  const data = D.DATA;

  const problems: string[] = [];
  if (D.LOAD_ERROR) problems.push('The dashboard could not load fresh data: ' + D.LOAD_ERROR + '.');
  if (data && !data.erp.ok) problems.push('The ERP service could not be read (' + (data.erp.error || 'unavailable') + '). Received records, citizens and the audit trail are empty until it answers.');
  if (data && data.truncated) {
    const t = Object.keys(data.truncated).filter((k) => data.truncated[k]);
    if (t.length) problems.push('Showing the latest ' + num(data.limit) + ' rows of: ' + t.join(', ') + '.');
  }

  const tables = defineTables({ openRecord, openCitizen, openSync, openAudit, days }, {
    intake: (n) => setCounts((c) => (c.intake === n ? c : { ...c, intake: n })), citizens: (n) => setCounts((c) => (c.citizens === n ? c : { ...c, citizens: n })),
    audit: (n) => setCounts((c) => (c.audit === n ? c : { ...c, audit: n })), sync: (n) => setCounts((c) => (c.sync === n ? c : { ...c, sync: n })),
    submissions: (n) => setCounts((c) => (c.submissions === n ? c : { ...c, submissions: n })),
  });
  const tbl = <T,>(cfg: Parameters<typeof DataTable<T>>[0]['cfg']) => <DataTable<T> cfg={cfg} onExport={onExport} showExport={false} />;
  const cnt = (k: string, tail: string) => (counts[k] === null ? '—' : num(counts[k] as number) + tail);

  const hubPort = data && data.hub && data.hub.port;
  const target = data && data.erp && data.erp.target;
  const erpPort = target && (String(target).match(/:(\d+)\/?$/) || [])[1];
  const ovRows: [string, string, string][] = [];
  if (hubPort) ovRows.push(['' + hubPort, 'Platform hub', 'All five portals, one page']);
  ((data && data.platform && data.platform.portals) || []).forEach((p: { port: number; name: string }) => ovRows.push(['' + p.port, p.name, 'Portal replica']));
  if (erpPort) ovRows.push([erpPort, 'ERP backend + console', 'Reached over HTTP by the hub']);
  ovRows.sort((a, b) => Number(a[0]) - Number(b[0]));

  const services: { key?: string; name: string; sub?: string; status: string; ms?: number; detail?: string }[] = (data && data.services) || [];
  const meta = (s: { status: string; ms?: number }) => (s.status === 'ok' ? (s.ms ? s.ms + ' ms' : 'ok') : s.status === 'down' ? 'not answering' : s.status === 'unavailable' ? 'unavailable' : 'unknown');
  const pg = services.find((s) => s.key === 'postgres');
  const portalBtn = (cls: string, code: string, children: ReactNode) => <button className={cls} type="button" onClick={() => openPortal(code)}>{children}</button>;

  /* what the department views may do: move around, show a detail panel, export, and ask a bus to send again */
  const officeCtx0: OfficeCtx = {
    goto, onExport, retrying,
    showDrawer: (kicker, title, body) => setDrawer({ kicker, title, body, foot: <>{closeBtn}</> }),
    retry: async (code) => {
      setRetrying(code);
      try {
        const res = await fetch(`/api/offices/${code}/retry`, { method: 'POST' });
        if (res.status === 401) { window.location.replace('/login'); return; }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const j = await res.json();
        toast('Retry sent', `${num(j.requeued)} event${j.requeued === 1 ? '' : 's'} queued again for the ERP.`, 'sync');
        window.setTimeout(() => { fetchOffices().then(redraw); }, 1500);
      } catch (err) { toast('Retry failed', (err as Error).message, 'alert'); }
      finally { setRetrying(null); }
    },
  };

  const ovPortsEl = ovRows.length ? <>{ovRows.map((r) => <tr key={r[0] + r[1]}><td className="mono">{r[0]}</td><td className="t-main">{r[1]}</td><td>{r[2]}</td></tr>)}</> : <tr><td colSpan={3}>No service information is available yet.</td></tr>;
  const H: Record<string, ReactNode> = {
    noticeTitle: D.LOAD_ERROR ? 'Could not refresh the data' : problems.length ? 'Some data is unavailable' : '',
    noticeText: problems.join(' '),
    kpiReceivedRange: days === 'all' ? 'all time' : days + ' days',
    kpiReceived: num(m.intakes.length), kpiReceivedNote: num(m.intakes.length) + ' of ' + num(D.TOTALS.intake) + ' intake rows',
    sparkReceived: <Sparkline values={buckets14.map((b) => b.received)} color="#0E9F6B" />,
    kpiCitizens: num(D.TOTALS.citizens), sparkCitizens: <Sparkline values={cSeries.length ? cSeries : [0]} color="#4FB9A8" />,
    kpiSuccess: num(m.success), kpiSuccessNote: num(m.success) + ' of ' + num(m.totalAttempts) + ' attempts',
    kpiRollback: num(m.rolled), kpiAudit: num(m.audit), kpiDupes: num(m.dup),
    activityRange: <RangeToggle label="Office activity period" value={actRange} onChange={setActRange} min={dayOne} />,
    chartActivity: om.per.length >= 3
      ? <RadarChart days={daysIn(actSpan)} periodText={actRange ? rangeText(actRange) : 'overall'} labels={['Records created', 'Events not delivered']} axes={om.per.map((x) => { const d = officeDailyBetween(actSpan.from, actSpan.to, x.code); return { key: x.code, label: x.name, created: d.reduce((t, b) => t + b.received, 0), refused: d.reduce((t, b) => t + b.refused, 0) }; })} />
      : <AreaChart buckets={officeDailyBetween(actSpan.from, actSpan.to)} labels={['Records created', 'Events not delivered']} minMax={400} />,
    recordsRange: <RangeToggle label="Records period" value={recRange} onChange={setRecRange} min={dayOne} />,
    peopleRange: <RangeToggle label="People period" value={peopleRange} onChange={setPeopleRange} min={dayOne} />,
    chartDonut: donutItems.length ? <DonutPro items={donutItems} centerLabel={recRange ? 'records created' : 'total records'} unit="records" hover={donutHover} setHover={setDonutHover} /> : <div className="tbl-empty">{recRange ? 'No records were created in this period.' : 'The offices hold no records yet.'}</div>,
    sourceCount: num(om.per.length) + ' department office' + (om.per.length === 1 ? '' : 's'),
    chartBars: <StatusBars rows={om.per.map((x) => ({ code: x.code, name: x.name, delivered: x.delivered, pending: x.pending, rejected: x.rejected, lastAt: x.d.integration.lastDeliveredAt || null }))} />,
    chartOpen: <OpenBars rows={om.per.map((x) => ({ code: x.code, name: x.name, open: x.open, records: x.records }))} />,
    peopleCount: num(heatRows.reduce((t, r) => t + r.total, 0)),
    chartPeople: heatRows.some((r) => r.total) ? <PeopleHeat rows={heatRows} dates={heatDates} weekly={heatWeekly} totalNote={peopleRange ? 'added in this period' : 'people on file'} /> : <div className="tbl-empty">{peopleRange ? 'No people were added in this period.' : 'No people are on file yet.'}</div>,
    healthMeter: <Meter m={busM} />,
    healthRows: <HealthRows m={busM} names={['Delivered to the ERP', 'Waiting · being retried', 'Rejected by the ERP', 'Delivery rate']} rateOf={om.delivered} />,
    kpiDepts: <DeptKpis goto={goto} />,
    auditFeed: <OfficeFeed />,
    t_recent: <DataTable cfg={recentRecordsCfg(officeCtx0)} onExport={onExport} showExport={false} />, t_syncMini: <DataTable cfg={recentEventsCfg(officeCtx0)} onExport={onExport} showExport={false} />, t_intake: tbl(tables.intake), t_citizens: tbl(tables.citizens), t_audit: <AuditGroupTable rows={D.AUDIT} onOpen={openAudit} onCount={(n) => setCounts((c) => (c.audit === n ? c : { ...c, audit: n }))} />, t_sync: tbl(tables.sync), t_submissions: tbl(tables.submissions),
    portalQuick: <>{m.perSystem.map((s) => (
      <button className="port-open pr-row" type="button" key={s.code} onClick={() => openPortal(s.code)}>
        <span className="pc-logo sys-tint" style={{ ['--sys' as string]: D.SYS_COLOR[s.code] }}><Svg name={PORTAL_ICON[s.code] || 'grid'} /></span>
        <span className="po-main"><span className="po-name">{s.name}</span><span className="po-sub">{hostPort(s.code)} · {num(officeRecords(s.code, s.records))} records</span></span>
        <Svg name="external" />
      </button>))}</>,
    ovHubPort: hubPort ? ':' + hubPort : '', ovErpAddr: target ? String(target).replace(/^https?:\/\//, '') : '',
    ovPorts: ovPortsEl,
    intakeCountSub: cnt('intake', ' rows · newest first'), citizenCountSub: cnt('citizens', ' citizens · one registration works on all five portals'),
    auditCountSub: cnt('audit', ' events · append-only (INSERT only)'), syncCountSub: cnt('sync', ' attempts · erp_sync ledger · synchronous write-through'),
    subCountSub: cnt('submissions', ' submissions · hub-owned data, shown read-only'),
    portalGrid: <>{D.SYSTEMS.map((s) => {
      const stat = mAll.perSystem.find((x) => x.code === s.code)!;
      return (
        <div className="portal-card" key={s.code}>
          <div className="pc-top">
            <span className="pc-logo sys-tint" style={{ ['--sys' as string]: D.SYS_COLOR[s.code] }}><Svg name={PORTAL_ICON[s.code] || 'grid'} /></span>
            <div style={{ flex: 1, minWidth: 0 }}><div className="pc-name">{s.name}</div><div className="pc-cat">{s.hostname}</div></div>
            <span className="pc-port">:{s.port || '—'}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><span className="pill pill-neutral">{num(s.forms)} forms</span><span className="pill pill-mint">{num(officeRecords(s.code, stat.records))} records</span></div>
          <div className="pc-foot"><span className="micro" style={{ fontFamily: 'var(--mono)', fontSize: 10 }}>{hostPort(s.code)}</span>{portalBtn('pc-open', s.code, <>Open replica <Svg name="external" /></>)}</div>
        </div>);
    })}</>,
    hubAddress: location.origin + '/',
    attemptsTotal: num(m.totalAttempts), chartBarsFull: <Bars rows={m.perSystem} />, healthRowsFull: <HealthRows m={m} />,
    erpTables: data && data.erp.database ? <>{data.erp.database.tables.map((t: { name: string; rows: number }) => (
      <tr key={t.name}><td className="mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>{t.name}</td><td>{ERP_TABLE_ROLE[t.name] || ''}</td><td className="col-right t-main">{num(t.rows)}</td></tr>))}</>
      : <tr><td colSpan={3}><div className="tbl-empty">The ERP database could not be read.</div></td></tr>,
    platformTables: data && data.platform.database ? <>{data.platform.database.tables.map((t: { name: string; rows: number }) => (
      <tr key={t.name}><td className="mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>{t.name}</td><td className="col-right t-main">{num(t.rows)}</td></tr>))}</>
      : <tr><td colSpan={2}><div className="tbl-empty">The platform database could not be read.</div></td></tr>,
    pgStatus: pg ? (pg.status === 'ok' ? 'Reachable from the ERP service.' : pg.status === 'down' ? 'Not answering: ' + (pg.detail || '') : 'Status unavailable: ' + (pg.detail || '')) : 'Status unavailable.',
    healthServices: services.length ? <>{services.map((s) => (
      <div className="status-item" key={s.name} title={s.detail || ''}>
        <span className={s.status === 'ok' ? 'si-dot' : s.status === 'down' ? 'si-dot warn' : 'si-dot off'} />
        <span className="si-name">{s.name}<small>{s.sub || ''}</small></span><span className="si-meta">{meta(s)}</span>
      </div>))}</> : <div className="tbl-empty">No health information could be loaded.</div>,
    docList: <>{DOCS.map((d) => (
      <div className="doc-row" key={d.path}>
        <span className="doc-ic"><Svg name="file" /></span>
        <span className="doc-main"><span className="doc-name">{d.name}</span><span className="doc-path">{d.path}</span><span className="doc-note">{d.note}</span></span>
        <button className="btn btn-xs" type="button" onClick={() => copyText(d.path)}><Svg name="copy" /> Copy path</button>
      </div>))}</>,
    flowDiagram: <FlowDiagram />,
    overviewBody: <OverviewBody hub={hubPort ? ':' + hubPort : 'the hub'} erp={target ? String(target).replace(/^https?:\/\//, '') : 'the ERP'} ports={ovPortsEl} />,
  };
  const P: Record<string, Record<string, unknown>> = {
    protoNotice: { style: { display: problems.length && !noticeOff ? '' : 'none' } },
    noticeClose: { onClick: () => { setNoticeOff(true); toast('Notice dismissed', 'The Live badge in the header stays visible.', 'info'); } },
    periodSelect: { value: String(days), onChange: (e: React.ChangeEvent<HTMLSelectElement>) => applyPeriod(e.target.value) },
    periodSelectIntegration: { value: String(days), onChange: (e: React.ChangeEvent<HTMLSelectElement>) => applyPeriod(e.target.value) },
    exportSummaryBtn: { onClick: exportSummary }, openRecordsBtn: { onClick: () => goto('records') },
  };

  /* the fixed footer bar is exactly as tall as the sidebar's sign-out block, so their top rules line up */
  useEffect(() => {
    const sync = () => {
      const el = document.querySelector('.sidebar-foot') as HTMLElement | null;
      if (el) document.documentElement.style.setProperty('--foot-h', el.offsetHeight + 'px');
    };
    sync();
    const el = document.querySelector('.sidebar-foot');
    const ro = el && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sync) : null;
    if (ro && el) ro.observe(el);
    window.addEventListener('resize', sync);
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', sync); };
  }, [ready, collapsed]);

  /* ------------------------------- rail tip --------------------------- */
  const showRailTip = (el: HTMLElement) => { if (!collapsed) return; const r = el.getBoundingClientRect(); setTip({ text: el.dataset.tip || '', left: r.right + 10, top: r.top + r.height / 2 - 15 }); };

  if (!ready) return null;
  const viewMeta: Record<string, [string, string]> = {
    dashboard: ['Dashboard', 'Overview'], overview: ['System Overview', 'Overview'], lookup: ['Person Lookup', 'ERP'], citizens: ['Citizens', 'ERP'],
    records: ['Department Records', 'ERP'], intake: ['Citizen Submissions', 'ERP'], audit: ['Audit Trail', 'ERP'],
    queue: ['Event Queue', 'Integration bus'], failures: ['Retries & Failures', 'Integration bus'],
    sync: ['Write-through Ledger', 'Integration bus'], recon: ['Reconciliation', 'Integration bus'],
    officers: ['Officer Accounts', 'Access & audit'], lookupaudit: ['Lookup Audit', 'Access & audit'], activity: ['Activity Log', 'Access & audit'],
    health: ['Service Health', 'System'], database: ['Databases', 'System'], docs: ['Documentation', 'System'],
    // older pages, reached by link from the pages above
    settings: ['Settings', 'Account'], portals: ['All portals', 'Departments'], integration: ['Integration Status', 'Integration bus'], submissions: ['Platform Submissions', 'ERP'],
  };
  if (isWorkbenchView(view)) viewMeta[view] = workbenchMeta(view);
  if (view.startsWith('dept:')) { const dd = ((D.OFFICES && D.OFFICES.departments) || []).find((x: { code: string }) => x.code === view.slice(5)); viewMeta[view] = [dd ? dd.short : view.slice(5), 'Departments']; }

  return (
    <>
      <div className={`app${collapsed ? ' is-collapsed' : ''}${navOpen ? ' nav-open' : ''}`} id="app">
        <aside className="sidebar" id="sidebar" aria-label="ERP workspace navigation">
          <div className="brand">
            {collapsed ? (
              <button className="brand-mark brand-mark--logo brand-mark--btn" type="button" aria-label="Expand navigation" title="Expand navigation" onClick={() => { setCollapsed(false); setTip(null); }}>
                <img className="brand-glow" src={erpLogo} alt="" aria-hidden="true" draggable={false} /><img src={erpLogo} alt="" draggable={false} />
              </button>
            ) : (
              <div className="brand-mark brand-mark--logo" aria-hidden="true">
                <img className="brand-glow" src={erpLogo} alt="" aria-hidden="true" draggable={false} /><img src={erpLogo} alt="" draggable={false} />
              </div>
            )}
            <div className="brand-text"><div className="brand-name">EkSetu</div><div className="brand-sub">Unified Records</div></div>
            <button className="collapse-btn" id="collapseBtn" type="button" aria-label="Collapse navigation" aria-expanded={!collapsed} onClick={() => { setCollapsed(true); setTip(null); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button className="brand-close" id="navClose" type="button" aria-label="Close navigation" onClick={closeMobileNav}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>

          <nav className="nav" id="nav">
            {nav.map((g) => (
              <div className={`nav-group${closedGroups[g.id] ? ' is-closed' : ''}`} key={g.id} data-group={g.id}>
                <button className="nav-group-head" type="button" aria-expanded={!closedGroups[g.id]} onClick={() => setClosedGroups({ ...closedGroups, [g.id]: !closedGroups[g.id] })}>
                  <span>{g.label}</span>
                  <svg className="grp-chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                <div className="nav-items">
                  {g.items.map((it) => (
                    <button key={it.view} className={`nav-item${view === it.view ? ' is-active' : ''}`} type="button" data-view={it.view}
                      data-tip={`${it.label}${it.port ? ' · :' + it.port : ''}`}
                      onClick={() => { goto(it.view); if (window.innerWidth <= 900) closeMobileNav(); }}
                      onMouseEnter={(e) => showRailTip(e.currentTarget)} onMouseLeave={() => setTip(null)} onFocus={(e) => showRailTip(e.currentTarget)} onBlur={() => setTip(null)}>
                      <span className="dept-ic sys-tint" style={{ ['--sys' as string]: it.view.startsWith('dept:') ? D.SYS_COLOR[it.view.slice(5)] : (VIEW_HUE[it.view] || GROUP_HUE[g.id] || '#0E9F6B') }}><Svg name={it.icon} cls="ic" /></span>
                      <span className="nav-label">{it.label}</span>
                      {it.badge && <span className="nav-badge" data-badge="intake">{num(D.TOTALS.intake)}</span>}
                      {it.badgeCitizens && <span className="nav-badge" data-badge="citizens">{num(D.TOTALS.citizens)}</span>}
                      {it.count != null ? <span className="nav-badge" style={it.warn ? { background: '#FBEFD5', color: '#8A5A00' } : undefined}>{num(it.count)}</span> : null}
                      {it.port ? <span className="nav-port">:{it.port}</span> : null}
                      {it.ext && <Svg name="external" cls="nav-ext" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="sidebar-foot">
            <div className="sf-row">
              <button className={`nav-item sf-settings${view === 'settings' ? ' is-active' : ''}`} type="button" data-view="settings" data-tip="Settings" title="Settings" aria-label="Settings" aria-current={view === 'settings' ? 'page' : undefined}
                onClick={() => { goto('settings'); if (window.innerWidth <= 900) closeMobileNav(); }}
                onMouseEnter={(e) => showRailTip(e.currentTarget)} onMouseLeave={() => setTip(null)} onFocus={(e) => showRailTip(e.currentTarget)} onBlur={() => setTip(null)}>
                <span className="dept-ic sys-tint" style={{ ['--sys' as string]: '#64748B' }}><Svg name="settings" cls="ic" /></span>
                <span className="nav-label">Settings</span>
              </button>
            </div>
            <div className="sf-profile"><AccountMenu side onSettings={() => { goto('settings'); closeMobileNav(); }} /></div>
          </div>
        </aside>

        <div className={`scrim${scrimShown && navOpen ? ' show' : ''}`} id="navScrim" hidden={!scrimShown} onClick={closeMobileNav} />

        <div className="shell">
          <header className="topbar">
            <button className="icon-btn menu-btn" id="menuBtn" type="button" aria-label="Open navigation" onClick={openMobileNav}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <button className="topbar-brand" type="button" aria-label="EkSetu, Unified Records — go to dashboard" onClick={() => goto('dashboard')}>
              <span className="brand-mark brand-mark--logo" aria-hidden="true"><img className="brand-glow" src={erpLogo} alt="" draggable={false} /><img src={erpLogo} alt="" draggable={false} /></span>
              <span className="brand-text"><span className="brand-name">EkSetu</span><span className="brand-sub">Unified Records</span></span>
            </button>
            <nav className="crumbs" aria-label="Breadcrumb">
              <button className="crumb-link root" type="button" onClick={() => goto('dashboard')}>EkSetu</button><span className="sep">/</span>
              {view !== 'dashboard' ? <><button className="crumb-link" id="crumbSection" type="button" style={{ whiteSpace: 'nowrap' }} onClick={() => goto(SECTION_HOME[viewMeta[view][1]] || 'dashboard')}>{viewMeta[view][1]}</button><span className="sep">/</span></> : null}
              {(isWorkbenchView(view) ? workbenchTrail(view) : [{ label: viewMeta[view][0] } as Crumb]).map((c, i, all) => (
                <Fragment key={i}>
                  {c.go ? <button className="crumb-link" type="button" style={{ whiteSpace: 'nowrap' }} onClick={() => goto(c.go!)}>{c.label}</button> : <span className="now" id={i === all.length - 1 ? 'crumbNow' : undefined}>{c.label}</span>}
                  {i < all.length - 1 ? <span className="sep">/</span> : null}
                </Fragment>
              ))}
            </nav>
            <div className="topbar-right"><AccountMenu onSettings={() => goto('settings')} /></div>
          </header>

          <main className="main" id="main">
            <Views view={view} H={H} P={P} goto={goto} openHub={() => toast('Platform hub', 'You are already on the hub dashboard.', 'info')} />
            <LookupView active={view === 'lookup'} />
            <OfficeViews view={view} c={officeCtx0} />
            <WorkbenchViews view={view} goto={goto} toast={toast} onChanged={refresh} />
            <SettingsView active={view === 'settings'} collapsed={collapsed} setCollapsed={setCollapsed} />
            {view === 'database' && <DepartmentDatabases />}
          </main>

          <footer className="app-foot">
            <img className="app-foot-logo" src={vgLogo} alt="Virtual Galaxy Infotech" />
            <span>© 2026 Virtual Galaxy Infotech Ltd. All rights reserved.</span>
          </footer>
        </div>
      </div>

      <div className={`rail-tip${tip ? ' show' : ''}`} id="railTip" role="tooltip" style={tip ? { left: tip.left, top: tip.top } : undefined}>{tip ? tip.text : ''}</div>
      <div className={`drawer${drawer ? ' show' : ''}`} id="drawer" ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="drawerTitle" aria-hidden={!drawer}>
        <div className="drawer-head">
          <div className="dh-main"><div className="drawer-kicker" id="drawerKicker">{drawer ? drawer.kicker : 'Received record'}</div><div className="drawer-title" id="drawerTitle">{drawer ? drawer.title : '—'}</div></div>
          <button className="modal-close" id="drawerClose" type="button" aria-label="Close detail panel" onClick={closeDrawer}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="drawer-body" id="drawerBody">{drawer ? drawer.body : null}</div>
        <div className="drawer-foot" id="drawerFoot">{drawer ? drawer.foot : null}</div>
      </div>
      <div className={`scrim${drawer ? ' show' : ''}`} id="scrim" onClick={closeDrawer} />
      <div className="toasts" id="toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div className={`toast${t.out ? ' out' : ''}`} key={t.id}>
            <span className="t-ic"><Svg name={t.icon} /></span>
            <div className="t-body"><b>{t.title}</b>{t.body ? <><br />{t.body}</> : null}</div>
            <button className="t-x" type="button" aria-label="Dismiss notification" onClick={() => dismissToast(t.id)}><Svg name="close" /></button>
          </div>
        ))}
      </div>
    </>
  );
}

