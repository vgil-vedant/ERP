// A compact, expandable audit timeline: one pale parent row per subject (a person, a record) with a count of its events,
// which opens to list every event underneath. Used by Lookup audit and the Activity log.
import { useMemo, useState } from 'react';
import { Select } from './controls';
import { Svg, fmtDate, fmtTime, num, rel } from './lib';

export interface TlRow {
  /** unique within the list */
  id: string;
  /** the event's own sequence number, when the log has one */
  seq?: number | null;
  at: Date;
  /** the area the event belongs to (lookup, a department) and what kind of thing it concerns */
  module: string; sub?: string;
  action: string;
  detail: string; who?: string;
  /** what it concerns, shown at the far right */
  entity: string;
  /** events with the same group belong to one subject and are folded under one row */
  group: string;
}
export interface TlFilter { label: string; options: { value: string; label: string }[]; pick: (r: TlRow) => string }

/** The colour family of an action badge. */
export function actionTone(action: string): string {
  const a = action.toUpperCase();
  if (/(^|[^A-Z])(READ|OPEN|VIEW|REVEAL)/.test(a)) return 'read';
  if (/SEARCH|LOOKUP|FIND/.test(a)) return 'search';
  if (/DELET|REMOV|REJECT|REVOK|WITHDRAW/.test(a)) return 'delete';
  if (/CREAT|NEW|REGISTER|SUBMIT|ADD|APPROV|RECEIV|RECORD/.test(a)) return 'create';
  if (/UPDAT|EDIT|CHANGE|CORRECT|VERIF|RETRY|MOVE|DECID/.test(a)) return 'update';
  if (/LOGIN|LOGOUT|SIGN/.test(a)) return 'login';
  if (/EXPORT|DOWNLOAD|PRINT/.test(a)) return 'export';
  return 'other';
}
export const ActionBadge = ({ action }: { action: string }) => <span className={`tl-badge tl-badge--${actionTone(action)}`}>{action}</span>;

const when = (d: Date) => (
  <div className="tl-when"><b>{fmtDate(d)}</b><span>{fmtTime(d)} · {rel(d)}</span></div>
);

function Cells({ r, lead }: { r: TlRow; lead: React.ReactNode }) {
  return (
    <>
      <div className="tl-c tl-c-lead">{lead}</div>
      <div className="tl-c tl-c-when">{when(r.at)}</div>
      <div className="tl-c tl-c-mod"><b>{r.module}</b>{r.sub ? <span>{r.sub}</span> : null}</div>
      <div className="tl-c tl-c-act"><ActionBadge action={r.action} /></div>
      <div className="tl-c tl-c-det" title={r.detail + (r.who ? ' · by ' + r.who : '')}><span className="tl-det-t">{r.detail || '—'}</span>{r.who ? <span className="tl-who">by {r.who}</span> : null}</div>
      <div className="tl-c tl-c-ent"><span className="tl-ent">{r.entity || '—'}</span></div>
    </>
  );
}

export function AuditTimeline({ rows, noun, searchPlaceholder, filter, pageSize = 10, emptyText }: {
  rows: TlRow[]; noun: string; searchPlaceholder: string; filter?: TlFilter; pageSize?: number; emptyText?: string;
}) {
  const [q, setQ] = useState('');
  const [fv, setFv] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = rows
      .filter((r) => !t || [r.module, r.sub, r.action, r.detail, r.who, r.entity, r.seq == null ? '' : String(r.seq)].join(' ').toLowerCase().includes(t))
      .filter((r) => !filter || !fv || filter.pick(r) === fv)
      .slice().sort((a, b) => b.at.getTime() - a.at.getTime() || (b.seq || 0) - (a.seq || 0));
    const order: TlRow[][] = []; const by = new Map<string, TlRow[]>();
    list.forEach((r) => { let g = by.get(r.group); if (!g) { g = []; by.set(r.group, g); order.push(g); } g.push(r); });
    return { order, count: list.length };
  }, [rows, q, fv, filter]);

  const pages = Math.max(1, Math.ceil(groups.order.length / pageSize));
  const cur = Math.min(page, pages);
  const start = (cur - 1) * pageSize;
  const shown = groups.order.slice(start, start + pageSize);
  const seqText = (r: TlRow) => (r.seq == null ? null : <span className="tl-seq">#{r.seq}</span>);

  return (
    <div className="tl">
      <div className="tl-toolbar">
        <div className="tl-search">
          <Svg name="search" />
          <input type="search" placeholder={searchPlaceholder} aria-label={searchPlaceholder} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        {filter ? <Select ariaLabel={filter.label} placeholder={filter.label} clearable value={fv} onChange={(v) => { setFv(v); setPage(1); }} options={filter.options} /> : null}
      </div>

      <div className="tl-box">
        <div className="tl-head tl-grid" aria-hidden="true">
          <div className="tl-c tl-c-lead">Activity</div><div className="tl-c tl-c-when">Date</div><div className="tl-c tl-c-mod">Module</div>
          <div className="tl-c tl-c-act">Action</div><div className="tl-c tl-c-det">Details</div><div className="tl-c tl-c-ent">Entity</div>
        </div>

        {!shown.length ? (
          <div className="tl-empty"><Svg name="search" /><div>{emptyText || 'Nothing matches.'}</div></div>
        ) : shown.map((g) => {
          const top = g[0];
          if (g.length === 1) {
            return <div className="tl-row tl-grid tl-single" key={top.id}><Cells r={top} lead={<><span className="tl-dot" aria-hidden="true" />{seqText(top)}</>} /></div>;
          }
          const isOpen = !!open[top.group];
          const kidsId = 'tl-k-' + top.group.replace(/[^a-z0-9]+/gi, '-');
          const toggle = () => setOpen({ ...open, [top.group]: !isOpen });
          return (
            <section className={`tl-group${isOpen ? ' is-open' : ''}`} key={top.group}>
              <div className="tl-row tl-grid tl-parent" onClick={toggle}>
                <Cells r={top} lead={(
                  <>
                    <button type="button" className="tl-toggle" aria-expanded={isOpen} aria-controls={kidsId} aria-label={`${isOpen ? 'Hide' : 'Show'} all ${g.length} ${noun}s for ${top.entity || top.detail}`}
                      onClick={(e) => { e.stopPropagation(); toggle(); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                      <span>{g.length}</span>
                    </button>
                    {seqText(top)}
                  </>
                )} />
              </div>
              <div className="tl-kids" id={kidsId} role="group" aria-label={`${g.length} ${noun}s`}>
                <div className="tl-kids-in">
                  {g.map((r) => (
                    <div className="tl-row tl-grid tl-child" key={r.id}><Cells r={r} lead={<><span className="tl-dot" aria-hidden="true" />{seqText(r)}</>} /></div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <div className="pager">
        <div className="pager-info">{groups.order.length
          ? <>Showing <b>{num(start + 1)}–{num(Math.min(start + pageSize, groups.order.length))}</b> of <b>{num(groups.order.length)}</b>{groups.order.length !== groups.count ? <span className="pager-sub"> · {num(groups.count)} {noun}s in all</span> : null}</>
          : 'Nothing to show'}</div>
        <div className="pager-btns">
          <button className="pg" disabled={cur === 1} aria-label="Previous page" onClick={() => setPage(Math.max(1, cur - 1))}><Svg name="chevLeft" /></button>
          <span className="pager-sub" style={{ padding: '0 8px', alignSelf: 'center' }}>Page {cur} of {pages}</span>
          <button className="pg" disabled={cur === pages} aria-label="Next page" onClick={() => setPage(Math.min(pages, cur + 1))}><Svg name="arrowRight" /></button>
        </div>
      </div>
    </div>
  );
}
