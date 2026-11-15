// The seven table definitions of the hub (ported from defineTables in erp-hub.js).
import type { CSSProperties } from 'react';
import { Svg, fmtDate, fmtDateTime, fmtTime, num, rel } from './lib';
import type { Column, TableCfg } from './DataTable';
import { D, distinctForms, distinctOptions, inScope, sysName, sysOptions } from './model';
import type { Audit, Citizen, Days, Intake, Submission, Sync } from './model';

const mono: CSSProperties = {};
export function SysChip({ code }: { code: string }) {
  const s = D.SYS_MAP[code];
  return <span className="sys-cell"><span className="sys-dot" style={{ background: D.SYS_COLOR[code] || '#87968F' }} />{s ? s.short : code}</span>;
}
export function ResultPill({ r }: { r: string }) {
  if (r === 'pending') return <span className="pill pill-neutral"><Svg name="refresh" />pending</span>;
  if (r === 'kept' || r === 'committed') return <span className="pill pill-ok"><Svg name="check" />kept</span>;
  if (r === 'duplicate') return <span className="pill pill-info"><Svg name="refresh" />duplicate</span>;
  return <span className="pill pill-warn"><Svg name="alert" />rolled back</span>;
}
export function HttpPill({ code }: { code: number }) {
  if (!code) return <span className="pill pill-neutral" title="no HTTP status was recorded">—</span>;
  const ok = code === 200 || code === 201;
  return <span className={`pill ${ok ? 'pill-ok' : 'pill-danger'}`} style={{ fontFamily: 'var(--mono)', fontWeight: 700 }}>{code}</span>;
}
const dash = (t: string) => <span style={{ color: 'var(--text-3)', fontSize: '11.5px' }}>{t}</span>;
const when = (d: Date, sub: (d: Date) => string) => <><div className="t-main" style={{ fontWeight: 600 }}>{fmtDate(d)}</div><div className="t-sub">{sub(d)}</div></>;

const intakeColumns: Column<Intake>[] = [
  { key: 'ref', label: 'Intake reference', sortable: true, render: (r) => <div className="t-main mono" style={{ color: 'var(--ink)' }}>{r.intakeRef}</div>, sortValue: (r) => r.intakeRef, csv: (r) => r.intakeRef },
  { key: 'citizen', label: 'Citizen', sortable: true, render: (r) => <><div className="t-main">{r.citizen.fullName}</div><div className="t-sub">{r.citizen.ref}</div></>,
    sortValue: (r) => r.citizen.fullName, csv: (r) => r.citizen.fullName + ' (' + r.citizen.ref + ')' },
  { key: 'system', label: 'Source system', sortable: true, render: (r) => <SysChip code={r.system} />, sortValue: (r) => r.system, csv: (r) => sysName(r.system) },
  { key: 'form', label: 'Source form', sortable: true, render: (r) => <><div className="mono">{r.form}</div><div className="t-sub">{r.formLabel}</div></>, sortValue: (r) => r.form, csv: (r) => r.form },
  { key: 'source', label: 'Source reference', render: (r) => <span className="mono">{r.sourceReference}</span>, csv: (r) => r.sourceReference },
  { key: 'received', label: 'Received', sortable: true, nowrap: true, render: (r) => when(r.receivedAt, rel), sortValue: (r) => r.receivedAt.getTime(), csv: (r) => fmtDateTime(r.receivedAt) },
  { key: 'status', label: 'Status', align: 'right', render: () => <div className="row-actions"><span className="pill pill-ok"><Svg name="check" />received</span><button className="btn btn-xs" type="button">View</button></div>, csv: () => 'received' },
];
const atCol = (label: string, sub: (d: Date) => string): Column<Sync | Audit> => ({
  key: 'at', label, sortable: true, nowrap: true, render: (r) => when(r.at, sub), sortValue: (r) => r.at.getTime(), csv: (r) => fmtDateTime(r.at),
});
const timeSub = (d: Date) => fmtTime(d) + ' · ' + rel(d);

export interface Handlers { openRecord: (r: Intake) => void; openCitizen: (c: Citizen) => void; openSync: (s: Sync) => void; openAudit: (a: Audit) => void; days: Days }
export interface Tables {
  recent: TableCfg<Intake>; intake: TableCfg<Intake>; citizens: TableCfg<Citizen>; audit: TableCfg<Audit>; sync: TableCfg<Sync>; syncMini: TableCfg<Sync>; submissions: TableCfg<Submission>;
}

export function defineTables(h: Handlers, counts: Record<string, (n: number) => void>): Tables {
  const syncColumns: Column<Sync>[] = [
    atCol('Attempted at', timeSub) as Column<Sync>,
    { key: 'system', label: 'Source system', sortable: true, render: (r) => <SysChip code={r.system} />, sortValue: (r) => r.system, csv: (r) => sysName(r.system) },
    { key: 'sub', label: 'Submission ref', render: (r) => <span className="mono">{r.submission}</span>, csv: (r) => r.submission },
    { key: 'erp', label: 'ERP intake ref', render: (r) => (r.erpRef ? <span className="mono" style={{ color: 'var(--emerald-ink)' }}>{r.erpRef}</span> : dash('— not created')), csv: (r) => r.erpRef || '' },
    { key: 'http', label: 'HTTP', align: 'right', render: (r) => <HttpPill code={r.http} />, csv: (r) => r.http },
    { key: 'res', label: 'Result', align: 'right', render: (r) => <ResultPill r={r.result} />, csv: (r) => r.result },
  ];
  void mono;
  return {
    recent: {
      columns: intakeColumns, rows: () => D.INTAKES.slice().reverse().filter((r) => inScope(r.receivedAt, h.days)).slice(0, 60),
      searchPlaceholder: 'Search intake ref, citizen or source ref…',
      searchKeys: (r) => [r.intakeRef, r.citizen.fullName, r.citizen.ref, r.sourceReference, r.form, sysName(r.system)],
      filters: [{ key: 'system', label: 'All source systems', options: sysOptions, match: (r, v) => r.system === v }],
      pageSize: 6, defaultSort: 'received', defaultDir: 'desc', onRow: h.openRecord, exportName: 'erp-recent-records', emptyText: 'No records in this date range.',
    },
    intake: {
      columns: intakeColumns, rows: () => D.INTAKES.slice().reverse(), searchPlaceholder: 'Search intake ref, citizen, source form or reference…',
      searchKeys: (r) => [r.intakeRef, r.citizen.fullName, r.citizen.ref, r.citizen.email, r.sourceReference, r.form, sysName(r.system)],
      filters: [
        { key: 'system', label: 'All source systems', options: sysOptions, match: (r, v) => r.system === v },
        { key: 'form', label: 'All forms', options: distinctForms, match: (r, v) => r.form === v },
      ],
      pageSize: 8, defaultSort: 'received', defaultDir: 'desc', onRow: h.openRecord, exportName: 'erp-received-records',
      onCount: (n) => counts.intake(n),
    },
    citizens: {
      columns: [
        { key: 'ref', label: 'Citizen reference', sortable: true, render: (r) => <span className="mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>{r.ref}</span>, sortValue: (r) => r.ref, csv: (r) => r.ref },
        { key: 'name', label: 'Name', sortable: true, render: (r) => <div className="t-main">{r.fullName}</div>, sortValue: (r) => r.fullName, csv: (r) => r.fullName },
        { key: 'email', label: 'Email', render: (r) => <span className="mono">{r.email}</span>, csv: (r) => r.email },
        { key: 'mobile', label: 'Mobile', render: (r) => <span className="mono">{r.mobile}</span>, csv: (r) => r.mobile },
        { key: 'seen', label: 'First seen in', sortable: true, render: (r) => <SysChip code={r.firstSeenIn} />, sortValue: (r) => r.firstSeenIn, csv: (r) => sysName(r.firstSeenIn) },
        { key: 'records', label: 'Records', align: 'right', sortable: true, render: (r) => <span className="t-main">{num(r.records)}</span>, sortValue: (r) => r.records, csv: (r) => r.records },
      ],
      rows: () => D.CITIZENS, searchPlaceholder: 'Search name, citizen ref, email or mobile…', searchKeys: (r) => [r.ref, r.fullName, r.email, r.mobile],
      filters: [{ key: 'sys', label: 'All source systems', options: sysOptions, match: (r, v) => r.firstSeenIn === v }],
      pageSize: 8, defaultSort: 'records', defaultDir: 'desc', onRow: h.openCitizen, exportName: 'erp-citizens', onCount: (n) => counts.citizens(n),
    },
    audit: {
      columns: [
        { key: 'id', label: 'Event #', sortable: true, nowrap: true, render: (r) => <span className="mono" style={{ color: 'var(--text-2)' }}>#{r.id}</span>, sortValue: (r) => r.id, csv: (r) => r.id },
        { ...(atCol('Occurred at', timeSub) as Column<Audit>) },
        { key: 'entity', label: 'Entity', sortable: true, render: (r) => <><div className="t-main mono" style={{ color: 'var(--ink)' }}>{r.entity}</div><div className="t-sub mono">{r.entityId}</div></>, sortValue: (r) => r.entity, csv: (r) => r.entity + ' ' + r.entityId },
        { key: 'action', label: 'Action', sortable: true, render: (r) => <span className="pill pill-mint">{r.action}</span>, sortValue: (r) => r.action, csv: (r) => r.action },
        { key: 'maker', label: 'Maker', sortable: true, render: (r) => <span className="maker">{r.maker}</span>, sortValue: (r) => r.maker, csv: (r) => r.maker },
        { key: 'approver', label: 'Approver', sortable: true, render: (r) => (r.approver ? <span className="maker">{r.approver}</span> : dash('—')), sortValue: (r) => r.approver || '', csv: (r) => r.approver || '' },
        { key: 'details', label: 'Details', render: (r) => (r.details ? <span title={r.details} style={{ display: 'inline-block', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>{r.details}</span> : dash('—')), csv: (r) => r.details },
        { key: 'ref', label: 'Reference', render: (r) => <span className="mono">{r.ref}</span>, csv: (r) => r.ref },
      ],
      rows: () => D.AUDIT, searchPlaceholder: 'Search event #, entity, action, maker, approver, details or reference…',
      searchKeys: (r) => [String(r.id), r.entity, r.entityId, r.action, r.maker, r.approver, r.details, r.ref],
      filters: [
        { key: 'when', label: 'Any time', options: () => [{ value: 'today', label: 'Today' }, { value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }],
          match: (r, v) => { const age = Date.now() - r.at.getTime(); return v === 'today' ? r.at.toDateString() === new Date().toDateString() : age <= Number(v) * 86400000; } },
        { key: 'entity', label: 'All entities', options: () => distinctOptions(D.AUDIT as unknown as Record<string, unknown>[], 'entity'), match: (r, v) => r.entity === v },
        { key: 'action', label: 'All actions', options: () => distinctOptions(D.AUDIT as unknown as Record<string, unknown>[], 'action'), match: (r, v) => r.action === v },
        { key: 'maker', label: 'All makers', options: () => distinctOptions(D.AUDIT as unknown as Record<string, unknown>[], 'maker'), match: (r, v) => r.maker === v },
      ],
      pageSize: 15, defaultSort: 'at', defaultDir: 'desc', onRow: h.openAudit, exportName: 'erp-audit-trail', onCount: (n) => counts.audit(n),
    },
    sync: {
      columns: syncColumns, rows: () => D.SYNC, searchPlaceholder: 'Search submission ref, intake ref or system…',
      searchKeys: (r) => [r.submission, r.erpRef, r.system, String(r.http), r.result],
      filters: [
        { key: 'result', label: 'All results', options: [{ value: 'kept', label: 'Kept (201)' }, { value: 'duplicate', label: 'Duplicate (200)' }, { value: 'rolled_back', label: 'Rolled back' }], match: (r, v) => r.result === v },
        { key: 'system', label: 'All source systems', options: sysOptions, match: (r, v) => r.system === v },
      ],
      pageSize: 10, defaultSort: 'at', defaultDir: 'desc', onRow: h.openSync, exportName: 'erp-sync-ledger', onCount: (n) => counts.sync(n),
    },
    syncMini: {
      columns: [
        { key: 'at', label: 'When', sortable: true, nowrap: true, render: (r) => <><div className="t-main" style={{ fontWeight: 600 }}>{rel(r.at)}</div><div className="t-sub">{fmtTime(r.at)}</div></>, sortValue: (r) => r.at.getTime(), csv: (r) => fmtDateTime(r.at) },
        { key: 'system', label: 'Source', render: (r) => <SysChip code={r.system} />, csv: (r) => sysName(r.system) },
        { key: 'sub', label: 'Submission', render: (r) => <span className="mono">{r.submission}</span>, csv: (r) => r.submission },
        { key: 'erp', label: 'ERP intake', render: (r) => (r.erpRef ? <span className="mono">{r.erpRef}</span> : dash('—')), csv: (r) => r.erpRef || '' },
        { key: 'http', label: 'HTTP', align: 'right', render: (r) => <HttpPill code={r.http} />, csv: (r) => r.http },
      ],
      rows: () => D.SYNC.filter((s) => inScope(s.at, h.days)), searchPlaceholder: 'Search refs…', searchKeys: (r) => [r.submission, r.erpRef, r.system],
      filters: [], pageSize: 6, defaultSort: 'at', defaultDir: 'desc', onRow: h.openSync, exportName: 'erp-sync-recent',
    },
    submissions: {
      columns: [
        { key: 'ref', label: 'Submission ref', sortable: true, render: (r) => <span className="mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>{r.ref}</span>, sortValue: (r) => r.ref, csv: (r) => r.ref },
        { key: 'system', label: 'Portal', sortable: true, render: (r) => <SysChip code={r.system} />, sortValue: (r) => r.system, csv: (r) => sysName(r.system) },
        { key: 'person', label: 'Person', render: (r) => <div className="t-main">{r.person}</div>, csv: (r) => r.person },
        { key: 'erp', label: 'ERP intake ref', render: (r) => (r.erpRef ? <span className="mono" style={{ color: 'var(--emerald-ink)' }}>{r.erpRef}</span> : dash('— not mirrored')), csv: (r) => r.erpRef || '' },
        { key: 'at', label: 'Submitted', sortable: true, nowrap: true, render: (r) => when(r.at, rel), sortValue: (r) => r.at.getTime(), csv: (r) => fmtDateTime(r.at) },
        { key: 'status', label: 'Status', align: 'right', render: (r) => <ResultPill r={r.status} />, csv: (r) => r.status },
      ],
      rows: () => D.SUBMISSIONS, searchPlaceholder: 'Search submission ref, portal or person…', searchKeys: (r) => [r.ref, r.system, r.person, r.erpRef],
      filters: [{ key: 'status', label: 'All statuses', options: [{ value: 'committed', label: 'Committed' }, { value: 'pending', label: 'Pending' }, { value: 'rolled_back', label: 'Rolled back' }], match: (r, v) => r.status === v }],
      pageSize: 10, defaultSort: 'at', defaultDir: 'desc', exportName: 'platform-submissions', onCount: (n) => counts.submissions(n),
    },
  };
}
