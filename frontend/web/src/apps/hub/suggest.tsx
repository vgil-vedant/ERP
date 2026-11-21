/*
 * Suggestions while filling an application in the hub.
 *
 * Type an Aadhaar number, a mobile number or a name in a person's block (accused,
 * complainant, subject, visitor ...), or an FIR number or CNR in the case block,
 * and the records the five departments already hold are offered under the field.
 * Choosing one fills the block.
 *
 * The Aadhaar number comes first in every person's block: once a valid number is
 * typed, the one person it names is looked up and the block is filled at once,
 * without a choice to make. Typing another number replaces what was filled for the
 * previous one (fields changed by hand since are kept).
 *
 *   - An Aadhaar number names one person, so it is searched first and returns one.
 *   - An FIR number is unique only per police station and year: every match is
 *     listed, and the people named in the chosen case can be filled into any
 *     person block of the form.
 *
 * Every value goes through the form's own checks (checkField) before it is put in a
 * field; a value the form would refuse is left out and named. The department checks
 * everything again on submission, as for any typed value.
 *
 * Data: GET /api/workbench/suggest (services/hub-suggest.js), read-only.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Svg } from './lib';
import { DEPT_HUE, PORTAL_ICON } from './model';
import { applies, checkField } from './workbench';
import type { Field } from './workbench';

type Values = Record<string, unknown>;
interface SectionLike { title?: string; when?: Field['when']; fields: Field[] }

/* ================================================================ data */
export interface SgSource { code: string; short: string; ref: string; records?: number; roles?: string[]; type?: string; status?: string | null }
export interface SgPerson {
  key: string; name: string; father: string | null; gender: string | null; dob: string | null; age: number | null;
  mobile: string | null; aadhaar: string | null; aadhaarMasked: string | null; email: string | null; address: string | null;
  addressParts: Record<string, string> | null; district: string | null; sources: SgSource[];
}
export interface SgCase {
  key: string; firNo: string | null; station: string | null; stationName: string | null; district: string | null; date: string | null;
  offence: string | null; offenceOther: string | null; offenceTitle: string | null; cnr: string | null; court: string | null;
  sources: SgSource[]; parties: { roles: string[]; person: SgPerson }[];
}
export interface SgResult { people: SgPerson[]; cases: SgCase[]; unavailable: string[] }

/* ================================================================ which fields suggest */
export type Trigger = { kind: 'person'; prefix: string } | { kind: 'case' };

const SUFFIXES = ['aadhaar', 'mobile', 'name'] as const;
/** "New details" on an update request are changes, never filled from what is held. */
const NEVER_PREFIX = ['new_'];

/** Whether a field offers suggestions, and for which block. */
export function triggerOf(f: Field, names: Set<string>): Trigger | null {
  if (f.name === 'fir_no' || f.name === 'cnr') return { kind: 'case' };
  for (const sfx of SUFFIXES) {
    if (!f.name.endsWith(sfx)) continue;
    const prefix = f.name.slice(0, -sfx.length);
    if (prefix && !prefix.endsWith('_')) continue;
    if (NEVER_PREFIX.includes(prefix)) return null;
    if (sfx === 'aadhaar' && f.type === 'aadhaar') return { kind: 'person', prefix };
    if (sfx === 'mobile' && f.type === 'mobile') return { kind: 'person', prefix };
    // a name only when it is a person's name: the block also has a gender or an Aadhaar field
    if (sfx === 'name' && f.type === 'text' && (names.has(`${prefix}gender`) || names.has(`${prefix}aadhaar`))) return { kind: 'person', prefix };
  }
  return null;
}

const digits = (v: unknown) => String(v == null ? '' : v).replace(/[\s-]/g, '');
const VD = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
const VP = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
export const validAadhaar = (v: unknown) => {
  const d = digits(v);
  if (!/^[2-9]\d{11}$/.test(d)) return false;
  let c = 0; d.split('').reverse().forEach((x, i) => { c = VD[c][VP[i % 8][Number(x)]]; });
  return c === 0;
};
const validMobile = (v: unknown) => /^[6-9]\d{9}$/.test(digits(v).replace(/^\+?91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, ''));
const letters = (v: unknown) => String(v == null ? '' : v).replace(/[^A-Za-z]/g, '').length;

/**
 * The question to ask for a block, or null when nothing in it is complete enough.
 * Aadhaar first: a valid Aadhaar number is always sent and the server answers with
 * that one person; a mobile number or a name only narrows when no Aadhaar is given.
 */
export function queryFor(t: Trigger, values: Values): string | null {
  const q = new URLSearchParams();
  if (t.kind === 'person') {
    const a = values[`${t.prefix}aadhaar`], m = values[`${t.prefix}mobile`], n = values[`${t.prefix}name`];
    if (validAadhaar(a)) q.set('aadhaar', digits(a));
    if (validMobile(m)) q.set('mobile', digits(m));
    if (letters(n) >= 3) q.set('name', String(n).trim().slice(0, 100));
  } else {
    const fir = String(values.fir_no == null ? '' : values.fir_no).trim();
    const cnr = String(values.cnr == null ? '' : values.cnr).trim().toUpperCase();
    if (/^\d{1,5}\s*\/\s*\d{4}$/.test(fir) && Number(fir.split('/')[0]) > 0) q.set('fir', fir.replace(/\s+/g, ''));
    if (/^[A-Z]{4}\d{12}$/.test(cnr)) q.set('cnr', cnr);
    if (!q.toString()) return null;
    if (typeof values.police_station === 'string' && values.police_station) q.set('station', values.police_station);
  }
  const s = q.toString();
  return s || null;
}

/* ================================================================ filling */
function allFields(sections: SectionLike[]) {
  const out = new Map<string, { f: Field; s: SectionLike }>();
  sections.forEach((s) => s.fields.forEach((f) => out.set(f.name, { f, s })));
  return out;
}

export interface FillResult { values: Values; filled: string[]; skipped: string[]; names: string[] }

/**
 * Put the candidates into the fields that exist, each only if the form itself accepts
 * it; then undo any that ended up in a field that does not apply to the filled form.
 */
function fill(sections: SectionLike[], values: Values, cands: [string, unknown][]): FillResult {
  const byName = allFields(sections);
  const next: Values = { ...values };
  const set: string[] = [];
  const skipped: string[] = [];
  for (const [name, raw] of cands) {
    const hit = byName.get(name);
    if (!hit || raw == null || raw === '') continue;
    const { f } = hit;
    if (f.type === 'group' || f.type === 'checkbox' || f.type === 'checkboxes' || f.type === 'multiselect') continue;
    const v = typeof raw === 'number' ? String(raw) : raw;
    if (typeof v !== 'string') continue;
    if (checkField(f, v) !== null) { skipped.push(f.label); continue; }
    next[name] = v;
    set.push(name);
  }
  const kept = set.filter((name) => {
    const { f, s } = byName.get(name)!;
    if (applies(s.when, next) && applies(f.when, next)) return true;
    next[name] = values[name];
    return false;
  });
  return { values: next, filled: kept.map((n) => byName.get(n)!.f.label), skipped, names: kept };
}

/** Fill one person's block (fields named prefix + name, gender, aadhaar ...) from a suggestion. */
export function fillPerson(sections: SectionLike[], values: Values, prefix: string, p: SgPerson): FillResult {
  const at = (k: string) => `${prefix}${k}`;
  const a = p.addressParts || {};
  const cands: [string, unknown][] = [
    [at('name'), p.name], [at('father'), p.father], [at('gender'), p.gender], [at('dob'), p.dob],
    [at('age'), p.age], [at('mobile'), p.mobile], [at('aadhaar'), p.aadhaar], [at('email'), p.email], [at('address'), p.address],
  ];
  // the address in parts (the UIDAI enrolment form), only where the block has those fields
  for (const k of ['house', 'street', 'landmark', 'locality', 'vtc', 'po', 'pin', 'subdist', 'state']) cands.push([at(k), a[k]]);
  cands.push([at('district'), a.district || p.district]);
  return fill(sections, values, cands);
}

/** Fill the case block (FIR number, police station, dates, offence, CNR, court) from a suggestion. */
export function fillCase(sections: SectionLike[], values: Values, c: SgCase): FillResult {
  return fill(sections, values, [
    ['fir_no', c.firNo], ['police_station', c.station], ['fir_date', c.date], ['case_date', c.date],
    ['offence', c.offence], ['offence_other', c.offenceOther], ['cnr', c.cnr], ['court', c.court],
  ]);
}

/** The person blocks of a form, for "fill this person as …". */
export function personBlocks(sections: SectionLike[], values: Values): { prefix: string; title: string }[] {
  const names = new Set(sections.flatMap((s) => s.fields.map((f) => f.name)));
  const out: { prefix: string; title: string }[] = [];
  sections.forEach((s) => {
    if (!applies(s.when, values)) return;
    s.fields.forEach((f) => {
      if (!applies(f.when, values)) return;
      const t = triggerOf(f, names);
      if (t && t.kind === 'person' && f.name === `${t.prefix}name` && !out.some((b) => b.prefix === t.prefix)) out.push({ prefix: t.prefix, title: s.title || f.label });
    });
  });
  return out;
}

/* ================================================================ fetching */
const TTL_MS = 30_000;
const cache = new Map<string, { at: number; data: SgResult }>();
/** Forget every answer (tests, and nothing else, need this). */
export function clearSuggestCache() { cache.clear(); }
function remember(qs: string, data: SgResult) {
  cache.set(qs, { at: Date.now(), data });
  if (cache.size > 60) cache.delete(cache.keys().next().value as string);
}

interface SgState { qs: string; loading: boolean; data?: SgResult; error?: string }

/** Suggestions for a question, asked a moment after typing stops; the previous question is cancelled. */
function useSuggestions(qs: string | null): SgState | null {
  const [state, setState] = useState<SgState | null>(null);
  useEffect(() => {
    if (!qs) { setState(null); return undefined; }
    const hit = cache.get(qs);
    if (hit && Date.now() - hit.at < TTL_MS) { setState({ qs, loading: false, data: hit.data }); return undefined; }
    setState({ qs, loading: true });
    const ctl = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/workbench/suggest?${qs}`, { cache: 'no-store', credentials: 'same-origin', signal: ctl.signal });
        if (res.status === 401) throw new Error('Your session has ended, so suggestions are off. What you typed is kept.');
        let json: (SgResult & { error?: string }) | null = null;
        try { json = await res.json(); } catch { json = null; }
        if (!res.ok || !json || !Array.isArray(json.people) || !Array.isArray(json.cases)) throw new Error((json && json.error) || 'Suggestions are not available right now. You can keep typing.');
        const data: SgResult = { people: json.people, cases: json.cases, unavailable: Array.isArray(json.unavailable) ? json.unavailable : [] };
        remember(qs, data);
        setState({ qs, loading: false, data });
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        const msg = err instanceof TypeError ? 'Suggestions are not available right now. You can keep typing.' : (err as Error).message;
        setState({ qs, loading: false, error: msg });
      }
    }, 250);
    return () => { window.clearTimeout(timer); ctl.abort(); };
  }, [qs]);
  return state && state.qs === qs ? state : null;
}

/** The Aadhaar field of a person's block, which looks the person up as soon as it is complete. */
export function isAutoAadhaar(t: Trigger | null, f: Field): boolean {
  return !!t && t.kind === 'person' && f.type === 'aadhaar' && f.name === `${t.prefix}aadhaar`;
}

/**
 * The fields of a section with each person's Aadhaar number moved to the front of
 * their block (before the name), so it is typed first and fills the rest.
 */
export function aadhaarFirst(fields: Field[], names: Set<string>): Field[] {
  const out = fields.slice();
  for (const f of fields) {
    const t = triggerOf(f, names);
    if (!t || t.kind !== 'person' || !isAutoAadhaar(t, f)) continue;
    const at = out.indexOf(f), nameAt = out.findIndex((x) => x.name === `${t.prefix}name`);
    if (nameAt < 0 || at < nameAt) continue;
    out.splice(at, 1);
    out.splice(nameAt, 0, f);
  }
  return out;
}

/* ================================================================ the panel */
const maskMobile = (m: string | null) => (m ? `XXXXXX${m.slice(-4)}` : null);
const GENDER: Record<string, string> = { M: 'Male', F: 'Female', T: 'Transgender' };
const human = (s: string) => { const t = s.replace(/_/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); };

function personLine(p: SgPerson) {
  return [p.gender ? GENDER[p.gender] || p.gender : null, p.age != null ? `${p.age} yrs` : null, p.aadhaarMasked, maskMobile(p.mobile), p.father ? `C/O ${p.father}` : null]
    .filter(Boolean).join(' · ');
}

/* ---- where a record came from: the department's own icon and colour ---- */
const deptStyle = (code: string) => ({ ['--sys' as string]: DEPT_HUE[code] || '#0E9F6B' });
const uniqueSources = (sources: SgSource[]) => sources.filter((s, i, a) => a.findIndex((x) => x.code === s.code) === i);
/** The icons of the departments that hold a record, overlapped; the first is the one the Aadhaar or FIR number matched. */
function DeptStack({ sources }: { sources: SgSource[] }) {
  const list = uniqueSources(sources);
  const shown = list.slice(0, 3);
  return (
    <span className="sg-ics" aria-hidden="true" title={list.map((s) => s.short).join(', ')}>
      {shown.map((s) => <span key={s.code} className="sg-dept" style={deptStyle(s.code)}><Svg name={PORTAL_ICON[s.code] || 'file'} /></span>)}
      {list.length > shown.length ? <span className="sg-dept sg-dept--more">+{list.length - shown.length}</span> : null}
    </span>
  );
}
function SourceChips({ sources }: { sources: SgSource[] }) {
  return (
    <span className="sg-chips">
      {uniqueSources(sources).map((s) => (
        <span key={s.code} className="sg-chip" style={deptStyle(s.code)}><Svg name={PORTAL_ICON[s.code] || 'file'} />{s.short}</span>
      ))}
    </span>
  );
}
const Row = ({ k, v }: { k: string; v: ReactNode }) => (v == null || v === '' ? null : <div className="sg-kv"><dt>{k}</dt><dd>{v}</dd></div>);
function HeldBy({ sources }: { sources: SgSource[] }) {
  return (
    <div className="sg-held">
      <div className="sg-sec">Held by</div>
      {sources.map((s, i) => (
        <div className="sg-src-row" key={s.code + i} style={deptStyle(s.code)}>
          <span className="sg-dept"><Svg name={PORTAL_ICON[s.code] || 'file'} /></span>
          <span className="sg-src-main">
            <b>{s.short}</b>
            <span>{[s.ref ? `Ref ${s.ref}` : null, s.type ? human(s.type) : null, s.status ? human(s.status) : null, s.roles && s.roles.length ? s.roles.map(human).join(', ') : null, s.records && s.records > 1 ? `${s.records} records` : null].filter(Boolean).join(' · ')}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
/** Everything held about a person, shown when a suggestion is expanded. */
function PersonDetail({ p, onUse }: { p: SgPerson; onUse: () => void }) {
  return (
    <div className="sg-detail">
      <dl className="sg-kvs">
        <Row k="Name" v={p.name} />
        <Row k="Father / husband" v={p.father} />
        <Row k="Gender" v={p.gender ? GENDER[p.gender] || p.gender : null} />
        <Row k="Date of birth" v={p.dob} />
        <Row k="Age" v={p.age != null ? `${p.age} years` : null} />
        <Row k="Aadhaar" v={p.aadhaarMasked} />
        <Row k="Mobile" v={maskMobile(p.mobile)} />
        <Row k="Email" v={p.email} />
        <Row k="Address" v={p.address} />
        <Row k="District" v={p.district} />
      </dl>
      <HeldBy sources={p.sources} />
      <div className="sg-detail-foot"><button type="button" className="btn btn-xs btn-primary" onClick={onUse}>Use these details</button></div>
    </div>
  );
}
function CaseDetail({ c, onUse }: { c: SgCase; onUse: () => void }) {
  return (
    <div className="sg-detail">
      <dl className="sg-kvs">
        <Row k="FIR number" v={c.firNo} />
        <Row k="Police station" v={c.stationName} />
        <Row k="District" v={c.district} />
        <Row k="Date" v={c.date} />
        <Row k="Offence" v={c.offenceTitle} />
        <Row k="Court" v={c.court} />
        <Row k="CNR" v={c.cnr} />
      </dl>
      {c.parties.length ? (
        <div className="sg-held">
          <div className="sg-sec">People named</div>
          {c.parties.map(({ roles, person }) => (
            <div className="sg-src-row" key={person.key}>
              <DeptStack sources={person.sources} />
              <span className="sg-src-main"><b>{person.name}</b><span>{[roles.map(human).join(', '), personLine(person)].filter(Boolean).join(' · ')}</span></span>
            </div>
          ))}
        </div>
      ) : null}
      <HeldBy sources={c.sources} />
      <div className="sg-detail-foot"><button type="button" className="btn btn-xs btn-primary" onClick={onUse}>Use this case</button></div>
    </div>
  );
}

export interface SuggestFieldProps {
  trigger: Trigger; field: Field; sections: SectionLike[]; values: Values; setValues: (v: Values) => void;
  /** questions the user has closed or already used, per form */
  dismissed: Set<string>;
  /** renders the field itself, given the extra attributes its input needs and what goes under it */
  render: (aria: Record<string, unknown>, after: ReactNode) => ReactNode;
  disabled?: boolean;
}

/** One field that suggests: the field, and under it the matches for its block. */
export function SuggestField({ trigger, field, sections, values, setValues, dismissed, render, disabled }: SuggestFieldProps) {
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const [chosenCase, setChosenCase] = useState<SgCase | null>(null);
  const [filledFor, setFilledFor] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'warn' } | null>(null);
  const [alignRight, setAlignRight] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [, bump] = useState(0);
  const host = useRef<HTMLDivElement>(null);
  const qs = disabled ? null : queryFor(trigger, values);
  const listId = `sg-${field.name.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

  // the Aadhaar field of a person's block fills the block by itself (see the top of this file)
  const autoPrefix = isAutoAadhaar(trigger, field) && trigger.kind === 'person' ? trigger.prefix : null;
  const typedAadhaar = autoPrefix !== null && !disabled && validAadhaar(values[field.name]) ? digits(values[field.name]) : null;
  const autoKey = typedAadhaar ? `auto:${autoPrefix}:${typedAadhaar}` : null;
  const autoSt = useSuggestions(autoKey && !dismissed.has(autoKey) ? `aadhaar=${typedAadhaar}` : null);
  /** what the last automatic fill put in each field, and what was there before it */
  const autoFilled = useRef<Record<string, { before: unknown; after: unknown }>>({});
  // more than one person for an Aadhaar number is never expected; if it happens, the list is shown to choose from
  const autoHandles = !!typedAadhaar && !(autoSt && autoSt.data && autoSt.data.people.length > 1);
  const live = focused && !!qs && !dismissed.has(qs) && !chosenCase && !autoHandles;
  const st = useSuggestions(live ? qs : null);

  const people = st && st.data ? st.data.people : [];
  const cases = st && st.data ? st.data.cases : [];
  const items: { kind: 'person' | 'case'; p?: SgPerson; c?: SgCase }[] = trigger.kind === 'person'
    ? people.map((p) => ({ kind: 'person' as const, p }))
    : cases.map((c) => ({ kind: 'case' as const, c }));
  // an empty answer is worth saying only for an exact number, not while a name is being typed
  const exact = !!qs && /(^|&)(aadhaar|mobile|fir|cnr)=/.test(qs);
  const showEmpty = !!st && !st.loading && !st.error && !items.length && exact;
  const open = (live && !!st && (st.loading || !!st.error || items.length > 0 || showEmpty)) || !!chosenCase;

  useEffect(() => { setActive(-1); }, [qs]);
  useEffect(() => { if (!notice) return undefined; const t = window.setTimeout(() => setNotice(null), 7000); return () => window.clearTimeout(t); }, [notice]);
  // keep a wide panel inside the window when the field sits at the right edge
  useLayoutEffect(() => {
    if (!open || !host.current) return;
    const cell = host.current.querySelector<HTMLElement>('.wb-field');
    if (!cell) return;
    const r = cell.getBoundingClientRect();
    setAlignRight(r.left + Math.min(460, window.innerWidth - 32) > window.innerWidth - 16 && r.right > 460);
  }, [open]);

  const report = (r: FillResult, what: string) => {
    if (!r.filled.length) { setNotice({ text: `Nothing could be filled from ${what}: this form does not accept the values held.`, tone: 'warn' }); return; }
    const skipped = r.skipped.length ? ` Left for you to fill: ${r.skipped.join(', ')}.` : '';
    setNotice({ text: `Filled ${r.filled.length} field${r.filled.length === 1 ? '' : 's'} from ${what}. Check them before you submit.${skipped}`, tone: r.skipped.length ? 'warn' : 'ok' });
  };
  const closeQuestion = (q: string | null) => { if (q) dismissed.add(q); bump((n) => n + 1); };

  const pickPerson = (p: SgPerson, prefix: string) => {
    const r = fillPerson(sections, values, prefix, p);
    setValues(r.values);
    report(r, `${p.name}’s department records`);
    // the question the filled block now asks is answered: do not offer it again
    markAnswered(prefix, r.values);
    closeQuestion(queryFor({ kind: 'person', prefix }, r.values));
    return r;
  };
  /** A block filled from a person needs no automatic lookup of the same Aadhaar number. */
  const markAnswered = (prefix: string, v: Values) => {
    const a = v[`${prefix}aadhaar`];
    if (validAadhaar(a)) dismissed.add(`auto:${prefix}:${digits(a)}`);
  };

  // the automatic fill, once the lookup of a typed Aadhaar number has answered
  useEffect(() => {
    if (!autoKey || autoPrefix === null || !autoSt || autoSt.loading || autoSt.error || !autoSt.data || dismissed.has(autoKey)) return;
    const people = autoSt.data.people;
    if (people.length > 1) return;
    dismissed.add(autoKey);
    // undo what was filled for the previous number, except fields changed by hand since
    const base: Values = { ...values };
    const undone: string[] = [];
    Object.entries(autoFilled.current).forEach(([name, { before, after }]) => {
      if (name !== field.name && base[name] === after) { base[name] = before; undone.push(name); }
    });
    autoFilled.current = {};
    const p = people[0];
    if (!p || (p.aadhaar && digits(p.aadhaar) !== typedAadhaar)) {
      if (undone.length) setValues(base);
      setNotice({ text: `No department holds this Aadhaar number yet. Fill in the details by hand.${undone.length ? ' What was filled for the previous number has been cleared.' : ''}`, tone: 'warn' });
      return;
    }
    const r = fillPerson(sections, base, autoPrefix, p);
    r.names.forEach((name) => { if (name !== field.name) autoFilled.current[name] = { before: base[name], after: r.values[name] }; });
    setValues(r.values);
    const own = r.filled.filter((l) => l !== field.label);
    const skipped = r.skipped.length ? ` Left for you to fill: ${r.skipped.join(', ')}.` : '';
    setNotice(own.length
      ? { text: `${p.name}: filled ${own.length} field${own.length === 1 ? '' : 's'} from the department records for this Aadhaar number. Check them before you submit.${skipped}`, tone: r.skipped.length ? 'warn' : 'ok' }
      : { text: `Aadhaar number held by the departments for ${p.name}.${skipped}`, tone: r.skipped.length ? 'warn' : 'ok' });
    closeQuestion(queryFor({ kind: 'person', prefix: autoPrefix }, r.values));
  // values, sections and setValues are read as they are when the answer arrives
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoKey, autoSt]);
  const pickCase = (c: SgCase) => {
    const r = fillCase(sections, values, c);
    setValues(r.values);
    report(r, `FIR ${c.firNo || c.cnr || ''}`.trim());
    closeQuestion(qs);
    if (c.parties.length && personBlocks(sections, r.values).length) setChosenCase(c);
    else closeQuestion(queryFor({ kind: 'case' }, r.values));
  };
  const pick = (i: number) => {
    const it = items[i];
    if (!it) return;
    if (it.p && trigger.kind === 'person') pickPerson(it.p, trigger.prefix);
    if (it.c) pickCase(it.c);
  };
  const finishCase = () => { closeQuestion(queryFor({ kind: 'case' }, values)); setChosenCase(null); setFilledFor({}); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      e.preventDefault();
      if (chosenCase) finishCase(); else closeQuestion(qs);
      return;
    }
    if (!open || !items.length || chosenCase) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a <= 0 ? items.length - 1 : a - 1)); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(active); }
    else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && active >= 0 && items[active]) {
      const k = items[active].p ? items[active].p!.key : items[active].c!.key;
      e.preventDefault(); setExpanded((m) => ({ ...m, [k]: e.key === 'ArrowRight' }));
    }
  };

  let panel: ReactNode = null;
  if (open) {
    const unavailable = st && st.data && st.data.unavailable.length ? <div className="sg-note sg-note--warn">Not searched: {st.data.unavailable.join(', ')} could not be read.</div> : null;
    let body: ReactNode;
    if (chosenCase) {
      const blocks = personBlocks(sections, values);
      body = (
        <>
          <div className="sg-head"><span>People named in FIR {chosenCase.firNo}{chosenCase.stationName ? `, ${chosenCase.stationName}` : ''}</span>
            <button className="btn btn-xs" type="button" onClick={finishCase}>Done</button></div>
          <ul className="sg-list" aria-label="People in this case">
            {chosenCase.parties.map(({ roles, person }) => (
              <li className="sg-item sg-item--static" key={person.key}>
                <DeptStack sources={person.sources} />
                <span className="sg-main">
                  <span className="sg-name">{person.name} <span className="sg-role">{roles.join(', ')}</span></span>
                  <span className="sg-sub">{personLine(person) || 'No other particulars held'}</span>
                  <span className="sg-fill">
                    {blocks.map((b) => {
                      const done = filledFor[b.prefix] === person.key;
                      const hint = roles.some((r) => `${b.prefix} ${b.title}`.toLowerCase().includes(r.toLowerCase()));
                      return (
                        <button key={b.prefix} type="button" className={`btn btn-xs${hint && !done ? ' btn-soft' : ''}`} aria-pressed={done}
                          onClick={() => { pickPerson(person, b.prefix); setFilledFor((m) => ({ ...m, [b.prefix]: person.key })); }}>
                          {done ? <Svg name="check" /> : null}{done ? 'Filled as ' : 'Fill as '}{b.title}
                        </button>
                      );
                    })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      );
    } else if (st && st.error) {
      body = <div className="sg-note sg-note--warn" role="status">{st.error}</div>;
    } else if (st && st.loading && !items.length) {
      body = <div className="sg-note" role="status"><span className="wb-spinner wb-spinner--sm" aria-hidden="true" /> Searching the department records…</div>;
    } else if (showEmpty) {
      body = <div className="sg-note" role="status">{trigger.kind === 'person' ? 'No department holds a person with this number yet. Fill the form in by hand.' : 'No department holds this case yet. Fill the form in by hand.'}</div>;
    } else {
      const aadhaarHit = trigger.kind === 'person' && !!qs && qs.includes('aadhaar=');
      body = (
        <>
          <div className="sg-head"><span>{trigger.kind === 'person'
            ? (aadhaarHit ? 'Aadhaar match in the department records' : `${items.length} match${items.length === 1 ? '' : 'es'} in the department records`)
            : `${items.length} case${items.length === 1 ? '' : 's'} with this ${qs && qs.includes('fir=') ? 'FIR number' : 'CNR'}`}</span>
            <span className="sg-keys" aria-hidden="true">↑ ↓ Enter · Esc</span></div>
          <ul className={`sg-list${items.some((x) => expanded[x.p ? x.p.key : x.c!.key]) ? ' sg-list--tall' : ''}`} role="listbox" id={listId} aria-label="Suggestions">
            {items.map((it, i) => {
              const key = it.p ? it.p.key : it.c!.key;
              const isOpen = !!expanded[key];
              const toggle = () => setExpanded((m) => ({ ...m, [key]: !m[key] }));
              const sources = it.p ? it.p.sources : it.c!.sources;
              return (
                <li key={key} id={`${listId}-${i}`} role="option" aria-selected={i === active}
                  className={`sg-item${i === active ? ' is-active' : ''}${isOpen ? ' is-open' : ''}`} onMouseEnter={() => setActive(i)}
                  onClick={(e) => { if ((e.target as HTMLElement).closest('.sg-detail, .sg-more')) return; pick(i); }}>
                  <DeptStack sources={sources} />
                  {it.p ? (
                    <span className="sg-main">
                      <span className="sg-name">{it.p.name}</span>
                      <span className="sg-sub">{personLine(it.p)}</span>
                      <SourceChips sources={it.p.sources} />
                    </span>
                  ) : (
                    <span className="sg-main">
                      <span className="sg-name">FIR {it.c!.firNo || '—'}{it.c!.stationName ? ` · ${it.c!.stationName}` : ''}</span>
                      <span className="sg-sub">{[it.c!.offenceTitle, it.c!.date, it.c!.cnr ? `CNR ${it.c!.cnr}` : null].filter(Boolean).join(' · ')}</span>
                      {it.c!.parties.length ? <span className="sg-src">{it.c!.parties.map((x) => `${x.person.name} (${x.roles.join(', ')})`).join(', ')}</span> : null}
                      <SourceChips sources={it.c!.sources} />
                    </span>
                  )}
                  <button type="button" className="sg-more" aria-expanded={isOpen} aria-label={`${isOpen ? 'Hide' : 'Show'} all details`} title={isOpen ? 'Hide details' : 'Show all details'}
                    onClick={toggle}><Svg name="chevDown" /></button>
                  {isOpen ? (it.p ? <PersonDetail p={it.p} onUse={() => pick(i)} /> : <CaseDetail c={it.c!} onUse={() => pick(i)} />) : null}
                </li>
              );
            })}
          </ul>
          {st && st.loading ? <div className="sg-note" role="status">Updating…</div> : null}
        </>
      );
    }
    panel = (
      <div className={`sg-panel${alignRight ? ' sg-panel--right' : ''}`} onMouseDown={(e) => { if (!(e.target as HTMLElement).closest('button')) e.preventDefault(); }}>
        {body}
        {unavailable}
      </div>
    );
  }

  const autoNote = typedAadhaar && autoKey && !dismissed.has(autoKey) && autoSt
    ? (autoSt.loading
      ? <div className="sg-note sg-note--inline" role="status"><span className="wb-spinner wb-spinner--sm" aria-hidden="true" /> Looking up this Aadhaar number in the department records…</div>
      : autoSt.error ? <div className="sg-done sg-done--warn" role="status">{autoSt.error}</div> : null)
    : null;
  const after = (
    <>
      {autoNote}
      {panel}
      {notice ? <div className={`sg-done sg-done--${notice.tone}`} role="status" aria-live="polite">{notice.text}</div> : null}
    </>
  );
  const aria = {
    'aria-autocomplete': 'list', 'aria-expanded': open && !chosenCase && items.length > 0,
    'aria-controls': open && items.length ? listId : undefined,
    'aria-activedescendant': open && active >= 0 && items[active] ? `${listId}-${active}` : undefined,
  };
  return (
    <div ref={host} className="sg-host"
      onFocus={() => setFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) { setFocused(false); if (chosenCase) finishCase(); } }}
      onKeyDown={onKeyDown}>
      {render(aria, after)}
    </div>
  );
}
