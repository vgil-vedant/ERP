// Detail panels of the console: the same fields as the old pop-ups, rendered as React (values are escaped by React).
import type { ReactNode } from 'react';

const codeStyle = (size: string) => ({ fontFamily: 'var(--mono)', fontSize: size });
const Row = ({ k, children }: { k: string; children: ReactNode }) => <div className="kv-row"><div className="kv-key">{k}</div><div className="kv-val">{children}</div></div>;
const Code = ({ v, size = '11.5px' }: { v: ReactNode; size?: string }) => <code style={codeStyle(size)}>{v}</code>;
const Fields = ({ fields }: { fields: { label?: string; name: string; value: unknown }[] }) => (fields.length ? (
  <div><div className="drawer-section-title">Field values ({fields.length})</div><div className="kv-list">
    {fields.map((f, i) => <Row key={i} k={f.label || f.name}>{f.value == null ? '—' : String(f.value)}</Row>)}
  </div></div>
) : null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Drawer({ kind, row: r }: { kind: string; row: any }) {
  const fields = r.fields || [];
  if (kind === 'dashboard') return (
    <><div><div className="drawer-section-title">Record</div><div className="kv-list">
      <Row k="ERP Ref"><Code v={r.intake_ref || '—'} /></Row><Row k="Source system">{r.source_system || '—'}</Row><Row k="Form">{r.subject || r.source_form || '—'}</Row>
      <Row k="Portal ref"><Code v={r.source_reference || '—'} /></Row><Row k="Citizen">{r.full_name || '—'}</Row><Row k="Received at">{r.received_at || '—'}</Row>
    </div></div><Fields fields={fields} /></>
  );
  if (kind === 'intake') return (
    <><div><div className="drawer-section-title">Intake record</div><div className="kv-list">
      <Row k="ERP Ref"><Code v={r.intake_ref || '—'} /></Row><Row k="Source system"><span className="sys-chip">{r.source_system || '—'}</span></Row><Row k="Form">{r.subject || r.source_form || '—'}</Row>
      {r.source_route && <Row k="Route"><Code v={r.source_route} size="11px" /></Row>}
      <Row k="Portal ref"><Code v={r.source_reference || '—'} /></Row>
      <Row k="Citizen">{r.full_name || '—'}{r.email ? <><br /><span style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{r.email}</span></> : null}</Row>
      <Row k="Received at">{r.received_at || '—'}</Row>
    </div></div><Fields fields={fields} /></>
  );
  if (kind === 'citizens') {
    const list: string[] = r.systems ? r.systems.split(',') : [];
    return (
      <><div><div className="drawer-section-title">Citizen</div><div className="kv-list">
        <Row k="Citizen ref"><Code v={r.citizen_ref || '—'} /></Row><Row k="Full name"><strong>{r.full_name || '—'}</strong></Row><Row k="Email">{r.email || '—'}</Row><Row k="Mobile">{r.mobile || '—'}</Row>
        <Row k="First seen in"><span className="sys-chip">{r.first_seen_in || '—'}</span></Row><Row k="Registered on">{r.registered_on || '—'}</Row><Row k="Record count"><strong>{r.intake_count || 0}</strong></Row>
      </div></div>
      {list.length ? <div><div className="drawer-section-title">Portals used</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 0' }}>{list.map((s) => <span className="sys-chip" key={s}>{s}</span>)}</div></div> : null}</>
    );
  }
  if (kind === 'portals') return (
    <div><div className="kv-list">
      <Row k="ERP Ref"><Code v={r.intake_ref} /></Row><Row k="Source">{r.source_system}</Row><Row k="Form">{r.subject || r.source_form}</Row><Row k="Portal ref"><Code v={r.source_reference} /></Row>
      <Row k="Citizen">{r.full_name || '—'}</Row><Row k="Received">{r.received_at}</Row>
    </div></div>
  );
  if (kind === 'sync') return (
    <div className="kv-list">
      <Row k="Portal">{r.site_label || r.site_code || '—'}</Row><Row k="Entity">{r.entity || '—'}</Row><Row k="Submission ref"><Code v={r.local_ref || '—'} /></Row>
      <Row k="ERP intake ref"><Code v={r.erp_ref || '—'} /></Row><Row k="HTTP status">{r.http_status || '—'}</Row><Row k="Result">{r.status || '—'}</Row>
      <Row k="Attempted at">{r.attempted_at || '—'}</Row>{r.message ? <Row k="Message">{r.message}</Row> : null}
    </div>
  );
  return null;
}
