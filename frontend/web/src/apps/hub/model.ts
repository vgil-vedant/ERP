// Data layer: everything comes from GET /api/dashboard (ported from erp-hub.js). Nothing is generated here.
import { DAY, clock } from './lib';

export interface System { code: string; name: string; short: string; port: number | null; hostname: string; forms: number }
export interface Citizen { id: number | null; ref: string; fullName: string; email: string; mobile: string; firstSeenIn: string; createdAt: Date; records: number }
export interface Intake {
  id: number; system: string; form: string; formLabel: string; sourceReference: string; citizen: Citizen; receivedAt: Date;
  route: string; subject: string; intakeRef: string; fields: { label: string; value: string }[];
}
export interface Sync {
  at: Date; system: string; entity: string; submission: string; erpRef: string | null; http: number;
  result: 'kept' | 'duplicate' | 'rolled_back'; intake: Intake | null; reason: string | null;
}
export interface Audit { id: number; at: Date; entity: string; entityId: string; action: string; maker: string; approver: string | null; details: string; ref: string }
export interface Submission { ref: string; system: string; person: string; erpRef: string | null; status: 'committed' | 'pending' | 'rolled_back'; at: Date }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Dash = any;

// one hue per department, the same as on the Person Lookup page
export const DEPT_HUE: Record<string, string> = { uidai: '#C2410C', cctns: '#1D4ED8', eforensics: '#7C3AED', ecourts: '#0F766E', eprisons: '#475569' };
export const PALETTE = ['#0E9F6B', '#2BAFA0', '#7FD3AE', '#0A7C54', '#2B4A42', '#4FB9A8', '#7A9E92'];
export const PORTAL_ICON: Record<string, string> = { eprisons: 'prison', cctns: 'police', eforensics: 'flask', uidai: 'fingerprint', ecourts: 'court' };

/** The loaded data, replaced as a whole by applyData() (same module-level shape the old script used). */
export const D = {
  SYSTEMS: [] as System[], SYS_MAP: {} as Record<string, System>, SYS_COLOR: {} as Record<string, string>,
  CITIZENS: [] as Citizen[], INTAKES: [] as Intake[], SYNC: [] as Sync[], AUDIT: [] as Audit[], SUBMISSIONS: [] as Submission[],
  TOTALS: { intake: 0, citizens: 0 }, DATA: null as Dash | null, EARLIEST: new Date(), LOAD_ERROR: null as string | null,
  OFFICES: null as Dash | null,   // GET /api/offices: the department offices (figures, records, bus events, officers, activity)
  WORKBENCH: null as Dash | null, // GET /api/workbench: departments, their forms and how many records wait for a decision
};

export const sysName = (code: string) => (D.SYS_MAP[code] && D.SYS_MAP[code].name) || code || '—';
/**
 * The origin of a portal as this browser can reach it. Through the public edge
 * (deploy/edge) the server sends publicPorts ({ "4177": 5012, ... }) because the
 * internal ports are closed from outside; on a direct visit it is null and the
 * internal port is used, as before.
 */
export const portalOrigin = (port: number) => {
  const map = (D.DATA && D.DATA.publicPorts) || null;
  const p = (map && map[String(port)]) || port;
  return `${location.protocol}//${location.hostname}:${p}`;
};
export const sysPort = (code: string) => (D.SYS_MAP[code] && D.SYS_MAP[code].port) || '—';
export const hostPort = (code: string) => location.hostname + ':' + sysPort(code);

/** the database stores UTC as 'YYYY-MM-DD HH:MM:SS' */
export function parseUtc(s: string | null | undefined): Date {
  if (!s) return new Date(NaN);
  return new Date(String(s).replace(' ', 'T') + (/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? '' : 'Z'));
}
export function distinctOptions<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  return Array.from(new Set(rows.map((r) => r[key]).filter(Boolean) as string[])).sort().map((v) => ({ value: v, label: v }));
}
export const sysOptions = () => D.SYSTEMS.map((s) => ({ value: s.code, label: s.name }));
export const distinctForms = () => {
  const seen = new Map<string, string>();
  D.INTAKES.forEach((r) => { if (!seen.has(r.form)) seen.set(r.form, r.formLabel || r.form); });
  return Array.from(seen, ([value, label]) => ({ value, label: label.length > 44 ? label.slice(0, 43) + '…' : label }))
    .sort((x, y) => x.label.localeCompare(y.label));
};

export function applyData(d: Dash) {
  D.DATA = d;
  clock.now = new Date(d.generatedAt);

  D.SYSTEMS = d.platform.portals.map((p: Dash) => ({ code: p.code, name: p.name, short: p.name, port: p.port, hostname: p.hostname, forms: p.forms }));
  const erpSystems = (d.erp.summary && d.erp.summary.bySystem) || [];
  erpSystems.forEach((s: Dash) => {
    if (!D.SYSTEMS.some((x) => x.code === s.code)) D.SYSTEMS.push({ code: s.code, name: s.name || s.code, short: s.name || s.code, port: null, hostname: '', forms: 0 });
  });
  D.SYS_MAP = Object.fromEntries(D.SYSTEMS.map((s) => [s.code, s]));
  D.SYS_COLOR = Object.fromEntries(D.SYSTEMS.map((s, i) => [s.code, DEPT_HUE[s.code] || PALETTE[i % PALETTE.length]]));
  D.TOTALS = { intake: d.erp.summary ? d.erp.summary.intake : 0, citizens: d.erp.summary ? d.erp.summary.citizens : 0 };

  const byId = new Map<number, Citizen>();
  D.CITIZENS = d.erp.citizens.map((c: Dash) => {
    const o: Citizen = { id: c.id, ref: c.citizen_ref, fullName: c.full_name, email: c.email || '—', mobile: c.mobile || '—', firstSeenIn: c.first_seen_in, createdAt: parseUtc(c.created_at), records: c.intake_count || 0 };
    byId.set(c.id, o);
    return o;
  });

  const intakeById = new Map<number, Intake>();
  /* the API lists newest first; the views expect oldest first */
  D.INTAKES = d.erp.intakes.slice().reverse().map((r: Dash) => {
    const cit = byId.get(r.citizen_id) || { id: null, ref: '—', fullName: r.full_name || '—', email: r.email || '—', mobile: '—', firstSeenIn: r.source_system, createdAt: parseUtc(r.received_at), records: 0 };
    const o: Intake = {
      id: r.id, system: r.source_system, form: r.source_form, formLabel: r.subject || r.source_form, sourceReference: r.source_reference, citizen: cit,
      receivedAt: parseUtc(r.received_at), route: r.source_route, subject: r.subject || '', intakeRef: r.intake_ref,
      fields: (r.fields || []).map((f: Dash) => ({ label: f.label || f.name, value: f.value == null ? '' : String(f.value) })),
    };
    intakeById.set(r.id, o);
    return o;
  });
  const intakeByRef = new Map(D.INTAKES.map((r) => [r.intakeRef, r]));

  D.SYNC = d.platform.sync.map((s: Dash) => {
    const http = s.httpStatus == null ? 0 : s.httpStatus;
    return {
      at: parseUtc(s.attemptedAt), system: s.siteCode || '', entity: s.entity, submission: s.localRef, erpRef: s.erpRef || null, http,
      result: s.status === 'failed' ? 'rolled_back' : (http === 200 ? 'duplicate' : 'kept'),
      intake: intakeByRef.get(s.erpRef) || null, reason: s.message || null,
    } as Sync;
  }).sort((x: Sync, y: Sync) => y.at.getTime() - x.at.getTime());

  const refFor = (a: Dash) => {
    if (a.entity === 'intake') { const r = intakeById.get(Number(a.entity_id)); if (r) return r.intakeRef; }
    if (a.entity === 'citizen') { const c = byId.get(Number(a.entity_id)); if (c) return c.ref; }
    return String(a.entity_id);
  };
  D.AUDIT = d.erp.audit.map((a: Dash) => ({ id: Number(a.id), at: parseUtc(a.occurred_at), entity: a.entity, entityId: String(a.entity_id), action: a.action, maker: a.maker, approver: a.approver, details: a.details || '', ref: refFor(a) }));

  D.SUBMISSIONS = d.platform.submissions.map((s: Dash) => ({ ref: s.reference, system: s.siteCode, person: s.person || '—', erpRef: s.erpRef || null, status: s.erpRef ? 'committed' : 'pending', at: parseUtc(s.createdAt) }));
  D.SYNC.filter((s) => s.result === 'rolled_back' && s.entity === 'submission').forEach((s) => {
    D.SUBMISSIONS.push({ ref: s.submission, system: s.system, person: '—', erpRef: null, status: 'rolled_back', at: s.at });
  });
  D.SUBMISSIONS.sort((x, y) => y.at.getTime() - x.at.getTime());

  const stamps = ([] as Date[]).concat(D.INTAKES.map((r) => r.receivedAt), D.SYNC.map((s) => s.at), D.AUDIT.map((a) => a.at)).filter((t) => !isNaN(t.getTime()));
  D.EARLIEST = stamps.length ? new Date(Math.min(...stamps.map((t) => t.getTime()))) : clock.now;
}

/** days covered by "All": from the first recorded event to today (at least a week, at most a year) */
function allSpan() {
  const NOW = clock.now;
  const today = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  const first = new Date(D.EARLIEST.getFullYear(), D.EARLIEST.getMonth(), D.EARLIEST.getDate());
  return Math.min(366, Math.max(7, Math.round((today.getTime() - first.getTime()) / DAY) + 1));
}

export type Days = number | 'all';
export function windowStart(days: Days) {
  if (days === 'all' || days >= 120) return D.EARLIEST;
  const NOW = clock.now;
  const midnight = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
  return new Date(midnight.getTime() - (Number(days) - 1) * DAY);
}
export const inScope = (date: Date, days: Days) => date >= windowStart(days) && date <= new Date(clock.now.getTime() + DAY);

export function metrics(days: Days) {
  const intakes = D.INTAKES.filter((r) => inScope(r.receivedAt, days));
  const attempts = D.SYNC.filter((s) => inScope(s.at, days));
  const kept = attempts.filter((s) => s.result === 'kept').length;
  const dup = attempts.filter((s) => s.result === 'duplicate').length;
  const rolled = attempts.filter((s) => s.result === 'rolled_back').length;
  const audit = D.AUDIT.filter((a) => inScope(a.at, days)).length;
  const perSystem = D.SYSTEMS.map((s) => {
    const rows = intakes.filter((r) => r.system === s.code);
    const att = attempts.filter((a) => a.system === s.code);
    return { code: s.code, name: s.name, records: rows.length, kept: att.filter((a) => a.result !== 'rolled_back').length, rolled: att.filter((a) => a.result === 'rolled_back').length, attempts: att.length };
  });
  return { intakes, attempts, kept, dup, rolled, audit, perSystem, success: kept + dup, totalAttempts: attempts.length, citizens: D.TOTALS.citizens };
}
export type Metrics = ReturnType<typeof metrics>;

export interface Bucket { d: Date; received: number; refused: number }
export function dailySeries(days: Days): Bucket[] {
  const NOW = clock.now;
  const span = (days === 'all' || days >= 120) ? allSpan() : Number(days);
  const buckets: Bucket[] = [];
  const start = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - (span - 1));
  for (let i = 0; i < span; i++) buckets.push({ d: new Date(start.getTime() + i * DAY), received: 0, refused: 0 });
  const keyOf = (d: Date) => Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - start.getTime()) / DAY);
  D.INTAKES.forEach((r) => { const k = keyOf(r.receivedAt); if (k >= 0 && k < span) buckets[k].received++; });
  D.SYNC.filter((s) => s.result === 'rolled_back').forEach((s) => { const k = keyOf(s.at); if (k >= 0 && k < span) buckets[k].refused++; });
  return buckets;
}

/** Records a department holds in its own office (what the nav and dashboard show); `fallback` when the offices have not loaded. */
export function officeRecords(code: string, fallback = 0): number {
  const d = ((D.OFFICES && D.OFFICES.departments) || []).find((x: Dash) => x.code === code);
  return d ? d.totalRecords : fallback;
}

export interface NavItem { view: string; label: string; icon: string; badge?: boolean; badgeCitizens?: boolean; count?: number | null; warn?: boolean; port?: number | null; ext?: boolean; portal?: boolean }
export interface NavGroup { id: string; index: string; label: string; items: NavItem[] }
/** The side navigation, in the order the data flows: citizen portal -> department office -> integration bus -> ERP. */
export function buildNav(): NavGroup[] {
  const depts: Dash[] = (D.OFFICES && D.OFFICES.departments) || [];
  const byCode = new Map<string, Dash>(depts.map((x: Dash) => [x.code, x]));
  const pending = depts.reduce((t: number, x: Dash) => t + x.integration.pending, 0);
  const rejected = depts.reduce((t: number, x: Dash) => t + x.integration.rejected, 0);
  const waiting = D.WORKBENCH ? (D.WORKBENCH.departments as Dash[]).reduce((t: number, x: Dash) => t + (x.awaiting || 0), 0) : null;
  const workbench: NavGroup = { id: 'gw', index: '01b', label: 'Workbench', items: [
    { view: 'apply', label: 'New application', icon: 'file' },
    { view: 'approvals', label: 'Approvals', icon: 'check', count: waiting || null },
    { view: 'work', label: 'All records', icon: 'grid' }] };
  return [
    { id: 'g1', index: '01', label: 'Overview', items: [
      { view: 'dashboard', label: 'Dashboard', icon: 'dash' }] },
    workbench,
    { id: 'g2', index: '02', label: 'ERP · record of truth', items: [
      { view: 'lookup', label: 'Person Lookup', icon: 'idcard' },
      { view: 'citizens', label: 'Citizens', icon: 'users', badgeCitizens: true },
      { view: 'records', label: 'Department Records', icon: 'layers', count: depts.length ? depts.reduce((t: number, x: Dash) => t + x.totalRecords, 0) : null },
      { view: 'intake', label: 'Citizen Submissions', icon: 'inbox', badge: true },
      { view: 'audit', label: 'Audit Trail', icon: 'shield' }] },
    { id: 'g3', index: '03', label: 'Departments', items: D.SYSTEMS.map((s) => ({
      view: 'dept:' + s.code, label: s.name, icon: PORTAL_ICON[s.code],
      count: byCode.has(s.code) ? byCode.get(s.code)!.totalRecords : null,
    })) },
    { id: 'g4', index: '04', label: 'Integration bus', items: [
      { view: 'queue', label: 'Event Queue', icon: 'sync', count: depts.length && pending + rejected > 0 ? pending + rejected : null, warn: pending + rejected > 0 },
      { view: 'failures', label: 'Retries & Failures', icon: 'alert', count: depts.length && rejected ? rejected : null, warn: rejected > 0 },
      { view: 'sync', label: 'Write-through Ledger', icon: 'pulse' },
      { view: 'recon', label: 'Reconciliation', icon: 'check' }] },
    { id: 'g5', index: '05', label: 'Access & audit', items: [
      { view: 'officers', label: 'Officer Accounts', icon: 'user' },
      { view: 'lookupaudit', label: 'Lookup Audit', icon: 'search' },
      { view: 'activity', label: 'Activity Log', icon: 'clock' }] },
    { id: 'g6', index: '06', label: 'System', items: [
      { view: 'health', label: 'Service Health', icon: 'heart' }, { view: 'database', label: 'Databases', icon: 'database' },
      { view: 'docs', label: 'Documentation', icon: 'book' }] },
  ];
}
