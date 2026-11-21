// The ERP Hub workbench: apply to, approve and correct records of all five departments from one place.
//
// Views (each one an address, so it can be linked, reloaded and reached with Back):
//   #apply                    choose a department
//   #apply:<code>             choose one of its application forms
//   #apply:<code>:<form>      fill it in and submit
//   #approvals                every record waiting for a decision, all departments
//   #work  /  #work:<code>    browse a department's records
//   #rec:<code>:<id>          one record: details, progress, decisions, "Edit details"
//
// Nothing is kept here. Every read and write goes to /api/workbench, which acts through the
// same department service the officers use, in the department's own database: what is done
// here shows in the department office at once, and what an officer does there shows here.
// The record's version travels with every decision, so neither side overwrites a change it
// has not seen (the server answers 409 and the page offers to reload).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import './workbench.css';
import { DatePicker, DateTimePicker, Select } from './controls';
import { Svg, fmtDateTime, num, rel } from './lib';
import { PageArt } from './illustrations';
import type { ArtKind } from './illustrations';
import { D, DEPT_HUE, PORTAL_ICON, parseUtc, portalOrigin } from './model';
import { SuggestField, aadhaarFirst, isAutoAadhaar, triggerOf } from './suggest';

/* ================================================================ types */
type Values = Record<string, unknown>;
type Errors = Record<string, string>;
interface Opt { value: string; label: string }
export interface Field {
  name: string; label: string; type: string; required?: boolean; options?: (Opt | string)[]; width?: string; help?: string;
  max?: number; min?: number; pattern?: string; patternMessage?: string; integer?: boolean; notFuture?: boolean; notPast?: boolean;
  default?: unknown; defaultToday?: boolean; rows?: number; when?: When; fields?: Field[]; itemLabel?: string; empty?: string;
}
interface When { field: string; is?: unknown; in?: unknown[]; truthy?: boolean; includes?: unknown; not?: unknown }
interface Section { title?: string; when?: When; fields: Field[] }
interface FormDef { key: string; title: string; description?: string; recordType: string; submitLabel?: string; sections: Section[] }
interface Action { key: string; label: string; tone: string; description: string; fields: Field[]; kind: string; to: string | null }
interface DeptInfo { code: string; name: string; title: string; short: string; port: number; color: string }
interface WbDept extends DeptInfo {
  types: { key: string; label: string; plural: string; awaiting: boolean }[];
  forms: { key: string; title: string; description: string; recordType: string; submitLabel: string }[];
  awaiting: number; totalRecords: number;
}
interface Overview { actor: { username: string; name: string }; departments: WbDept[] }
interface Step { key: string; title: string; description?: string; state: string; label?: string; date?: string | null }
interface Party { ref: string; name: string; gender?: string; role: string; relation?: string | null; label?: string | null; identifiers: Record<string, string> }
interface RecordView {
  id: number; ref: string; type: string; typeLabel: string; title: string; subtitle: string; status: string | null; statusLabel: string;
  date: string | null; data: Values; history: { status: string; at: string }[]; createdBy: string; createdAt: string; updatedAt: string; version: number;
  parties: Party[]; progress: { title: string; statusLabel: string; steps: Step[] } | null; actions: Action[];
  erp: { status: string; attempts: number; error: string | null; latencyMs: number | null; deliveredAt: string | null } | null;
  activity: { at: string; officer: string; action: string; details: string | null }[]; department: DeptInfo;
}
interface InboxRow {
  id: number; ref: string; type: string; typeLabel: string; title: string; subtitle: string; status: string; statusLabel: string;
  updatedAt: string; createdAt: string; createdBy: string; version: number; erp: string | null; actions: Action[];
  department: { code: string; name: string; short: string; color: string };
}
interface ListRow { id: number; ref: string; type: string; typeLabel: string; title: string; subtitle: string; status: string | null; statusLabel: string; date: string | null; updatedAt: string; erp: string | null }
interface ListPage { total: number; page: number; pages: number; size: number; rows: ListRow[]; department: DeptInfo }

export type Toast = (title: string, body?: ReactNode, icon?: string) => void;
export interface WbProps { view: string; goto: (v: string) => void; toast: Toast; onChanged: () => void }

/* ================================================================ API */
export class ApiError extends Error {
  status: number; errors: Errors | null;
  constructor(status: number, message: string, errors?: Errors | null) { super(message); this.status = status; this.errors = errors || null; }
}

const BASE = '/api/workbench';

async function api<T>(path: string, init?: { method?: string; body?: unknown; signal?: AbortSignal }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method: init?.method || 'GET', cache: 'no-store', credentials: 'same-origin', signal: init?.signal,
      headers: init?.body !== undefined ? { 'Content-Type': 'application/json', 'X-Hub-Request': '1' } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError(0, 'The hub could not be reached. Check the connection and try again.');
  }
  if (res.status === 401) { window.location.replace('/login?next=' + encodeURIComponent(location.pathname + location.hash)); throw new ApiError(401, 'Your session has ended. Sign in again.'); }
  let json: { error?: string; errors?: Errors } | null = null;
  try { json = await res.json(); } catch { json = null; }
  if (!res.ok) throw new ApiError(res.status, (json && json.error) || `The hub answered HTTP ${res.status}.`, json && json.errors);
  return json as T;
}

/** One id per submission; the same id again is answered with the first result instead of a second record. */
export function newRequestId() {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12);
}

/** The workbench overview, kept for the navigation counts (refreshed with the rest of the hub's data). */
export async function loadWorkbench() {
  try { D.WORKBENCH = await api<Overview>(''); } catch { /* keep what is on screen */ }
}

/* ================================================================ views and addresses */
export const isWorkbenchView = (v: string) =>
  v === 'apply' || /^apply:[a-z]+(:[a-z_]+)?$/.test(v) || v === 'approvals' || v === 'work' || /^work:[a-z]+$/.test(v) || /^rec:[a-z]+:\d+$/.test(v);

/** The breadcrumb after the section: every level of the page the user is on, each earlier level a link back to it. */
export interface Crumb { label: string; go?: string }
export function workbenchTrail(v: string): Crumb[] {
  type TD = { code: string; short: string; forms: { key: string; title: string }[] };
  const depts: TD[] = (D.WORKBENCH && (D.WORKBENCH.departments as TD[])) || [];
  const [kind, code, rest] = v.split(':');
  const d = depts.find((x) => x.code === code);
  const dn = d ? d.short : code;
  if (kind === 'apply') {
    const t: Crumb[] = [{ label: 'New application', go: code ? 'apply' : undefined }];
    if (code) t.push({ label: dn, go: rest ? `apply:${code}` : undefined });
    if (rest) t.push({ label: (d && d.forms.find((f) => f.key === rest)?.title) || rest.replace(/_/g, ' ') });
    return t;
  }
  if (kind === 'work') return code ? [{ label: 'All records', go: 'work' }, { label: dn }] : [{ label: 'All records' }];
  if (kind === 'rec') return [{ label: 'All records', go: 'work' }, { label: dn, go: `work:${code}` }, { label: `Record ${rest}` }];
  if (kind === 'approvals') return [{ label: 'Approvals' }];
  return [{ label: workbenchMeta(v)[0] }];
}

/** [page title, section] for the breadcrumb. */
export function workbenchMeta(v: string): [string, string] {
  if (v.startsWith('apply')) return ['New application', 'Workbench'];
  if (v === 'approvals') return ['Approvals', 'Workbench'];
  if (v.startsWith('work')) return ['All records', 'Workbench'];
  if (v.startsWith('rec:')) return ['Record', 'Workbench'];
  return ['Workbench', 'Workbench'];
}

const officeLink = (port: number, id?: number) => `${portalOrigin(port)}/office${id ? '#/record/' + id : ''}`;
/** One colour for all the step icons of the new-application progress. */
const deptColor = (code: string, fallback?: string) => DEPT_HUE[code] || fallback || '#0E9F6B';

/* ================================================================ form engine (mirrors departments/forms/common.js) */
const opts = (f: Field): Opt[] => (f.options || []).map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export function applies(w: When | undefined, values: Values): boolean {
  if (!w) return true;
  const v = values[w.field];
  if (w.is !== undefined) return v === w.is;
  if (w.in) return w.in.includes(v);
  if (w.truthy) return !!v && !(Array.isArray(v) && !v.length);
  if (w.includes !== undefined) return Array.isArray(v) && v.includes(w.includes);
  if (w.not !== undefined) return v != null && v !== '' && String(v) !== String(w.not);
  return true;
}

function initialValue(f: Field): unknown {
  if (f.default !== undefined && f.default !== null) return f.default;
  if (f.defaultToday) return todayIso();
  if (f.type === 'checkbox') return false;
  if (f.type === 'checkboxes' || f.type === 'multiselect') return [];
  if (f.type === 'group') {
    const min = f.min == null ? (f.required ? 1 : 0) : f.min;
    return Array.from({ length: Math.max(1, min) }, () => initialValues([{ fields: f.fields || [] }]));
  }
  return '';
}
export function initialValues(sections: Section[]): Values {
  const out: Values = {};
  sections.forEach((s) => s.fields.forEach((f) => { out[f.name] = initialValue(f); }));
  return out;
}

const VD = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
const VP = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
const verhoeff = (n: string) => { let c = 0; n.split('').reverse().forEach((d, i) => { c = VD[c][VP[i % 8][Number(d)]]; }); return c === 0; };
const isEmpty = (v: unknown) => v == null || v === '' || (Array.isArray(v) && !v.length);
const digitsOf = (v: unknown) => String(v == null ? '' : v).replace(/[\s-]/g, '');

/** The same checks the server makes, so most mistakes are shown before anything is sent. The server still decides. */
export function checkField(f: Field, raw: unknown): string | null {
  if (f.type === 'checkbox' || f.type === 'group') return null;
  if (isEmpty(raw)) return f.required ? `${f.label} is required.` : null;
  const s = String(raw).trim();
  switch (f.type) {
    case 'text': case 'textarea': {
      const max = f.max || (f.type === 'textarea' ? 2000 : 120);
      if (s.length > max) return `${f.label} can be at most ${max} characters.`;
      if (f.min && s.length < f.min) return `${f.label} needs at least ${f.min} characters.`;
      if (f.pattern && !new RegExp(f.pattern).test(s.replace(/\s+/g, ' '))) return f.patternMessage || `${f.label} is not in the expected format.`;
      return null;
    }
    case 'number': {
      const n = Number(raw);
      if (!Number.isFinite(n)) return `${f.label} must be a number.`;
      if (f.integer !== false && !Number.isInteger(n)) return `${f.label} must be a whole number.`;
      if (f.min != null && n < f.min) return `${f.label} must be at least ${f.min}.`;
      if (f.max != null && n > f.max) return `${f.label} can be at most ${f.max}.`;
      return null;
    }
    case 'date':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${f.label} is not a valid date.`;
      if (f.notFuture && s > todayIso()) return `${f.label} cannot be in the future.`;
      if (f.notPast && s < todayIso()) return `${f.label} cannot be in the past.`;
      return null;
    case 'datetime':
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return `${f.label} is not a valid date and time.`;
      if (f.notFuture && s.slice(0, 10) > todayIso()) return `${f.label} cannot be in the future.`;
      return null;
    case 'select': return opts(f).some((o) => o.value === s) ? null : `Choose a value for ${f.label} from the list.`;
    case 'aadhaar': { const d = digitsOf(raw); if (!/^\d{12}$/.test(d)) return `${f.label} must have 12 digits.`; if (/^[01]/.test(d) || !verhoeff(d)) return `${f.label} is not valid: an Aadhaar number never begins with 0 or 1, and its last digit is a check digit.`; return null; }
    case 'mobile': { const d = digitsOf(raw).replace(/^\+?91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, ''); return /^[6-9]\d{9}$/.test(d) ? null : `${f.label} must be ten digits beginning with 6, 7, 8 or 9.`; }
    case 'email': return s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? null : `${f.label} is not a valid e-mail address.`;
    case 'pin': return /^[1-9]\d{5}$/.test(digitsOf(raw)) ? null : `${f.label} must be six digits.`;
    default: return null;
  }
}

/** Every applicable field, checked; error keys as the server sends them (name, or group.index.name). */
export function checkForm(sections: Section[], values: Values): Errors {
  const errors: Errors = {};
  sections.forEach((s) => {
    if (!applies(s.when, values)) return;
    s.fields.forEach((f) => {
      if (!applies(f.when, values)) return;
      if (f.type === 'group') {
        const rows = Array.isArray(values[f.name]) ? (values[f.name] as Values[]) : [];
        const min = f.min == null ? (f.required ? 1 : 0) : f.min;
        if (rows.length < min) errors[f.name] = `Add at least ${min} ${f.itemLabel || 'entry'}${min === 1 ? '' : 's'}.`;
        rows.forEach((row, i) => (f.fields || []).forEach((sub) => {
          if (!applies(sub.when, row)) return;
          const e = checkField(sub, row[sub.name]);
          if (e) errors[`${f.name}.${i}.${sub.name}`] = e;
        }));
        return;
      }
      const e = checkField(f, values[f.name]);
      if (e) errors[f.name] = e;
    });
  });
  return errors;
}

/** What is sent: only the fields that apply (the server drops the rest anyway), numbers as numbers. */
export function collect(sections: Section[], values: Values): Values {
  const out: Values = {};
  const clean = (f: Field, v: unknown) => (f.type === 'number' && v !== '' && v != null ? Number(v) : v);
  sections.forEach((s) => {
    if (!applies(s.when, values)) return;
    s.fields.forEach((f) => {
      if (!applies(f.when, values)) return;
      if (f.type === 'group') {
        out[f.name] = (Array.isArray(values[f.name]) ? (values[f.name] as Values[]) : []).map((row) => {
          const r: Values = {};
          (f.fields || []).forEach((sub) => { if (applies(sub.when, row)) r[sub.name] = clean(sub, row[sub.name]); });
          return r;
        });
        return;
      }
      out[f.name] = clean(f, values[f.name]);
    });
  });
  return out;
}

const fieldId = (scope: string, name: string) => `wb-${scope}-${name.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

/** Column spans (of 12) for the fields of one block, so every row is filled edge to edge: a row that the
 *  form definition leaves short (two thirds, a half and a third, a lone half…) is stretched to the full width. */
const WIDTH_SPAN: Record<string, number> = { full: 12, half: 6, third: 4, quarter: 3 };
export function fieldSpans(fields: Field[]): Record<string, number> {
  const out: Record<string, number> = {};
  const base = (f: Field) => (f.type === 'group' || f.type === 'checkbox' ? 12 : (WIDTH_SPAN[f.width || 'full'] || 12));
  const flush = (row: Field[]) => {
    if (!row.length) return;
    const raw = row.map(base), sum = raw.reduce((a, b) => a + b, 0);
    const exact = raw.map((n) => (n * 12) / sum), sp = exact.map(Math.floor);
    let left = 12 - sp.reduce((a, b) => a + b, 0);
    exact.map((x, i) => [x - sp[i], i] as const).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { sp[i]++; left--; } });
    row.forEach((f, i) => { out[f.name] = sp[i]; });
  };
  let row: Field[] = [], used = 0;
  for (const f of fields) {
    const n = base(f);
    if (used + n > 12) { flush(row); row = []; used = 0; }
    row.push(f); used += n;
  }
  flush(row);
  return out;
}

function Control({ f, value, onChange, error, scope, disabled, span, aria, after }: { f: Field; value: unknown; onChange: (v: unknown) => void; error?: string; scope: string; disabled?: boolean; span?: number; aria?: Record<string, unknown>; after?: ReactNode }) {
  const id = fieldId(scope, f.name);
  const describedBy = [error ? id + '-e' : '', f.help ? id + '-h' : ''].filter(Boolean).join(' ') || undefined;
  const common = { ...aria, id, disabled, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy, 'aria-required': f.required && f.type !== 'checkbox' ? true : undefined };
  const str = value == null ? '' : String(value);
  let control: ReactNode;
  switch (f.type) {
    case 'textarea':
      control = <textarea className="wb-input" rows={f.rows || 3} maxLength={(f.max || 2000) + 50} value={str} onChange={(e) => onChange(e.target.value)} {...common} />;
      break;
    case 'select': {
      const list = opts(f);
      control = list.length
        ? <Select variant="form" id={id} disabled={disabled} invalid={!!error} describedBy={describedBy} required={f.required} ariaLabel={f.label} value={str} onChange={(v) => onChange(v)} options={list} placeholder={f.required ? 'Choose…' : '— none —'} clearable={!f.required} />
        : <div className="wb-note wb-note--warn" id={id}>{f.empty || 'There is nothing to choose from.'}</div>;
      break;
    }
    case 'checkbox':
      return (
        <div className={`wb-field wb-w-full${error ? ' has-error' : ''}`} data-field={f.name}>
          <label className="wb-check"><input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} {...common} /><span>{f.label}</span></label>
          {error ? <div className="wb-error" id={id + '-e'} role="alert">{error}</div> : null}
        </div>
      );
    case 'checkboxes': case 'multiselect': {
      const sel = Array.isArray(value) ? (value as string[]) : [];
      control = (
        <div className="wb-checks" role="group" aria-labelledby={id + '-l'} id={id} aria-describedby={describedBy}>
          {opts(f).map((o) => (
            <label className="wb-check" key={o.value}>
              <input type="checkbox" disabled={disabled} checked={sel.includes(o.value)} onChange={(e) => onChange(e.target.checked ? sel.concat(o.value) : sel.filter((x) => x !== o.value))} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      );
      break;
    }
    case 'number':
      control = <input className="wb-input" type="number" inputMode="numeric" min={f.min} max={f.max} step={f.integer === false ? 'any' : 1} value={str} onChange={(e) => onChange(e.target.value)} {...common} />;
      break;
    case 'date':
      control = <DatePicker id={id} disabled={disabled} invalid={!!error} describedBy={describedBy} required={f.required} ariaLabel={f.label} value={str} onChange={(v) => onChange(v)} max={f.notFuture ? todayIso() : undefined} min={f.notPast ? todayIso() : undefined} clearable={!f.required} />;
      break;
    case 'datetime':
      control = <DateTimePicker id={id} disabled={disabled} invalid={!!error} describedBy={describedBy} required={f.required} ariaLabel={f.label} value={str} onChange={(v) => onChange(v)} />;
      break;
    case 'aadhaar': case 'mobile': case 'pin':
      control = <input className="wb-input wb-mono" type="text" inputMode="numeric" autoComplete="off" maxLength={f.type === 'aadhaar' ? 14 : f.type === 'mobile' ? 14 : 6} value={str} onChange={(e) => onChange(e.target.value)} {...common} />;
      break;
    case 'email':
      control = <input className="wb-input" type="email" autoComplete="off" maxLength={254} value={str} onChange={(e) => onChange(e.target.value)} {...common} />;
      break;
    default:
      control = <input className="wb-input" type="text" maxLength={(f.max || 120) + 20} value={str} onChange={(e) => onChange(e.target.value)} {...common} />;
  }
  return (
    <div className={`wb-field ${span ? 'wb-s-' + span : 'wb-w-' + (f.width || 'full')}${error ? ' has-error' : ''}`} data-field={f.name}>
      <label className="wb-label" htmlFor={id} id={id + '-l'}>{f.label}{f.required ? <span className="wb-req" aria-hidden="true"> *</span> : null}</label>
      {control}
      {f.help ? <div className="wb-help" id={id + '-h'}>{f.help}</div> : null}
      {error ? <div className="wb-error" id={id + '-e'} role="alert">{error}</div> : null}
      {after}
    </div>
  );
}

function GroupField({ f, rows, setRows, errors, scope, disabled }: { f: Field; rows: Values[]; setRows: (r: Values[]) => void; errors: Errors; scope: string; disabled?: boolean }) {
  const min = f.min == null ? (f.required ? 1 : 0) : f.min;
  const item = f.itemLabel || 'entry';
  return (
    <div className="wb-field wb-w-full" data-field={f.name}>
      <div className="wb-label">{f.label}{f.required ? <span className="wb-req" aria-hidden="true"> *</span> : null}</div>
      {errors[f.name] ? <div className="wb-error" role="alert">{errors[f.name]}</div> : null}
      <div className="wb-group">
        {rows.map((row, i) => (
          <div className="wb-group-item" key={i}>
            <div className="wb-group-head">
              <span>{item.charAt(0).toUpperCase() + item.slice(1)} {i + 1}</span>
              {rows.length > min ? <button className="btn btn-xs btn-ghost" type="button" disabled={disabled} onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={`Remove ${item} ${i + 1}`}>Remove</button> : null}
            </div>
            <div className="wb-fields">
              {(() => { const vis = (f.fields || []).filter((sub) => applies(sub.when, row)); const sp = fieldSpans(vis); return vis.map((sub) => (
                <Control key={sub.name} span={sp[sub.name]} f={sub} scope={`${scope}-${f.name}-${i}`} disabled={disabled} value={row[sub.name]} error={errors[`${f.name}.${i}.${sub.name}`]}
                  onChange={(v) => setRows(rows.map((r, j) => (j === i ? { ...r, [sub.name]: v } : r)))} />
              )); })()}
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-sm btn-soft" type="button" disabled={disabled || (!!f.max && rows.length >= f.max)}
        onClick={() => setRows(rows.concat([initialValues([{ fields: f.fields || [] }])]))}>+ Add {item}</button>
    </div>
  );
}

export function FormFields({ sections, values, setValues, errors, scope, disabled, suggest }: { sections: Section[]; values: Values; setValues: (v: Values) => void; errors: Errors; scope: string; disabled?: boolean; suggest?: boolean }) {
  // suggestions from the department records (suggest.tsx), on the application form only
  const dismissed = useRef(new Set<string>());
  const names = useMemo(() => new Set(sections.flatMap((s) => s.fields.map((x) => x.name))), [sections]);
  const control = (f: Field, sp: number | undefined) => {
    const base = { span: sp, f, scope, disabled, value: values[f.name], error: errors[f.name], onChange: (v: unknown) => setValues({ ...values, [f.name]: v }) };
    const trigger = suggest ? triggerOf(f, names) : null;
    if (!trigger) return <Control key={f.name} {...base} />;
    // the Aadhaar number of a person is asked first, and says what typing it does
    if (isAutoAadhaar(trigger, f)) base.f = { ...f, help: undefined };
    return (
      <SuggestField key={f.name} trigger={trigger} field={f} sections={sections} values={values} setValues={setValues} dismissed={dismissed.current} disabled={disabled}
        render={(aria, after) => <Control {...base} aria={aria} after={after} />} />
    );
  };
  return (
    <>
      {sections.filter((s) => applies(s.when, values)).map((s, si) => {
        const shown = s.fields.filter((f) => applies(f.when, values));
        const fields = suggest ? aadhaarFirst(shown, names) : shown;
        if (!fields.length) return null;
        const sp = fieldSpans(fields);
        return (
          <fieldset className="wb-section" key={si}>
            {s.title ? <legend className="wb-section-title">{s.title}</legend> : null}
            <div className="wb-fields">
              {fields.map((f) => (f.type === 'group'
                ? <GroupField key={f.name} f={f} scope={scope} disabled={disabled} errors={errors} rows={Array.isArray(values[f.name]) ? (values[f.name] as Values[]) : []} setRows={(r) => setValues({ ...values, [f.name]: r })} />
                : control(f, sp[f.name])))}
            </div>
          </fieldset>
        );
      })}
    </>
  );
}

/** Move the focus to the first field with an error, so a keyboard or screen-reader user lands on it. */
function focusFirstError(host: HTMLElement | null, errors: Errors) {
  if (!host) return;
  const first = Object.keys(errors)[0];
  if (!first) return;
  const top = first.split('.')[0];
  const el = host.querySelector<HTMLElement>(`[data-field="${CSS.escape(first.split('.').pop() || top)}"] input, [data-field="${CSS.escape(first.split('.').pop() || top)}"] select, [data-field="${CSS.escape(first.split('.').pop() || top)}"] textarea`)
    || host.querySelector<HTMLElement>(`[data-field="${CSS.escape(top)}"] input, [data-field="${CSS.escape(top)}"] select, [data-field="${CSS.escape(top)}"] textarea, [data-field="${CSS.escape(top)}"] button`);
  if (el) { el.focus(); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
}

/* ================================================================ small pieces */
function statusTone(status: string | null, label?: string): string {
  const s = `${status || ''} ${label || ''}`.toLowerCase();
  if (/reject|return|object|fail/.test(s)) return 'pill-danger';
  if (/needs_info|blocked|defer|deficien|information|consent/.test(s)) return 'pill-warn';
  if (/approved|completed|closed|disposed|visited|active|registered|released/.test(s) && !/awaiting/.test(s)) return 'pill-ok';
  if (!status) return 'pill-neutral';
  return 'pill-info';
}
const StatusPill = ({ status, label }: { status: string | null; label: string }) => <span className={`pill ${statusTone(status, label)}`}>{label || 'Recorded'}</span>;

function ErpPill({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="wb-muted">—</span>;
  const map: Record<string, [string, string]> = { delivered: ['pill-ok', 'In the ERP'], pending: ['pill-warn', 'Sending'], rejected: ['pill-danger', 'Refused'] };
  const [cls, text] = map[status] || ['pill-neutral', status];
  return <span className={`pill ${cls}`}>{text}</span>;
}

function DeptBadge({ code, short, color }: { code: string; short: string; color?: string }) {
  return <span className="wb-dept" style={{ ['--sys' as string]: deptColor(code, color) }}><Svg name={PORTAL_ICON[code] || 'layers'} /><span>{short}</span></span>;
}

const Alert = ({ tone = 'danger', children }: { tone?: 'danger' | 'warn' | 'info' | 'ok'; children: ReactNode }) =>
  <div className={`wb-alert wb-alert--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>{children}</div>;

export function PageHead({ title, desc, actions, art, actionsLeft }: { title: string; desc: ReactNode; actions?: ReactNode; art?: ArtKind; actionsLeft?: boolean }) {
  return <div className={`page-head${art ? ' has-art' : ''}${actionsLeft ? ' page-head--left' : ''}`}><div><h1 className="page-title">{title}</h1><p className="page-desc">{desc}</p></div>{actions ? <div className="page-actions">{actions}</div> : null}{art ? <PageArt kind={art} /> : null}</div>;
}

function Loading({ text = 'Loading…' }: { text?: string }) { return <div className="wb-loading" role="status"><span className="wb-spinner" aria-hidden="true" />{text}</div>; }

const when = (s: string | null | undefined) => { if (!s) return '—'; const d = parseUtc(s); return isNaN(d.getTime()) ? s : `${fmtDateTime(d)} · ${rel(d)}`; };
const short = (s: string | null | undefined) => { if (!s) return '—'; const d = parseUtc(s); return isNaN(d.getTime()) ? s : rel(d); };
const human = (k: string) => { const s = k.replace(/_/g, ' '); return s.charAt(0).toUpperCase() + s.slice(1); };

/** Re-run `fn` every `ms` while the page is visible; stops when the view is left. */
function usePoll(fn: () => void, ms: number, active: boolean) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => { if (document.visibilityState === 'visible') ref.current(); }, ms);
    const onVis = () => { if (document.visibilityState === 'visible') ref.current(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { window.clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, [ms, active]);
}

function useOverview(active: boolean) {
  const [ov, setOv] = useState<Overview | null>(D.WORKBENCH as Overview | null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { const o = await api<Overview>(''); D.WORKBENCH = o; setOv(o); setErr(null); } catch (e) { setErr((e as Error).message); }
  }, []);
  useEffect(() => { if (active) load(); }, [active, load]);
  return { ov, err, reload: load };
}

/* ================================================================ action dialog */
function ActionDialog({ code, record, action, onClose, onDone, toast }: {
  code: string; record: { id: number; version: number; title: string; ref: string }; action: Action;
  onClose: () => void; onDone: (r: RecordView) => void; toast: Toast;
}) {
  const sections = useMemo<Section[]>(() => [{ fields: action.fields || [] }], [action]);
  const [values, setValues] = useState<Values>(() => initialValues(sections));
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'danger' | 'warn'; text: string; stale?: boolean } | null>(null);
  const requestId = useRef(newRequestId());
  const box = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(typeof document !== 'undefined' ? document.activeElement : null);

  useEffect(() => {
    const first = box.current?.querySelector<HTMLElement>('input, select, textarea') || box.current?.querySelector<HTMLElement>('[data-ok]');
    first?.focus();
    const prev = opener.current;
    return () => { if (prev instanceof HTMLElement) prev.focus(); };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab' || !box.current) return;
      const list = Array.from(box.current.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href]')).filter((x) => !(x as HTMLButtonElement).disabled && x.offsetParent !== null);
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [busy, onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setMessage(null);
    const local = checkForm(sections, values);
    setErrors(local);
    if (Object.keys(local).length) { focusFirstError(box.current, local); return; }
    setBusy(true);
    try {
      const res = await api<{ record: RecordView }>(`/${code}/records/${record.id}/actions/${encodeURIComponent(action.key)}`, {
        method: 'POST', body: { values: collect(sections, values), version: record.version, requestId: requestId.current },
      });
      toast(`${action.label}: done`, <>{res.record.title} · {res.record.department.short}. Saved in the department and sent to the ERP.</>, 'check');
      onDone(res.record);
    } catch (err) {
      const ae = err as ApiError;
      setBusy(false);
      if (ae.status === 409) { setMessage({ tone: 'warn', text: ae.message, stale: true }); return; }
      if (ae.errors) { setErrors(ae.errors); focusFirstError(box.current, ae.errors); }
      setMessage({ tone: ae.status === 422 && !ae.errors ? 'warn' : 'danger', text: ae.message });
    }
  };

  const danger = action.tone === 'danger';
  return (
    <div className="wb-dialog-back" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div className="wb-dialog" role="dialog" aria-modal="true" aria-labelledby="wbDlgT" aria-describedby="wbDlgD" ref={box}>
        <div className="wb-dialog-head">
          <div><div className="wb-kicker">{record.title} · {record.ref}</div><h2 id="wbDlgT">{action.label}</h2></div>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose} disabled={busy}><Svg name="close" /></button>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="wb-dialog-body">
            <p id="wbDlgD" className="wb-dialog-desc">{action.description || (action.to ? `Moves the record on. The department and the ERP are updated at once.` : 'Saved in the department and sent to the ERP at once.')}</p>
            {message ? <Alert tone={message.tone}>{message.text}{message.stale ? <> <button className="btn btn-xs" type="button" onClick={() => onDone(null as unknown as RecordView)}>Reload the record</button></> : null}</Alert> : null}
            {action.fields.length ? <FormFields sections={sections} values={values} setValues={(v) => { setValues(v); }} errors={errors} scope={`dlg-${action.key}`} disabled={busy} /> : null}
          </div>
          <div className="wb-dialog-foot">
            <button className="btn" type="button" onClick={onClose} disabled={busy}>Cancel</button>
            <button className={`btn ${danger ? 'wb-btn-danger' : 'btn-primary'}`} type="submit" data-ok disabled={busy || !!message?.stale} aria-busy={busy}>
              {busy ? <span className="wb-spinner wb-spinner--sm" aria-hidden="true" /> : null}{action.kind === 'edit' ? 'Save changes' : action.fields.length ? 'Save' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================================================================ #apply */
/* ============================================================ #apply: choose the department */
const DEPT_TONE: Record<string, [string, string]> = {
  eprisons: ['#9560E8', '#F2E8FF'], cctns: ['#2674F5', '#E5F0FF'], eforensics: ['#9050E8', '#F1E7FF'], uidai: ['#E76C27', '#FFF0E3'], ecourts: ['#138C98', '#E2F4F3'],
};
const deptTone = (code: string, fallback?: string): [string, string] => DEPT_TONE[code] || [deptColor(code, fallback), '#EAF7F1'];

export function DepartmentPicker({ departments, goto }: { departments: WbDept[]; goto: (v: string) => void }) {
  // nothing is selected until the user picks a department; the pick is shown for the moment before the page moves on
  const [selected, setSelected] = useState('');
  const forms = departments.reduce((t, d) => t + d.forms.length, 0);
  const open = (code: string) => { setSelected(code); goto(`apply:${code}`); };
  return (
    <div className="wbd">
      <header className="wbd-hero">
        <div className="wbd-hero-text">
          <span className="wbd-accent" aria-hidden="true" />
          <h1>New Application</h1>
          <p>Choose a department to submit your application. It is saved in that department’s own office and reaches the ERP at once.</p>
        </div>
        <PageArt kind="apply" />
      </header>

      <section className="wbd-panel" aria-label="Departments">
        <div className="wbd-head">
          <span className="wbd-head-ic" aria-hidden="true"><Svg name="grid" /></span>
          <div className="wbd-head-text"><h2>Departments</h2><p>Select the office responsible for processing your application.</p></div>
          <div className="wbd-sums">
            <div className="wbd-sum"><span className="wbd-sum-ic" aria-hidden="true"><Svg name="layers" /></span><span className="wbd-sum-bar" aria-hidden="true" /><b>{num(departments.length)}</b><span>{departments.length === 1 ? 'Available office' : 'Available offices'}</span></div>
            <div className="wbd-sum"><span className="wbd-sum-ic" aria-hidden="true"><Svg name="file" /></span><span className="wbd-sum-bar" aria-hidden="true" /><b>{num(forms)}</b><span>{forms === 1 ? 'Total form' : 'Total forms'}</span></div>
          </div>
        </div>
        <div className="wbd-rows">
          {departments.map((d) => {
            const [fg, bg] = deptTone(d.code, d.color);
            const on = selected === d.code;
            return (
              <div key={d.code} className={`wbd-row${on ? ' is-selected' : ''}`} role="link" tabIndex={0} aria-current={on ? 'true' : undefined} aria-label={`${d.short}: apply to ${d.title}`}
                style={{ ['--fg' as string]: fg, ['--bg' as string]: bg }} onClick={() => open(d.code)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(d.code); } }}>
                <div className="wbd-id">
                  <span className="wbd-ic" aria-hidden="true"><Svg name={PORTAL_ICON[d.code] || 'layers'} /></span>
                  <div className="wbd-id-text"><b>{d.short}</b><span>{d.title}</span></div>
                </div>
                <div className="wbd-metrics">
                  <div className="wbd-m"><Svg name="file" /><div><b>{num(d.forms.length)}</b><span>{d.forms.length === 1 ? 'Form' : 'Forms'}</span></div></div>
                  <div className="wbd-m"><Svg name="database" /><div><b>{num(d.totalRecords)}</b><span>{d.totalRecords === 1 ? 'Record' : 'Records'}</span></div></div>
                  <div className="wbd-m"><Svg name="clock" /><div><b>{d.awaiting ? num(d.awaiting) : '—'}</b><span>Awaiting</span></div></div>
                </div>
                <div className="wbd-go" aria-hidden="true">
                  {on ? <span className="wbd-tick"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></span> : null}
                  <svg className="wbd-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ApplyView({ view, goto, toast, onChanged }: WbProps) {
  const [, code, formKey] = view.split(':');
  const { ov, err, reload } = useOverview(true);
  const dept = ov && code ? ov.departments.find((d) => d.code === code) : null;

  if (err && !ov) return <><PageHead title="New application" desc="Apply to any department from one place." /><Alert>{err} <button className="btn btn-xs" type="button" onClick={reload}>Try again</button></Alert></>;
  if (!ov) return <Loading />;
  if (code && !dept) return <><PageHead title="New application" desc="Apply to any department from one place." /><Alert>There is no department “{code}”. <button className="btn btn-xs" type="button" onClick={() => goto('apply')}>Choose a department</button></Alert></>;

  if (!dept) return <DepartmentPicker departments={ov.departments} goto={goto} />;

  if (!formKey) {
    return (
      <>
        <PageHead title={`New application · ${dept.short}`} desc={dept.title} />
        <div className="card wb-table-card">
          <div className="card-head tight"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="file" /></span>Forms</div><div className="card-sub">{`Choose the form for ${dept.title}.`}</div></div><a className="btn btn-sm" href={officeLink(dept.port)} target="_blank" rel="noopener noreferrer"><Svg name="external" /> Department office</a></div>
          <div className="tbl-wrap"><table className="tbl wb-table wb-pick">
            <tbody>
              {dept.forms.map((f) => {
                const typeLabel = (dept.types.find((t) => t.key === f.recordType) || { label: f.recordType }).label;
                return (
                  <tr key={f.key} className="clickable" tabIndex={0} role="link" aria-label={`${f.title}: ${f.description}`} onClick={() => goto(`apply:${dept.code}:${f.key}`)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goto(`apply:${dept.code}:${f.key}`); } }}
                    style={{ ['--sys' as string]: deptColor(dept.code, dept.color) }}>
                    <td>
                      <div className="wb-pickcell">
                        <span className="wb-card-ic"><Svg name="file" /></span>
                        <div><b>{f.title}</b><div className="wb-sub">{f.description}</div></div>
                      </div>
                    </td>
                    <td className="wb-center"><span className="pill pill-neutral">{typeLabel}</span></td>
                    <td className="wb-chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg></td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>
      </>
    );
  }

  return <ApplyForm key={`${dept.code}:${formKey}`} dept={dept} formKey={formKey} goto={goto} toast={toast} onChanged={() => { onChanged(); reload(); }} />;
}

/* ============================================================ the receipt shown after an application is submitted */
/** Each department keeps its own colour theme on its receipt. */
const THEME: Record<string, string> = { eprisons: 'purple', cctns: 'blue', eforensics: 'lavender', uidai: 'orange', ecourts: 'teal' };
export function SubmissionTicket({ rec, dept, form }: { rec: RecordView; dept: WbDept; form: FormDef }) {
  const people = rec.parties.map((p) => p.name).filter(Boolean);
  const erp = rec.erp;
  const erpText = !erp ? 'Saved in the department office'
    : erp.status === 'delivered' ? `Delivered to the ERP${erp.latencyMs != null ? ` in ${erp.latencyMs} ms` : ''}`
    : erp.status === 'pending' ? `Waiting to reach the ERP${erp.error ? `: ${erp.error}` : ''}` : `The ERP refused it${erp.error ? `: ${erp.error}` : ''}`;
  const fields: [string, ReactNode][] = [
    ['Department', <><b>{dept.short}</b><small>{dept.title}</small></>],
    ['Form', <b>{form.title}</b>],
    ['Record type', <b>{rec.typeLabel}</b>],
    ['Submitted', <b>{(() => { const d = parseUtc(rec.createdAt); return isNaN(d.getTime()) ? rec.createdAt : fmtDateTime(d).replace(' · ', ', '); })()}</b>],
    ['Submitted by', <b>{rec.createdBy}</b>],
    ...(people.length ? [['People named', <b>{people.slice(0, 3).join(', ')}{people.length > 3 ? ` +${people.length - 3}` : ''}</b>] as [string, ReactNode]] : []),
  ];
  return (
    <section className={`tk${THEME[dept.code] ? ' tk--' + THEME[dept.code] : ''}`} aria-label={`Application receipt, reference ${rec.ref}`} style={{ ['--sys' as string]: deptColor(dept.code, dept.color) }}>
      <div className="tk-main">
        <header className="tk-head">
          <span className="tk-head-ic" aria-hidden="true"><Svg name={PORTAL_ICON[dept.code] || 'layers'} /></span>
          <div className="tk-head-text"><span>Application submitted</span><b>{dept.short} · {rec.typeLabel}</b></div>
          <span className="tk-head-ref">Ref <b>{rec.ref}</b></span>
        </header>
        <div className="tk-body">
          <div className="tk-title"><h2>{rec.title}</h2>{rec.subtitle ? <p>{rec.subtitle}</p> : null}</div>
          <dl className="tk-grid">
            {fields.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </div>
        <footer className="tk-foot">
          <span className="tk-foot-tag"><Svg name="check" /> {erp && erp.status !== 'delivered' ? 'Saved' : 'Sent'}</span>
          <span className="tk-foot-text">{erpText}</span>
          <span className="tk-foot-meta">Version {rec.version}</span>
        </footer>
      </div>
    </section>
  );
}

function ApplyForm({ dept, formKey, goto, toast, onChanged }: { dept: WbDept; formKey: string; goto: (v: string) => void; toast: Toast; onChanged: () => void }) {
  const [form, setForm] = useState<FormDef | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState<RecordView | null>(null);
  const [dirty, setDirty] = useState(false);
  const requestId = useRef(newRequestId());
  const host = useRef<HTMLFormElement>(null);

  const load = useCallback(async () => {
    setLoadErr(null);
    try {
      const r = await api<{ form: FormDef }>(`/${dept.code}/forms/${encodeURIComponent(formKey)}`);
      setForm(r.form); setValues(initialValues(r.form.sections)); setErrors({}); setDirty(false);
    } catch (e) { setLoadErr((e as Error).message); }
  }, [dept.code, formKey]);
  useEffect(() => { load(); }, [load]);

  // leaving the page with an application half filled in asks first
  useEffect(() => {
    if (!dirty || done) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, done]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || busy) return;
    setMessage(null);
    const local = checkForm(form.sections, values);
    setErrors(local);
    if (Object.keys(local).length) { setMessage(`${Object.keys(local).length} field${Object.keys(local).length === 1 ? ' needs' : 's need'} attention.`); focusFirstError(host.current, local); return; }
    setBusy(true);
    try {
      const res = await api<{ record: RecordView }>(`/${dept.code}/records`, { method: 'POST', body: { form: form.key, values: collect(form.sections, values), requestId: requestId.current } });
      setDone(res.record); setDirty(false);
      toast('Application submitted', <>{res.record.title} in {dept.short}. It is in the department office now and on its way to the ERP.</>, 'check');
      onChanged();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const ae = err as ApiError;
      if (ae.errors) { setErrors(ae.errors); focusFirstError(host.current, ae.errors); }
      setMessage(ae.message);
    } finally { setBusy(false); }
  };

  const again = () => { requestId.current = newRequestId(); setDone(null); load(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  if (loadErr) return <><PageHead title="New application" desc={dept.title} /><Alert>{loadErr} <button className="btn btn-xs" type="button" onClick={load}>Try again</button> <button className="btn btn-xs" type="button" onClick={() => goto(`apply:${dept.code}`)}>Choose another form</button></Alert></>;
  if (!form) return <Loading text="Loading the form…" />;

  if (done) {
    return (
      <>
        <PageHead title="Application submitted" desc={`${form.title} · ${dept.title}`} />
        <SubmissionTicket rec={done} dept={dept} form={form} />
        <div className="wb-row tk-actions">
          <button className="btn btn-primary" type="button" onClick={() => goto(`rec:${dept.code}:${done.id}`)}>Open the record</button>
          <a className="btn" href={officeLink(dept.port, done.id)} target="_blank" rel="noopener noreferrer"><Svg name="external" /> Open in the {dept.short} office</a>
          <button className="btn" type="button" onClick={again}>Submit another {form.title.toLowerCase()}</button>
          <button className="btn btn-ghost" type="button" onClick={() => goto('apply')}>Another department</button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead title={form.title} desc={<>{form.description} <span className="wb-muted">· {dept.title}</span></>} />
      <form className="card wb-form" ref={host} onSubmit={submit} noValidate>
        {message ? <Alert>{message}</Alert> : null}
        <FormFields sections={form.sections} values={values} setValues={(v) => { setValues(v); setDirty(true); }} errors={errors} scope={`apply-${dept.code}-${form.key}`} disabled={busy} suggest />
        <div className="wb-form-foot">
          <span className="wb-muted">Fields marked * are required. The department checks everything again when it receives the application.</span>
          <button className="btn" type="button" disabled={busy} onClick={() => { if (!dirty || window.confirm('Discard what you have typed?')) goto(`apply:${dept.code}`); }}>Cancel</button>
          <button className="btn btn-primary" type="submit" disabled={busy} aria-busy={busy}>{busy ? <span className="wb-spinner wb-spinner--sm" aria-hidden="true" /> : null}{form.submitLabel || 'Submit'}</button>
        </div>
      </form>
    </>
  );
}

/* ================================================================ #approvals */
function ApprovalsView({ goto, toast, onChanged }: WbProps) {
  const [rows, setRows] = useState<InboxRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [q, setQ] = useState('');
  const [dialog, setDialog] = useState<{ row: InboxRow; action: Action } | null>(null);
  const { ov } = useOverview(true);

  const load = useCallback(async () => {
    try {
      const r = await api<{ total: number; rows: InboxRow[] }>(`/inbox?limit=500${code ? '&code=' + encodeURIComponent(code) : ''}`);
      setRows(r.rows); setTotal(r.total); setErr(null);
    } catch (e) { setErr((e as Error).message); }
  }, [code]);
  useEffect(() => { setRows(null); load(); }, [load]);
  usePoll(load, 20000, !dialog);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rows || []).filter((r) => !t || `${r.ref} ${r.title} ${r.subtitle} ${r.typeLabel} ${r.statusLabel}`.toLowerCase().includes(t));
  }, [rows, q]);

  const depts = ov ? ov.departments : [];
  return (
    <>
      <PageHead art="approvals" title="Approvals" desc="Everything waiting for a decision in the five departments, oldest first. A decision here is the same as one made in the department office: it is saved there and sent to the ERP at once." />
      <div className="wb-toolbar">
        <div className="seg" role="tablist" aria-label="Department">
          <button type="button" role="tab" aria-selected={!code} className={!code ? 'is-active' : ''} onClick={() => setCode('')}>All{rows && !code ? ` · ${num(total)}` : ''}</button>
          {depts.map((d) => <button key={d.code} type="button" role="tab" aria-selected={code === d.code} className={code === d.code ? 'is-active' : ''} onClick={() => setCode(d.code)}>{d.short}{d.awaiting ? ` · ${num(d.awaiting)}` : ''}</button>)}
        </div>
        <span className="wb-search"><Svg name="filter" /><input className="wb-input" type="search" placeholder="Filter by reference, name, type or status" aria-label="Filter the approvals" value={q} onChange={(e) => setQ(e.target.value)} /></span>
      </div>
      {err ? <Alert>{err} <button className="btn btn-xs" type="button" onClick={load}>Try again</button></Alert> : null}
      {!rows ? <Loading /> : !shown.length
        ? <div className="card wb-empty"><Svg name="check" /><b>{q ? 'Nothing matches the filter.' : 'Nothing is waiting for a decision.'}</b><span>{q ? 'Clear the filter to see everything waiting.' : 'New applications appear here as soon as they are made, in the hub or in a department office.'}</span></div>
        : (
          <div className="card wb-table-card">
            <div className="tbl-wrap"><table className="tbl wb-table">
              <thead><tr><th>Department</th><th>Record</th><th>Status</th><th>Waiting since</th><th>ERP</th><th className="wb-right">Decide</th></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={`${r.department.code}:${r.id}`}>
                    <td><DeptBadge code={r.department.code} short={r.department.short} color={r.department.color} /></td>
                    <td>
                      <button className="wb-link" type="button" onClick={() => goto(`rec:${r.department.code}:${r.id}`)}>{r.title}</button>
                      <div className="wb-sub">{r.typeLabel} · {r.subtitle}</div>
                    </td>
                    <td><StatusPill status={r.status} label={r.statusLabel} /></td>
                    <td className="wb-nowrap" title={when(r.updatedAt)}>{short(r.updatedAt)}</td>
                    <td><ErpPill status={r.erp} /></td>
                    <td className="wb-right">
                      <div className="wb-decide">
                        {r.actions.slice(0, 2).map((a) => (
                          <button key={a.key} type="button" className={`btn btn-xs ${a.tone === 'danger' ? 'wb-btn-danger-soft' : a.tone === 'warning' ? 'wb-btn-warn-soft' : 'btn-soft'}`} onClick={() => setDialog({ row: r, action: a })}>{a.label}</button>
                        ))}
                        <button type="button" className="btn btn-xs btn-ghost" onClick={() => goto(`rec:${r.department.code}:${r.id}`)} aria-label={`Open ${r.title}`}>Open<Svg name="arrowRight" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <div className="table-note">{num(shown.length)} of {num(rows.length)} shown. The list refreshes every 20 seconds, so decisions made in a department office drop out here by themselves.</div>
          </div>
        )}
      {dialog ? (
        <ActionDialog code={dialog.row.department.code} record={dialog.row} action={dialog.action} toast={toast}
          onClose={() => setDialog(null)} onDone={() => { setDialog(null); load(); onChanged(); }} />
      ) : null}
    </>
  );
}

/* ================================================================ #work */
function RecordsView({ view, goto }: WbProps) {
  const { ov, err: ovErr, reload } = useOverview(true);
  const code = view.split(':')[1] || (ov && ov.departments[0] ? ov.departments[0].code : '');
  const dept = ov ? ov.departments.find((d) => d.code === code) : null;
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [qApplied, setQApplied] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListPage | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { setType(''); setQ(''); setQApplied(''); setPage(1); }, [code]);
  const load = useCallback(async (signal?: AbortSignal) => {
    if (!code) return;
    try {
      const p = new URLSearchParams({ page: String(page), size: '25' });
      if (type) p.set('type', type);
      if (qApplied) p.set('q', qApplied);
      const r = await api<ListPage>(`/${code}/records?${p}`, { signal });
      setData(r); setErr(null);
    } catch (e) { if ((e as Error).name !== 'AbortError') setErr((e as Error).message); }
  }, [code, type, qApplied, page]);
  useEffect(() => { const c = new AbortController(); setData(null); load(c.signal); return () => c.abort(); }, [load]);
  // the search is sent a moment after typing stops, not on every key
  useEffect(() => { const t = window.setTimeout(() => { setQApplied(q.trim()); setPage(1); }, 300); return () => window.clearTimeout(t); }, [q]);

  if (ovErr && !ov) return <><PageHead title="All records" desc="" /><Alert>{ovErr} <button className="btn btn-xs" type="button" onClick={reload}>Try again</button></Alert></>;
  if (!ov) return <Loading />;
  if (!dept) return <><PageHead title="All records" desc="" /><Alert>There is no department “{code}”. <button className="btn btn-xs" type="button" onClick={() => goto('work')}>Show the first department</button></Alert></>;

  return (
    <>
      <PageHead art="records" actionsLeft title="All records" desc="Every record of a department, newest change first, read live from its own database. Open one to decide on it or correct its details."
        actions={<><button className="btn btn-sm" type="button" onClick={() => goto(`apply:${dept.code}`)}><Svg name="plus" /> New {dept.short} application</button><a className="btn btn-sm" href={officeLink(dept.port)} target="_blank" rel="noopener noreferrer"><Svg name="external" /> {dept.short} office</a></>} />
      <div className="wb-toolbar">
        <div className="seg" role="tablist" aria-label="Department">
          {ov.departments.map((d) => <button key={d.code} type="button" role="tab" aria-selected={d.code === dept.code} className={d.code === dept.code ? 'is-active' : ''} onClick={() => goto(`work:${d.code}`)}>{d.short}</button>)}
        </div>
        <Select ariaLabel="Record type" placeholder="All types" clearable value={type} onChange={(v) => { setType(v); setPage(1); }} options={dept.types.map((t) => ({ value: t.key, label: t.plural }))} />
        <span className="wb-search"><Svg name="search" /><input className="wb-input" type="search" placeholder="Reference, name, Aadhaar or mobile" aria-label="Search the records" value={q} onChange={(e) => setQ(e.target.value)} /></span>
      </div>
      {err ? <Alert>{err} <button className="btn btn-xs" type="button" onClick={() => load()}>Try again</button></Alert> : null}
      {!data ? <Loading /> : !data.rows.length
        ? <div className="card wb-empty"><Svg name="search" /><b>No records match.</b><span>Change the type or the search.</span></div>
        : (
          <div className="card wb-table-card">
            <div className="tbl-wrap"><table className="tbl wb-table">
              <thead><tr><th>Record</th><th>Type</th><th>Status</th><th>Last change</th><th>ERP</th></tr></thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id} className="wb-click" onClick={() => goto(`rec:${dept.code}:${r.id}`)}>
                    <td><button className="wb-link" type="button" onClick={(e) => { e.stopPropagation(); goto(`rec:${dept.code}:${r.id}`); }}>{r.title}</button><div className="wb-sub">{r.subtitle}</div></td>
                    <td>{r.typeLabel}</td>
                    <td><StatusPill status={r.status} label={r.statusLabel} /></td>
                    <td className="wb-nowrap" title={when(r.updatedAt)}>{short(r.updatedAt)}</td>
                    <td><ErpPill status={r.erp} /></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            <div className="pager">
              <div className="pager-info">Page <b>{data.page}</b> of <b>{data.pages}</b> · {num(data.total)} records</div>
              <div className="pager-btns">
                <button className="btn btn-sm" type="button" disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>Previous</button>
                <button className="btn btn-sm" type="button" disabled={data.page >= data.pages} onClick={() => setPage(data.page + 1)}>Next</button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}

/* ================================================================ #rec:<code>:<id> */
function DataTree({ value, depth = 0 }: { value: unknown; depth?: number }): JSX.Element {
  if (value == null || value === '') return <span className="wb-muted">—</span>;
  if (typeof value === 'boolean') return <span>{value ? 'Yes' : 'No'}</span>;
  if (typeof value !== 'object') return <span>{String(value)}</span>;
  if (Array.isArray(value)) {
    if (!value.length) return <span className="wb-muted">None</span>;
    if (value.every((x) => x == null || typeof x !== 'object')) return <span>{value.join(', ')}</span>;
    return <ol className="wb-tree-list">{value.map((x, i) => <li key={i}><DataTree value={x} depth={depth + 1} /></li>)}</ol>;
  }
  const entries = Object.entries(value as Values);
  if (!entries.length) return <span className="wb-muted">—</span>;
  return (
    <dl className={`wb-kv${depth ? ' wb-kv--nested' : ''}`}>
      {entries.map(([k, v]) => <div className="wb-kv-row" key={k}><dt>{human(k)}</dt><dd><DataTree value={v} depth={depth + 1} /></dd></div>)}
    </dl>
  );
}

/* ============================================================ the record's progress tracker */
const STEP_WORDS: Record<string, string> = { completed: 'Done', active: 'Current step', pending: 'Not started', blocked: 'Needs attention', failed: 'Stopped', skipped: 'Not needed' };
export function ProgressTracker({ progress }: { progress: { title: string; statusLabel: string; steps: Step[] } }) {
  const steps = progress.steps;
  const counted = steps.filter((x) => x.state !== 'skipped').length;
  const done = steps.filter((x) => x.state === 'completed').length;
  const now = steps.findIndex((x) => x.state === 'active' || x.state === 'blocked' || x.state === 'failed');
  const cur = now >= 0 ? steps[now] : null;
  const finished = !cur && done === counted && counted > 0;
  const tone = cur ? (cur.state === 'failed' ? 'failed' : cur.state === 'blocked' ? 'blocked' : 'active') : finished ? 'done' : 'idle';
  return (
    <section className={`wbp wbp--${tone}`} aria-label={progress.title}>
      <div className="wbp-head">
        <div className="wbp-head-text"><span className="wbp-kicker">Progress</span><b>{progress.title}</b></div>
      </div>

      <ol className="wbp-steps">
        {steps.map((st, i) => {
          const here = i === now;
          return (
            <li key={st.key} className={`wbp-step is-${st.state}${here ? ' is-here' : ''}`} aria-current={here ? 'step' : undefined}>
              <span className="wbp-node" aria-hidden="true">
                {st.state === 'completed' ? <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m3.5 8.4 2.9 2.9 6.1-6.3" /></svg>
                  : st.state === 'failed' ? <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="m4.5 4.5 7 7m0-7-7 7" /></svg>
                  : st.state === 'blocked' ? <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M8 4v5M8 11.8v.2" /></svg>
                  : <span>{i + 1}</span>}
              </span>
              <div className="wbp-body">
                <span className="wbp-no">Step {i + 1}</span>
                <b className="wbp-title">{st.title}</b>
                <span className={`wbp-state wbp-state--${st.state}`}>{st.label && st.label !== STEP_WORDS[st.state] ? st.label : STEP_WORDS[st.state] || st.state}</span>
                {here ? <span className="wbp-here">You are here</span> : null}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="wbp-foot">
        <div className="wbp-legend" aria-hidden="true">
          <span><i className="wbp-lg wbp-lg--done" />Done</span><span><i className="wbp-lg wbp-lg--now" />Current step</span><span><i className="wbp-lg wbp-lg--todo" />Not started yet</span>
        </div>
        <p className="wbp-now">
          {cur ? <><b>Now:</b> {cur.title}{cur.label ? ` — ${cur.label}` : ''}.</> : finished ? <><b>All steps are done.</b> Nothing more is needed on this record.</> : <><b>{progress.statusLabel}.</b></>}
        </p>
      </div>
    </section>
  );
}

function RecordPage({ view, goto, toast, onChanged }: WbProps) {
  const [, code, idStr] = view.split(':');
  const id = Number(idStr);
  const [rec, setRec] = useState<RecordView | null>(null);
  const [err, setErr] = useState<ApiError | null>(null);
  const [dialog, setDialog] = useState<Action | null>(null);
  const [changedElsewhere, setChangedElsewhere] = useState(false);
  const [allActivity, setAllActivity] = useState(false);
  const shownVersion = useRef<number | null>(null);

  const load = useCallback(async (quiet = false) => {
    try {
      const r = await api<RecordView>(`/${code}/records/${id}`);
      if (quiet && shownVersion.current != null && r.version !== shownVersion.current) setChangedElsewhere(true);
      shownVersion.current = r.version;
      setRec(r); setErr(null);
    } catch (e) { if (!quiet) setErr(e as ApiError); }
  }, [code, id]);
  useEffect(() => { setRec(null); setChangedElsewhere(false); shownVersion.current = null; load(); }, [load]);
  usePoll(() => load(true), 15000, !dialog);

  if (err) return <><PageHead title="Record" desc="" /><Alert>{err.message} {err.status !== 404 ? <button className="btn btn-xs" type="button" onClick={() => load()}>Try again</button> : null} <button className="btn btn-xs" type="button" onClick={() => goto('approvals')}>Back to approvals</button></Alert></>;
  if (!rec) return <Loading />;

  const workflow = rec.actions.filter((a) => a.kind !== 'edit');
  const edit = rec.actions.find((a) => a.kind === 'edit');
  const d = rec.department;
  return (
    <>
      <div className="wb-back-row">
        <button className="btn btn-sm btn-ghost" type="button" onClick={() => history.length > 1 ? history.back() : goto('approvals')}><Svg name="chevLeft" /> Back</button>
        <span className="wb-muted">·</span>
        <button className="btn btn-sm btn-ghost" type="button" onClick={() => goto(`work:${d.code}`)}>All {d.short} records</button>
      </div>
      {changedElsewhere ? <Alert tone="info">This record was changed a moment ago, in the department office or another hub window. What you see is its current state.</Alert> : null}
      <section className="card wb-rec-head" style={{ ['--sys' as string]: deptColor(d.code, d.color) }}>
        <div className="wb-rec-top">
          <div>
            <div className="wb-kicker"><DeptBadge code={d.code} short={d.short} color={d.color} /> {rec.typeLabel}</div>
            <h1 className="wb-rec-title">{rec.title}</h1>
            <p className="wb-muted">{rec.subtitle}</p>
          </div>
          <div className="wb-rec-chips"><StatusPill status={rec.status} label={rec.statusLabel} /><ErpPill status={rec.erp && rec.erp.status} /></div>
        </div>
        <div className="wb-rec-meta">
          <span>Reference <b className="wb-mono">{rec.ref}</b></span>
          <span>Version <b>{rec.version}</b></span>
          <span>Created by <b>{rec.createdBy}</b> · {short(rec.createdAt)}</span>
          <span>Last change {short(rec.updatedAt)}</span>
          {rec.erp ? <span>{rec.erp.status === 'delivered' ? `Delivered to the ERP${rec.erp.latencyMs != null ? ` in ${rec.erp.latencyMs} ms` : ''}` : rec.erp.status === 'pending' ? `Waiting to reach the ERP${rec.erp.error ? `: ${rec.erp.error}` : ''}` : `The ERP refused it: ${rec.erp.error || ''}`}</span> : null}
        </div>
        {rec.progress ? <ProgressTracker progress={rec.progress} /> : null}
        <div className="wb-actions">
          {workflow.length ? <span className="wb-actions-label">Next step</span> : <span className="wb-actions-label">{rec.progress ? 'No decision is open in this status.' : 'This record has no workflow.'}</span>}
          {workflow.map((a) => (
            <button key={a.key} type="button" className={`btn btn-sm ${a.tone === 'danger' ? 'wb-btn-danger-soft' : a.tone === 'warning' ? 'wb-btn-warn-soft' : a.tone === 'neutral' ? '' : 'btn-primary'}`} onClick={() => setDialog(a)}>{a.label}</button>
          ))}
          <span className="wb-grow" />
          {edit ? <button type="button" className="btn btn-sm btn-soft" onClick={() => setDialog(edit)}><Svg name="file" /> Edit details</button> : null}
          <a className="btn btn-sm" href={officeLink(d.port, rec.id)} target="_blank" rel="noopener noreferrer"><Svg name="external" /> Open in the {d.short} office</a>
        </div>
      </section>

      <div className="grid g-2 wb-rec-grid">
        <section className="card">
          <div className="card-head"><div><div className="card-title">People on this record</div><div className="card-sub">As the department holds them; identity numbers masked.</div></div></div>
          {rec.parties.length ? (
            <div className="wb-parties">
              {rec.parties.map((p) => (
                <div className="wb-party" key={p.ref}>
                  <b>{p.name}</b>
                  <span>{human(p.label || p.role)}{p.relation ? ` · ${p.relation}` : ''}</span>
                  {Object.keys(p.identifiers || {}).length ? <span className="wb-mono">{Object.entries(p.identifiers).map(([k, v]) => `${human(k)} ${v}`).join(' · ')}</span> : null}
                  <span className="wb-muted wb-mono">{p.ref}</span>
                </div>
              ))}
            </div>
          ) : <p className="wb-muted">No person is linked.</p>}
        </section>
        <section className="card">
          <div className="card-head"><div><div className="card-title">Activity</div><div className="card-sub">Officers in the department and EkSetu, newest first.</div></div></div>
          {rec.activity.length ? (
            <>
            <p className="wb-muted wb-one">One record · {rec.activity.length} {rec.activity.length === 1 ? 'change' : 'changes'} by officers; the latest is first.</p>
            <ol className="wb-timeline">
              {(allActivity ? rec.activity : rec.activity.slice(0, 3)).map((a, i) => (
                <li key={i} className={a.officer.startsWith('erp-hub:') ? 'is-hub' : ''}>
                  <time>{short(a.at)}</time>
                  <span><b>{human(a.action.toLowerCase())}</b> by {a.officer.startsWith('erp-hub:') ? 'EkSetu' : a.officer}{a.details ? `: ${a.details.replace(/ \(via ERP Hub\)$/, '')}` : ''}</span>
                </li>
              ))}
            </ol>
            {rec.activity.length > 3 ? <button className="btn btn-sm btn-ghost wb-more" type="button" aria-expanded={allActivity} onClick={() => setAllActivity(!allActivity)}>{allActivity ? 'Show only the latest 3' : `Show all ${rec.activity.length} changes`}</button> : null}
            </>
          ) : <p className="wb-muted">Nobody has acted on this record yet.</p>}
        </section>
      </div>

      <section className="card wb-details">
        <div className="card-head"><div><div className="card-title">Details</div><div className="card-sub">The record as the {d.short} department stores it.</div></div></div>
        <DataTree value={rec.data} />
      </section>

      {rec.history.length ? (
        <section className="card">
          <div className="card-head"><div><div className="card-title">Status history</div></div></div>
          <ol className="wb-timeline wb-hist">{rec.history.slice().reverse().map((h, i) => {
            // the sentence that explains this status is the description of the workflow step with the same name
            const note = rec.progress ? (rec.progress.steps.find((x) => x.key === h.status) || {} as Partial<Step>).description : undefined;
            return <li key={i}><time>{h.at}</time><span><b>{human(h.status)}</b>{note ? <em className="wb-hist-note">{note}</em> : null}</span></li>;
          })}</ol>
        </section>
      ) : null}

      {dialog ? (
        <ActionDialog code={d.code} record={rec} action={dialog} toast={toast}
          onClose={() => setDialog(null)}
          onDone={(r) => {
            setDialog(null);
            if (r) { shownVersion.current = r.version; setRec(r); setChangedElsewhere(false); } else load();
            onChanged();
          }} />
      ) : null}
    </>
  );
}

/* ================================================================ mount */
export function WorkbenchViews(p: WbProps) {
  if (!isWorkbenchView(p.view)) return null;
  const body = p.view.startsWith('apply') ? <ApplyView {...p} />
    : p.view === 'approvals' ? <ApprovalsView {...p} />
      : p.view.startsWith('work') ? <RecordsView {...p} />
        : <RecordPage key={p.view} {...p} />;
  return <section className="view is-active wb" id={'view-' + p.view.replace(/:/g, '-')}>{body}</section>;
}
