// The department offices in the hub: the views behind Departments, Integration bus, Access & audit and Department Records.
// Data: GET /api/offices (D.OFFICES). Nothing here is invented; an empty list says so.
import { PageArt } from './illustrations';
import type { ArtKind } from './illustrations';
import type { ReactNode } from 'react';
import { Svg, fmtDateTime, fmtTime, num, rel } from './lib';
import { D, DEPT_HUE, PORTAL_ICON, hostPort, parseUtc, portalOrigin, sysName } from './model';
import { Sparkline } from './charts';
import type { Dash } from './model';
import { DataTable } from './DataTable';
import { AuditTimeline } from './timeline';
import type { TlRow } from './timeline';
import type { Column, TableCfg } from './DataTable';

export interface OfficeCtx {
  goto: (v: string) => void;
  retry: (code: string) => void;
  showDrawer: (kicker: string, title: string, body: ReactNode) => void;
  onExport: (name: string, csv: string, count: number) => void;
  retrying: string | null;
}

const mono = { fontFamily: 'var(--mono)' } as const;
const iso = (s?: string | null) => (s ? new Date(s) : null);
const when = (s?: string | null) => (s ? fmtDateTime(new Date(s)) : '—');
const whenUtc = (s?: string | null) => (s ? fmtDateTime(parseUtc(s)) : '—');
const color = (code: string) => DEPT_HUE[code] || D.SYS_COLOR[code] || '#87968F';
const depts = (): Dash[] => (D.OFFICES && D.OFFICES.departments) || [];
export const officeUrl = (port: number) => `${portalOrigin(port)}/office`;
export const portalUrl = (port: number) => `${portalOrigin(port)}/`;

export function DeptChip({ d }: { d: Dash }) {
  return <span className="sys-cell">{d.short}</span>;
}
function BusPill({ s }: { s: string }) {
  if (s === 'delivered') return <span className="pill pill-ok"><Svg name="check" />delivered</span>;
  if (s === 'rejected') return <span className="pill pill-danger"><Svg name="alert" />rejected</span>;
  if (s === 'pending') return <span className="pill pill-warn"><Svg name="refresh" />waiting</span>;
  return <span className="pill pill-neutral">—</span>;
}
function health(d: Dash): [string, string] {
  const i = d.integration;
  if (i.rejected) return ['pill-danger', 'rejected events'];
  if (i.pending) return ['pill-warn', 'events waiting'];
  return ['pill-ok', 'all delivered'];
}
const Head = ({ title, desc, actions, art }: { title: string; desc: ReactNode; actions?: ReactNode; art?: ArtKind }) => (
  <div className={`page-head${art ? ' has-art' : ''}`}><div><h1 className="page-title">{title}</h1><p className="page-desc">{desc}</p></div>{actions ? <div className="page-actions">{actions}</div> : null}{art ? <PageArt kind={art} /> : null}</div>
);
const Empty = ({ text }: { text: string }) => <div className="card"><div className="tbl-empty"><Svg name="info" /><div>{text}</div></div></div>;
const Note = ({ children }: { children: ReactNode }) => <div className="table-note"><Svg name="info" /><span>{children}</span></div>;
const Kpi = ({ icon, label, value, note, pill }: { icon: string; label: string; value: ReactNode; note: string; pill?: [string, string] }) => (
  <div className="card kpi">
    <div className="kpi-top"><span className="kpi-ic" aria-hidden="true"><Svg name={icon} /></span>{pill ? <span className={`pill ${pill[0]}`}>{pill[1]}</span> : null}</div>
    <div className="kpi-line"><div className="kpi-value">{value}</div><div className="kpi-label">{label}</div></div>
    <div className="kpi-foot kpi-foot--rule"><div className="kpi-note"><span>{note}</span></div></div>
  </div>
);
const Kv = ({ k, v, m }: { k: string; v: ReactNode; m?: boolean }) => <div className="kv-row"><span className="kv-k">{k}</span><span className={`kv-v${m ? ' mono' : ''}`}>{v}</span></div>;

/* --------------------------- Department Records --------------------------- */
interface RecRow { d: Dash; ref: string; type: string; typeLabel: string; title: string; subtitle: string; status: string; statusLabel: string; updatedAt: string; erp: string | null }
function allRecords(): RecRow[] { return depts().flatMap((d) => d.records.map((r: Dash) => ({ ...r, d }))); }

const openRec = (c: OfficeCtx) => (r: RecRow) => c.showDrawer('Department record', r.ref, (
    <>
      <div className="drawer-sec"><h4>Record</h4><div className="kv">
        <Kv k="Reference" v={r.ref} m /><Kv k="Department" v={r.d.title} /><Kv k="Type" v={r.typeLabel} /><Kv k="Record" v={r.title} /><Kv k="Parties" v={r.subtitle || '—'} />
        <Kv k="Status" v={r.statusLabel || r.status || '—'} /><Kv k="Last updated" v={`${whenUtc(r.updatedAt)} · ${rel(parseUtc(r.updatedAt))}`} />
      </div></div>
      <div className="drawer-sec"><h4>In the ERP</h4><div className="kv"><Kv k="Delivery" v={<BusPill s={r.erp || ''} />} /></div></div>
      <div className="drawer-sec"><h4>Open it</h4><div><a className="btn btn-sm" href={officeUrl(r.d.port)} target="_blank" rel="noopener">Open the {r.d.short} office <Svg name="external" /></a></div></div>
    </>));
function recColumns(): Column<RecRow>[] {
  return [
    { key: 'dept', label: 'Department', sortable: true, render: (r) => <DeptChip d={r.d} />, sortValue: (r) => r.d.short, csv: (r) => r.d.title },
    { key: 'ref', label: 'Reference', sortable: true, render: (r) => <><div className="mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>{r.ref}</div><div className="t-sub">{r.typeLabel}</div></>, sortValue: (r) => r.ref, csv: (r) => `${r.ref} (${r.typeLabel})` },
    { key: 'rec', label: 'Record', render: (r) => <><div className="t-main">{r.title}</div><div className="t-sub">{r.subtitle}</div></>, csv: (r) => r.title + ' — ' + r.subtitle },
    { key: 'status', label: 'Status', sortable: true, render: (r) => <span className="pill pill-mint">{r.statusLabel || r.status || '—'}</span>, sortValue: (r) => r.statusLabel || '', csv: (r) => r.statusLabel || r.status || '' },
    { key: 'erp', label: 'In the ERP', align: 'right', render: (r) => <BusPill s={r.erp || ''} />, csv: (r) => r.erp || '' },
    { key: 'at', label: 'Updated', sortable: true, nowrap: true, render: (r) => <><div className="t-main" style={{ fontWeight: 600 }}>{whenUtc(r.updatedAt).split(' · ')[0]}</div><div className="t-sub">{rel(parseUtc(r.updatedAt))}</div></>, sortValue: (r) => parseUtc(r.updatedAt).getTime(), csv: (r) => whenUtc(r.updatedAt) },
  ];
}

function RecordsView({ c }: { c: OfficeCtx }) {
  const rows = allRecords();
  const open = openRec(c);
  const cols = recColumns();
  const types = Array.from(new Set(rows.map((r) => r.typeLabel))).sort().map((v) => ({ value: v, label: v }));
  const cfg: TableCfg<RecRow> = {
    columns: cols, rows: () => allRecords(), searchPlaceholder: 'Search reference, person, department or status…',
    searchKeys: (r) => [r.ref, r.title, r.subtitle, r.d.title, r.typeLabel, r.statusLabel],
    filters: [
      { key: 'd', label: 'All departments', options: depts().map((d) => ({ value: d.code, label: d.short })), match: (r, v) => r.d.code === v },
      { key: 't', label: 'All record types', options: types, match: (r, v) => r.typeLabel === v },
      { key: 'e', label: 'Any delivery state', options: [{ value: 'delivered', label: 'Delivered' }, { value: 'pending', label: 'Waiting' }, { value: 'rejected', label: 'Rejected' }], match: (r, v) => r.erp === v },
    ],
    pageSize: 10, defaultSort: 'at', defaultDir: 'desc', onRow: open, exportName: 'department-records',
  };
  return (
    <>
      <Head art="departments" title="Department records" desc="What the five offices hold, newest first: each record, its status in the office, and whether the ERP has received it." />
      <div className="card">
        <div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="layers" /></span>Records in the offices</div><div className="card-sub">{num(rows.length)} records · latest {num(Math.max(...depts().map((d) => d.records.length), 0))} shown per department</div></div></div>
        <div className="table-host"><DataTable<RecRow> cfg={cfg} onExport={c.onExport} showExport={false} /></div>
      </div>
    </>
  );
}

/* ------------------------------ One department ---------------------------- */
function DeptView({ code, c }: { code: string; c: OfficeCtx }) {
  const d = depts().find((x) => x.code === code);
  if (!d) return <Empty text="This department's data could not be read." />;
  const i = d.integration, s = d.summary;
  const [cls, label] = health(d);
  const open = s.types.reduce((t: number, x: Dash) => t + (x.open || 0), 0);
  return (
    <>
      <Head art="dept" title={d.title} desc={<>{d.tagline} · portal <b>{d.name}</b> on <code style={mono}>{hostPort(d.code)}</code> · database <code style={mono}>{d.file}</code></>}
        actions={<>
          <a className="btn" href={portalUrl(d.port)} target="_blank" rel="noopener"><Svg name="external" /> Citizen portal</a>
          <a className="btn btn-primary" href={officeUrl(d.port)} target="_blank" rel="noopener"><Svg name="external" /> Open the office</a>
        </>} />
      <div className="grid g-kpi" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(215px,1fr))' }}>
        <Kpi icon="layers" label="Records" value={num(d.totalRecords)} note={`${num(s.createdThisWeek)} created in the last 7 days`} pill={['pill-mint', 'office']} />
        <Kpi icon="clock" label="Still open" value={num(open)} note="not yet in a final state" pill={['pill-neutral', 'workflow']} />
        <Kpi icon="users" label="People on file" value={num(s.people)} note="named in this office's records" pill={['pill-neutral', 'parties']} />
        <Kpi icon="sync" label="Integration bus" value={num(i.delivered)} note={`${num(i.pending)} waiting · ${num(i.rejected)} rejected`} pill={[cls, label]} />
      </div>
      <div className="grid g-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="file" /></span>Record types</div><div className="card-sub">Counts by status, as the workflow defines them.</div></div></div>
          <div className="def-list">
            {s.types.map((t: Dash) => (
              <div className="def-row" key={t.type}>
                <div className="def-key">{t.plural || t.label}<br /><span className="micro">{num(t.total)}{t.open != null ? ` · ${num(t.open)} open` : ''}</span></div>
                <div className="def-val" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {t.byStatus.map((b: Dash) => <span className="pill pill-neutral" key={String(b.status)}>{b.label} · {num(b.n)}</span>)}
                  {!t.byStatus.length && <span style={{ color: 'var(--text-3)' }}>No records yet</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 16, alignContent: 'start', minWidth: 0 }}>
        <div className="card">
          <div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="alert" /></span>Needs attention</div><div className="card-sub">Counts the office's own workflow flags.</div></div></div>
          <div className="def-list">
            {s.attention.map((a: Dash) => (
              <div className="def-row" key={a.status || a.label}><div className="def-key">{a.label}</div>
                <div className="def-val"><span className={`pill ${a.n ? (a.tone === 'warning' ? 'pill-warn' : 'pill-mint') : 'pill-neutral'}`}>{num(a.n)}</span></div></div>
            ))}
            {!s.attention.length && <div className="def-row"><div className="def-key">Nothing flagged</div><div className="def-val">The office has no items waiting for a decision.</div></div>}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="sync" /></span>Integration bus</div></div>
            <button className="btn btn-sm" type="button" disabled={c.retrying === d.code || !(i.pending || i.rejected)} onClick={() => c.retry(d.code)}><Svg name="refresh" /> {c.retrying === d.code ? 'Sending…' : 'Retry now'}</button></div>
          <div className="def-list">
            <div className="def-row"><div className="def-key">Target</div><div className="def-val"><code style={mono}>{i.target}</code></div></div>
            <div className="def-row"><div className="def-key">Last delivered</div><div className="def-val">{when(i.lastDeliveredAt)}</div></div>
            <div className="def-row"><div className="def-key">Median delivery time</div><div className="def-val">{i.medianLatencyMs == null ? '—' : `${num(i.medianLatencyMs)} ms`}</div></div>
            <div className="def-row"><div className="def-key">Last error</div><div className="def-val">{i.lastError || 'none'}</div></div>
          </div>
        </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="file" /></span>Recent records</div><div className="card-sub">Latest changes in this office.</div></div></div>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Record</th><th>Reference</th><th>Status</th><th className="col-right">In the ERP</th><th>Updated</th></tr></thead>
          <tbody>
            {s.recent.map((r: Dash) => (
              <tr key={r.ref}><td><div className="t-main">{r.title}</div><div className="t-sub">{r.subtitle}</div></td><td><div className="mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>{r.ref}</div><div className="t-sub">{r.typeLabel}</div></td>
                <td><span className="pill pill-mint">{r.statusLabel}</span></td><td className="col-right"><BusPill s={(r.erp && (r.erp.status || r.erp)) || ''} /></td><td className="nowrap">{rel(parseUtc(r.updatedAt))}</td></tr>
            ))}
            {!s.recent.length && <tr><td colSpan={5}><div className="tbl-empty">No records yet.</div></td></tr>}
          </tbody>
        </table></div>
        <div className="card-foot card-foot--end"><button className="btn btn-sm" type="button" onClick={() => c.goto('records')}>All department records <Svg name="arrowRight" /></button></div>
      </div>
      <div className="grid g-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="users" /></span>Officers</div><div className="card-sub">Who signs in to this office.</div></div></div>
          <div className="def-list">{d.officers.map((o: Dash) => (
            <div className="def-row" key={o.username}><div className="def-key"><code style={mono}>{o.username}</code></div><div className="def-val">{o.fullName}, {o.designation} · {o.office}<br /><span className="micro">last sign-in: {o.lastLoginAt ? whenUtc(o.lastLoginAt) : 'never'}</span></div></div>
          ))}</div>
          <div className="card-foot card-foot--end"><button className="btn btn-sm" type="button" onClick={() => c.goto('officers')}>All officers <Svg name="arrowRight" /></button></div>
        </div>
        <div className="card">
          <div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="pulse" /></span>Office activity</div><div className="card-sub">Append-only log of what officers did.</div></div></div>
          <div className="feed">{d.activity.slice(0, 6).map((a: Dash, k: number) => (
            <div className="feed-item" key={k}><span className="feed-dot"><Svg name="user" /></span><div className="feed-body"><div className="feed-line"><b>{a.action}</b>{a.ref ? <> · <code>{a.ref}</code></> : null}</div><div className="feed-meta"><span className="maker">{a.officer}</span><span className="sep" />{rel(parseUtc(a.at))}</div></div></div>
          ))}{!d.activity.length && <div className="tbl-empty">No activity yet.</div>}</div>
          <div className="card-foot card-foot--end"><button className="btn btn-sm" type="button" onClick={() => c.goto('activity')}>Activity log <Svg name="arrowRight" /></button></div>
        </div>
      </div>
    </>
  );
}

/* --------------------------- Event queue and failures --------------------- */
interface EvRow { d: Dash; id: string; recordRef: string; type: string; status: string; attempts: number; createdAt: string; deliveredAt: string | null; latencyMs: number | null; error: string | null }
const allEvents = (): EvRow[] => depts().flatMap((d) => d.events.map((e: Dash) => ({ ...e, d })));

function evColumns(): Column<EvRow>[] {
  return [
    { key: 'dept', label: 'Department', sortable: true, render: (r) => <DeptChip d={r.d} />, sortValue: (r) => r.d.short, csv: (r) => r.d.title },
    { key: 'ref', label: 'Record', sortable: true, render: (r) => <span className="mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>{r.recordRef}</span>, sortValue: (r) => r.recordRef, csv: (r) => r.recordRef },
    { key: 'event', label: 'Event', render: (r) => <><div className="mono">{r.type}</div><div className="t-sub">{r.id.slice(0, 8)}…</div></>, csv: (r) => r.type + ' ' + r.id },
    { key: 'status', label: 'State', sortable: true, render: (r) => <BusPill s={r.status} />, sortValue: (r) => r.status, csv: (r) => r.status },
    { key: 'att', label: 'Attempts', align: 'right', sortable: true, render: (r) => r.attempts, sortValue: (r) => r.attempts, csv: (r) => r.attempts },
    { key: 'at', label: 'Created', sortable: true, nowrap: true, render: (r) => <><div className="t-main" style={{ fontWeight: 600 }}>{fmtDateTime(new Date(r.createdAt)).split(' · ')[0]}</div><div className="t-sub">{fmtTime(new Date(r.createdAt))} · {rel(new Date(r.createdAt))}</div></>, sortValue: (r) => new Date(r.createdAt).getTime(), csv: (r) => when(r.createdAt) },
    { key: 'lat', label: 'Delivery time', align: 'right', render: (r) => (r.latencyMs == null ? <span style={{ color: 'var(--text-3)' }}>—</span> : `${num(r.latencyMs)} ms`), csv: (r) => r.latencyMs ?? '' },
    { key: 'err', label: 'Last error', render: (r) => (r.error ? <span style={{ color: 'var(--danger, #B0433D)', fontSize: '11.5px' }}>{r.error}</span> : <span style={{ color: 'var(--text-3)' }}>—</span>), csv: (r) => r.error || '' },
  ];
}
const statusFilter = { key: 's', label: 'Any state', options: [{ value: 'delivered', label: 'Delivered' }, { value: 'pending', label: 'Waiting' }, { value: 'rejected', label: 'Rejected' }], match: (r: EvRow, v: string) => r.status === v };
const deptFilter = () => ({ key: 'd', label: 'All departments', options: depts().map((d) => ({ value: d.code, label: d.short })), match: (r: EvRow, v: string) => r.d.code === v });

function QueueView({ c }: { c: OfficeCtx }) {
  const ev = allEvents();
  const open = (r: EvRow) => c.showDrawer('Bus event', r.id, (
    <div className="drawer-sec"><h4>Event</h4><div className="kv">
      <Kv k="Department" v={r.d.title} /><Kv k="Record" v={r.recordRef} m /><Kv k="Type" v={r.type} m /><Kv k="State" v={<BusPill s={r.status} />} /><Kv k="Attempts" v={r.attempts} />
      <Kv k="Created" v={when(r.createdAt)} /><Kv k="Delivered" v={when(r.deliveredAt)} /><Kv k="Delivery time" v={r.latencyMs == null ? '—' : `${num(r.latencyMs)} ms`} />{r.error ? <Kv k="Last error" v={r.error} m /> : null}
    </div></div>));
  const cfg: TableCfg<EvRow> = { columns: evColumns(), rows: allEvents, searchPlaceholder: 'Search record, event or department…', searchKeys: (r) => [r.recordRef, r.id, r.d.title, r.status, r.error],
    filters: [deptFilter(), statusFilter], pageSize: 10, defaultSort: 'at', defaultDir: 'desc', onRow: open, exportName: 'bus-events', emptyText: 'No events yet.' };
  const tot = depts().reduce((t, d) => ({ del: t.del + d.integration.delivered, pen: t.pen + d.integration.pending, rej: t.rej + d.integration.rejected }), { del: 0, pen: 0, rej: 0 });
  return (
    <>
      <Head art="queue" title="Event queue" desc="Every change an office makes becomes one event, written in the same transaction as the record, then sent to the ERP. This is that queue, newest first." />
      <div className="grid g-kpi">
        <Kpi icon="check" label="Delivered" value={num(tot.del)} note="accepted by the ERP" pill={['pill-ok', 'delivered']} />
        <Kpi icon="refresh" label="Waiting" value={num(tot.pen)} note="queued or being retried" pill={['pill-warn', 'waiting']} />
        <Kpi icon="alert" label="Rejected" value={num(tot.rej)} note="the ERP refused them" pill={['pill-danger', 'rejected']} />
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="sync" /></span>Events</div><div className="card-sub">{num(ev.length)} shown · latest {num(Math.max(...depts().map((d) => d.events.length), 0))} per department</div></div></div>
        <div className="table-host"><DataTable<EvRow> cfg={cfg} onExport={c.onExport} showExport={false} /></div>
        <Note>The bus is signed, retried with back-off and idempotent: sending an event twice never creates a second record in the ERP.</Note>
      </div>
    </>
  );
}

function FailuresView({ c }: { c: OfficeCtx }) {
  const list = depts();
  const bad = allEvents().filter((e) => e.status !== 'delivered');
  const cfg: TableCfg<EvRow> = { columns: evColumns(), rows: () => allEvents().filter((e) => e.status !== 'delivered'), searchPlaceholder: 'Search record or error…', searchKeys: (r) => [r.recordRef, r.d.title, r.error, r.status],
    filters: [deptFilter(), statusFilter], pageSize: 8, defaultSort: 'at', defaultDir: 'desc', exportName: 'bus-failures', emptyText: 'Nothing is waiting or rejected.' };
  return (
    <>
      <Head art="failures" title="Retries & failures" desc="Events that have not reached the ERP yet. A waiting event is retried automatically with back-off; Retry now sends a department's waiting and rejected events again at once." />
      <div className="grid g-2">
        {list.map((d) => {
          const i = d.integration; const [cls, label] = health(d);
          return (
            <div className="card" key={d.code}>
              <div className="card-head"><div><div className="card-title"><DeptChip d={d} /></div><div className="card-sub">{d.title}</div></div><span className={`pill ${cls}`}>{label}</span></div>
              <div className="def-list">
                <div className="def-row"><div className="def-key">Waiting / rejected</div><div className="def-val">{num(i.pending)} / {num(i.rejected)}</div></div>
                <div className="def-row"><div className="def-key">Oldest waiting</div><div className="def-val">{i.oldestPendingAt ? `${rel(new Date(i.oldestPendingAt))} (${when(i.oldestPendingAt)})` : '—'}</div></div>
                <div className="def-row"><div className="def-key">Last error</div><div className="def-val">{i.lastError || 'none'}</div></div>
              </div>
              <div style={{ padding: '4px 20px 16px', display: 'flex', gap: 8 }}>
                <button className="btn btn-sm btn-primary" type="button" disabled={c.retrying === d.code || !(i.pending || i.rejected)} onClick={() => c.retry(d.code)}><Svg name="refresh" /> {c.retrying === d.code ? 'Sending…' : 'Retry now'}</button>
                <button className="btn btn-sm" type="button" onClick={() => c.goto('dept:' + d.code)}>Department <Svg name="arrowRight" /></button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="alert" /></span>Not delivered</div><div className="card-sub">{num(bad.length)} event{bad.length === 1 ? '' : 's'}</div></div></div>
        <div className="table-host"><DataTable<EvRow> cfg={cfg} onExport={c.onExport} showExport={false} /></div>
      </div>
    </>
  );
}

/* ------------------------------ Reconciliation ---------------------------- */
function ReconView({ c }: { c: OfficeCtx }) {
  const list = depts();
  const srcs: Dash[] = (D.OFFICES && D.OFFICES.erp && D.OFFICES.erp.sources && D.OFFICES.erp.sources.sources) || [];
  return (
    <>
      <Head art="recon" title="Reconciliation" desc="Office against ERP: what each office holds, what its bus has delivered, and what the ERP says it received." />
      <div className="card">
        <div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="check" /></span>Office vs ERP</div><div className="card-sub">Per department</div></div></div>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Department</th><th className="col-right">Office records</th><th className="col-right">Events sent</th><th className="col-right">Delivered</th><th className="col-right">Not delivered</th><th className="col-right">ERP record entries</th><th>ERP last received</th><th>Result</th></tr></thead>
          <tbody>
            {list.map((d) => {
              const i = d.integration, s = srcs.find((x) => x.code === d.code);
              const sent = i.delivered + i.pending + i.rejected, undelivered = i.pending + i.rejected;
              let res: [string, string] = ['pill-ok', 'in sync'];
              if (!s) res = ['pill-neutral', 'ERP not read'];
              else if (undelivered) res = ['pill-warn', `${num(undelivered)} behind`];
              else if (s.records < d.totalRecords) res = ['pill-danger', 'missing in the ERP'];
              return (
                <tr key={d.code} className="clickable" onClick={() => c.goto('dept:' + d.code)}>
                  <td><DeptChip d={d} /></td><td className="col-right t-main">{num(d.totalRecords)}</td><td className="col-right">{num(sent)}</td><td className="col-right">{num(i.delivered)}</td>
                  <td className="col-right">{num(undelivered)}</td><td className="col-right">{s ? num(s.records) : '—'}</td><td className="nowrap">{s && s.lastReceivedAt ? rel(new Date(s.lastReceivedAt)) : '—'}</td><td><span className={`pill ${res[0]}`}>{res[1]}</span></td>
                </tr>
              );
            })}
            {!list.length && <tr><td colSpan={8}><div className="tbl-empty">The department data could not be read.</div></td></tr>}
          </tbody>
        </table></div>
        <Note>A record that names several people (an FIR with an accused and a complainant) is filed once per person in the ERP, so "ERP record entries" can exceed "Office records". It must never be lower once everything is delivered.</Note>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="inbox" /></span>Latest events the ERP received</div><div className="card-sub">From the ERP's own delivery log.</div></div></div>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Received</th><th>Department</th><th>Record type</th><th>Reference</th><th>Change</th><th>People</th></tr></thead>
          <tbody>
            {((D.OFFICES && D.OFFICES.erp && D.OFFICES.erp.recent) || []).slice(0, 12).map((r: Dash, k: number) => (
              <tr key={k}><td className="nowrap">{rel(new Date(r.receivedAt))}</td><td>{sysName(r.source)}</td><td className="mono">{r.type}</td><td className="mono">{r.ref}</td><td>{r.change}</td><td>{(r.subjects || []).map((p: Dash) => p.name).join(', ')}</td></tr>
            ))}
            {!((D.OFFICES && D.OFFICES.erp && D.OFFICES.erp.recent) || []).length && <tr><td colSpan={6}><div className="tbl-empty">The ERP has not reported any received events.</div></td></tr>}
          </tbody>
        </table></div>
      </div>
    </>
  );
}

/* ---------------------- Officers, lookup audit, activity ------------------ */
function OfficersView({ c }: { c: OfficeCtx }) {
  interface Row { d: Dash; username: string; fullName: string; designation: string; office: string; createdAt: string; lastLoginAt: string | null }
  const rows = (): Row[] => depts().flatMap((d) => d.officers.map((o: Dash) => ({ ...o, d })));
  const cfg: TableCfg<Row> = {
    columns: [
      { key: 'dept', label: 'Department', sortable: true, render: (r) => <DeptChip d={r.d} />, sortValue: (r) => r.d.short, csv: (r) => r.d.title },
      { key: 'user', label: 'User name', sortable: true, render: (r) => <span className="mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>{r.username}</span>, sortValue: (r) => r.username, csv: (r) => r.username },
      { key: 'name', label: 'Officer', sortable: true, render: (r) => <><div className="t-main">{r.fullName}</div><div className="t-sub">{r.designation}</div></>, sortValue: (r) => r.fullName, csv: (r) => `${r.fullName} (${r.designation})` },
      { key: 'office', label: 'Office', render: (r) => r.office, csv: (r) => r.office },
      { key: 'last', label: 'Last sign-in', sortable: true, nowrap: true, render: (r) => (r.lastLoginAt ? whenUtc(r.lastLoginAt) : <span style={{ color: 'var(--text-3)' }}>never</span>), sortValue: (r) => (r.lastLoginAt ? parseUtc(r.lastLoginAt).getTime() : 0), csv: (r) => r.lastLoginAt || '' },
      { key: 'created', label: 'Account created', nowrap: true, render: (r) => whenUtc(r.createdAt), csv: (r) => r.createdAt },
    ],
    rows, searchPlaceholder: 'Search user name, officer or office…', searchKeys: (r) => [r.username, r.fullName, r.designation, r.office, r.d.title],
    filters: [{ key: 'd', label: 'All departments', options: depts().map((d) => ({ value: d.code, label: d.short })), match: (r, v) => r.d.code === v }],
    pageSize: 10, defaultSort: 'dept', defaultDir: 'asc', exportName: 'officer-accounts',
  };
  return (
    <>
      <Head art="officers" title="Officer accounts" desc="Each department signs its own officers in, with its own accounts and session. Passwords are never shown; they are stored salted and hashed." />
      <div className="card">
        <div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="users" /></span>Officers</div><div className="card-sub">One sign-in per department office</div></div></div>
        <div className="table-host"><DataTable<Row> cfg={cfg} onExport={c.onExport} showExport={false} /></div>
      </div>
    </>
  );
}

function LookupAuditView({ c }: { c: OfficeCtx }) {
  // events about the same person (PSN-…) are folded under one row; searches and the like stand alone
  const rows: TlRow[] = D.AUDIT.filter((a) => a.entity === 'lookup').map((a) => {
    const person = /PSN-\d+/.exec(a.details || '');
    return { id: 'a' + a.id, seq: a.id, at: a.at, module: a.entity, sub: 'ERP audit log', action: a.action, detail: a.details, who: a.maker, entity: a.entityId, group: person ? 'p:' + person[0] : 'e:' + a.id };
  });
  const actions = Array.from(new Set(rows.map((r) => r.action))).sort().map((x) => ({ value: x, label: x }));
  return (
    <>
      <Head art="lookupaudit" title="Lookup audit" desc="Every person lookup, with who ran it. It is part of the ERP's append-only audit log." actions={<button className="btn" type="button" onClick={() => c.goto('lookup')}><Svg name="search" /> Person Lookup</button>} />
      <div className="card"><div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="search" /></span>Lookups</div><div className="card-sub">{num(rows.length)} recorded</div></div><span className="pill pill-mint">ERP audit_log</span></div>
        <div className="table-host"><AuditTimeline rows={rows} noun="lookup" searchPlaceholder="Search who, person or what was looked up…" filter={{ label: 'All actions', options: actions, pick: (r) => r.action }} pageSize={10} emptyText="No person lookup has been recorded yet." /></div></div>
    </>
  );
}

function ActivityView({ c: _c }: { c: OfficeCtx }) {
  void _c;
  // the actions on one record are folded under one row for that record
  const rows: TlRow[] = depts().flatMap((d) => (d.activity as Dash[]).map((a, i) => ({
    id: d.code + ':' + (a.id != null ? a.id : i + ':' + a.at), seq: a.id != null ? Number(a.id) : null, at: parseUtc(a.at), module: d.short as string, sub: 'office log',
    action: String(a.action), detail: a.details || '', who: a.officer as string, entity: (a.ref as string) || '',
    group: a.ref ? d.code + ':' + a.ref : 'e:' + d.code + ':' + (a.id != null ? a.id : i),
  })));
  return (
    <>
      <Head art="activity" title="Activity log" desc="What officers did in each office, newest first. Each office's log is append-only: the database refuses any change or deletion." />
      <div className="card"><div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="pulse" /></span>Office activity</div><div className="card-sub">Latest {num(Math.max(...depts().map((d) => d.activity.length), 0))} per department</div></div></div>
        <div className="table-host"><AuditTimeline rows={rows} noun="action" searchPlaceholder="Search officer, action, record or department…" filter={{ label: 'All departments', options: depts().map((d) => ({ value: d.short as string, label: d.short as string })), pick: (r) => r.module }} pageSize={10} emptyText="No office activity yet." /></div></div>
    </>
  );
}

/* -------------------- extras placed inside existing views ----------------- */
/* ------------------------------ dashboard --------------------------------- */
/** Figures the dashboard shows, all from the department offices. */
export function officeMetrics() {
  const list = depts();
  const per = list.map((d) => {
    const i = d.integration;
    return { d, code: d.code as string, name: d.short as string, records: d.totalRecords as number, delivered: i.delivered as number, pending: i.pending as number, rejected: i.rejected as number, open: ((d.summary.types || []) as Dash[]).reduce((t: number, x: Dash) => t + (x.open || 0), 0) as number, people: (d.summary.people ?? 0) as number };
  });
  const sum = (f: (x: (typeof per)[number]) => number) => per.reduce((t, x) => t + f(x), 0);
  const delivered = sum((x) => x.delivered), pending = sum((x) => x.pending), rejected = sum((x) => x.rejected);
  return { per, records: sum((x) => x.records), delivered, pending, rejected, events: delivered + pending + rejected };
}
export type OfficeMetrics = ReturnType<typeof officeMetrics>;

/** Records created / events not delivered per day over the last `span` days, summed over the five offices. */
export function officeDaily(span: number, code?: string): { d: Date; received: number; refused: number; people: number }[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (span - 1));
  const out = Array.from({ length: span }, (_, i) => ({ d: new Date(start.getFullYear(), start.getMonth(), start.getDate() + i), received: 0, refused: 0, people: 0 }));
  const put = (rows: { d: string; n: number }[] | undefined, key: 'received' | 'refused' | 'people') => (rows || []).forEach((r) => {
    const [y, m, dd] = String(r.d).split('-').map(Number);
    if (!y) return;
    const k = Math.round((new Date(y, m - 1, dd).getTime() - start.getTime()) / 86400000);
    if (k >= 0 && k < span) out[k][key] += r.n;
  });
  depts().filter((d) => !code || d.code === code).forEach((d) => { put(d.daily && d.daily.records, 'received'); put(d.daily && d.daily.undelivered, 'refused'); put(d.daily && d.daily.people, 'people'); });
  return out;
}

/** Dashboard: one card per department, in the same card design as the other KPIs. */
export function DeptKpis({ goto }: { goto: (v: string) => void }) {
  const m = officeMetrics();
  if (!m.per.length) return <div className="card" style={{ gridColumn: '1 / -1' }}><div className="tbl-empty"><Svg name="info" /><div>The department offices could not be read.</div></div></div>;
  return (
    <>{m.per.map((x) => {
      const spark = officeDaily(14, x.code).map((b) => b.received);
      return (
        <div className="card kpi kpi-dept kpi-dept--detail" key={x.code} role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => goto('dept:' + x.code)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goto('dept:' + x.code); } }}>
          <div className="dk-head">
            <span className="kpi-ic sys-tint" style={{ ['--sys' as string]: color(x.code) }} aria-hidden="true"><Svg name={PORTAL_ICON[x.code] || 'grid'} /></span>
            <div className="dk-name"><b>{x.d.short}</b><span title={x.d.title}>{x.d.title}</span></div>
          </div>
          <div className="kpi-value dk-count" style={{ fontSize: 22, display: 'flex', alignItems: 'baseline', gap: 6 }}>{num(x.records)}<span className="kpi-label" style={{ margin: 0 }}>Records</span></div>
          <div className="kpi-foot kpi-foot--rule dk-foot">
            <div className="dk-cap">{num(spark.reduce((t, v) => t + v, 0))} new in 14 days</div>
            <div className="kpi-spark"><Sparkline values={spark.some((v) => v) ? spark : [0]} color={color(x.code)} /></div>
          </div>
        </div>
      );
    })}</>
  );
}

/** Dashboard feed: the latest things officers did, across the five offices. */
export function OfficeFeed({ limit = 5 }: { limit?: number }) {
  const rows = depts().flatMap((d) => d.activity.map((a: Dash) => ({ ...a, d }))).sort((a, b) => parseUtc(b.at).getTime() - parseUtc(a.at).getTime()).slice(0, limit);
  if (!rows.length) return <div className="tbl-empty">No office activity yet.</div>;
  return (
    <>{rows.map((a, i) => (
      <div className="feed-item" key={i}><span className="feed-dot"><Svg name="user" /></span><div className="feed-body"><div className="feed-line"><b>{a.action}</b>{a.ref ? <> · <code>{a.ref}</code></> : null} · {a.d.short}</div><div className="feed-meta"><span className="maker">{a.officer}</span><span className="sep" />{rel(parseUtc(a.at))}</div></div></div>
    ))}</>
  );
}

/** Dashboard tables: newest department records, and the latest bus events. */
export function recentRecordsCfg(c: OfficeCtx): TableCfg<RecRow> {
  const cols = recColumns().filter((x) => x.key !== 'rec');
  return { columns: cols, rows: allRecords, searchPlaceholder: 'Search records…', searchKeys: (r) => [r.ref, r.title, r.subtitle, r.d.title], filters: [], pageSize: 6, defaultSort: 'at', defaultDir: 'desc', onRow: openRec(c), exportName: 'department-recent-records', emptyText: 'No department records yet.' };
}
export function recentEventsCfg(c: OfficeCtx): TableCfg<EvRow> {
  const cols = evColumns().filter((x) => ['dept', 'ref', 'status', 'at'].includes(x.key));
  const open = (r: EvRow) => c.showDrawer('Bus event', r.id, <div className="drawer-sec"><h4>Event</h4><div className="kv"><Kv k="Department" v={r.d.title} /><Kv k="Record" v={r.recordRef} m /><Kv k="Type" v={r.type} m /><Kv k="State" v={<BusPill s={r.status} />} /><Kv k="Attempts" v={r.attempts} />{r.error ? <Kv k="Last error" v={r.error} m /> : null}</div></div>);
  return { columns: cols, rows: allEvents, searchPlaceholder: 'Search events…', searchKeys: (r) => [r.recordRef, r.d.title, r.status], filters: [], pageSize: 6, defaultSort: 'at', defaultDir: 'desc', onRow: open, exportName: 'bus-recent-events', emptyText: 'No events yet.' };
}

/** System Overview: the flow the navigation follows. */
export function FlowDiagram() {
  const steps: [string, string, string][] = [
    ['grid', 'Citizen portals', 'Five replicas. One shared citizen sign-in; forms are written to the platform and the ERP together.'],
    ['user', 'Department offices', 'An office per portal at /office: its own officers, database, forms and workflow.'],
    ['sync', 'Integration bus', 'Each record change is one signed event, queued with the record, retried until the ERP accepts it.'],
    ['database', 'ERP', 'Files every record under every person it names. Append-only audit log.'],
    ['idcard', 'Person lookup', 'One identifier in, everything the five departments hold about that person out.'],
  ];
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="api" /></span>How the data flows</div><div className="card-sub">The side navigation follows these steps, left to right.</div></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, padding: '0 20px 20px' }}>
        {steps.map(([ic, t, d], i) => (
          <div key={t} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: 'var(--ink)' }}><span className="kpi-ic" style={{ width: 30, height: 30 }}><Svg name={ic} /></span>{i + 1}. {t}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 8, lineHeight: 1.5 }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** System Overview: the whole arrangement, as it runs today. */
export function OverviewBody({ hub, erp, ports }: { hub: string; erp: string; ports: ReactNode }) {
  const Node = ({ icon, title, sub, db }: { icon: string; title: ReactNode; sub: ReactNode; db?: boolean }) => (
    <div className={`node${db ? ' db' : ''}`}><span className="nd-ic"><Svg name={icon} /></span><div>{title}<small>{sub}</small></div></div>
  );
  const rows: [string, ReactNode][] = [
    ['Two services', 'The ERP and the platform service each run as their own process with their own SQLite files, and share nothing but HTTP. The platform service also holds the five department databases.'],
    ['One direction', 'The platform service and the offices call the ERP. The ERP never calls a portal or an office and never opens their databases.'],
    ['Citizen forms', 'A portal writes its row and the ERP intake together, or neither: a refusal rolls the portal back.'],
    ['Office records', 'A record and its event are saved in one transaction (transactional outbox). The integration bus then sends the event to the ERP: signed with HMAC-SHA256, oldest first, retried with back-off until the ERP accepts it. The ERP ignores an event id it has seen, so a retry never duplicates anything.'],
    ['Person lookup', 'One identifier in; the ERP answers from what the five departments have sent. A system that is down is shown as unavailable while the others still answer.'],
    ['Append-only audit', <>Database triggers reject every UPDATE and DELETE on <code>audit_log</code>.</>],
    ['Replicas', 'Five local demonstrations. No real government site is ever contacted, and no replica is presented as an official service.'],
  ];
  const where: [string, string][] = [
    ['frontend/web', 'React · TypeScript · Vite · Tailwind: this hub, the ERP console, the five portals (server-rendered) and the sign-in and account pages. EJS views remain as the fallback (UI_ENGINE=ejs).'],
    ['frontend/portals', 'The five portal replicas: views, styles and captured assets, one folder each.'],
    ['frontend/platform-hub · erp-console', 'Hub and console shells, styles and the EJS fallback views.'],
    ['frontend/shared', 'Person-lookup page and the department office UI, used by the hub, the console and the offices.'],
    ['backend/platform-api', 'Hub, five portal servers, shared sign-in, department offices (/office) and the integration bus. One process, one platform.sqlite plus one SQLite per office.'],
    ['backend/erp-api', 'ERP intake (/api/intake), event ingest (/api/ingest/events), person lookup (/api/lookup), console and the audit log.'],
    ['backend/shared', 'Portal rendering engine and the record catalogue, workflows and datasets shared by both services.'],
    ['database', 'SQLite schemas for the ERP and the platform, and the read-only PostgreSQL migration.'],
    ['docker · compose.yaml', 'Hardened stack: ERP_erp_api and ERP_platform_api, host ports 7xxx.'],
    ['tests · info/docs', 'End-to-end, lookup and department test suites; architecture, research and migration notes.'],
  ];
  return (
    <>
      <div className="arch" style={{ marginBottom: 16 }}>
        <div className="arch-col">
          <div className="arch-col-head">Platform service · one process</div>
          <Node icon="grid" title="Five citizen portals" sub="ePrisons · CCTNS · e-Forensics · UIDAI · eCourts" />
          <Node icon="user" title="Department offices" sub="/office on each portal · officers, forms, workflow" />
          <Node icon="sync" title="Integration bus" sub="outbox → signed batches → retry with back-off" />
          <Node icon="layers" title="Platform hub" sub={<>{hub} · this console</>} />
          <Node icon="database" db title="Databases" sub="platform.sqlite · one SQLite per office (record · outbox · activity)" />
        </div>
        <div className="arch-link">
          <span>POST /api/ingest/events</span><div className="arrow" /><span>ack · retry</span>
        </div>
        <div className="arch-col">
          <div className="arch-col-head">ERP service · record of truth</div>
          <Node icon="database" title="ERP API + console" sub={erp} />
          <Node icon="idcard" title="Person lookup" sub="/api/lookup · one identifier, all five departments" />
          <Node icon="database" db title="erp.sqlite" sub="source_system · citizen · intake · intake_field · lookup_record · audit_log" />
          <Node icon="database" db title="PostgreSQL" sub="read-only migration target" />
        </div>
      </div>
      <FlowDiagram />
      <div className="grid g-2">
        <div className="card">
          <div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="shield" /></span>Rules the system keeps</div><div className="card-sub">Taken from the code and the architecture notes.</div></div></div>
          <div className="def-list">{rows.map(([k, v]) => <div className="def-row" key={k}><div className="def-key">{k}</div><div className="def-val">{v}</div></div>)}</div>
        </div>
        <div className="card">
          <div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="api" /></span>Ports and entry points</div><div className="card-sub">Read live from the running hub and the registered portals.</div></div></div>
          <div className="tbl-wrap"><table className="tbl" style={{ minWidth: 0 }}><thead><tr><th>Port</th><th>Process</th><th>Scope</th></tr></thead><tbody>{ports}</tbody></table></div>
          <div className="table-note"><span>Each portal also answers at <code>/office</code>. Docker maps the same stack onto 7xxx ports; <code>PORT_OFFSET</code> shifts every portal port so a second instance can run alongside the first.</span></div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="book" /></span>What lives where</div><div className="card-sub">The project folders and their job.</div></div></div>
        <div className="def-list">{where.map(([k, v]) => <div className="def-row" key={k}><div className="def-key"><code>{k}</code></div><div className="def-val">{v}</div></div>)}</div>
      </div>
    </>
  );
}

/** Databases: the department databases next to the two existing ones. */
export function DepartmentDatabases() {
  const list = depts();
  if (!list.length) return null;
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-head"><div><div className="card-title"><span className="card-ic" aria-hidden="true"><Svg name="database" /></span>Department databases</div><div className="card-sub">One SQLite file per office, beside platform.sqlite.</div></div></div>
      <div className="tbl-wrap"><table className="tbl" style={{ minWidth: 0 }}>
        <thead><tr><th>File</th><th>Department</th><th className="col-right">Records</th><th className="col-right">Events</th><th className="col-right">People</th></tr></thead>
        <tbody>{list.map((d) => (
          <tr key={d.code}><td className="mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>{d.file}</td><td>{d.title}</td><td className="col-right t-main">{num(d.totalRecords)}</td><td className="col-right">{num(d.integration.delivered + d.integration.pending + d.integration.rejected)}</td><td className="col-right">{num(d.summary.people)}</td></tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

/* --------------------------------- entry ---------------------------------- */
export const OFFICE_VIEWS = ['records', 'queue', 'failures', 'recon', 'officers', 'lookupaudit', 'activity'];
export const isOfficeView = (v: string) => OFFICE_VIEWS.includes(v) || v.startsWith('dept:');

export function OfficeViews({ view, c }: { view: string; c: OfficeCtx }) {
  const offices = D.OFFICES;
  const body = (() => {
    if (!offices) return <Empty text="The department offices could not be read. Reload the page, or check that the platform service is running." />;
    if (view === 'records') return <RecordsView c={c} />;
    if (view.startsWith('dept:')) return <DeptView code={view.slice(5)} c={c} />;
    if (view === 'queue') return <QueueView c={c} />;
    if (view === 'failures') return <FailuresView c={c} />;
    if (view === 'recon') return <ReconView c={c} />;
    if (view === 'officers') return <OfficersView c={c} />;
    if (view === 'lookupaudit') return <LookupAuditView c={c} />;
    if (view === 'activity') return <ActivityView c={c} />;
    return null;
  })();
  return (
    <>
      {isOfficeView(view) && <section className="view is-active" id={'view-' + view.replace(':', '-')}>{body}</section>}
    </>
  );
}
void iso;
