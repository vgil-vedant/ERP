// A log table whose rows are grouped by subject: one expandable row per person / record / entity, with a count chip,
// the kinds of action and the latest event; it opens to list every event with the full columns underneath.
// Used by the Audit Trail, the Lookup audit and the Activity log.
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Select } from './controls';
import { Svg, fmtDate, fmtTime, num, rel } from './lib';
import { ActionBadge } from './timeline';

export interface GRow {
  id: string; seq?: number | null; at: Date;
  /** events with the same group fold under one row */
  group: string;
  /** who or what the event concerns, drawn as a label; `subjectText` is its plain text for search */
  subject: ReactNode; subjectText: string;
  action: string; detail: string; who: string; extra?: string;
  /** values the filters read (entity, department, …) */
  meta?: Record<string, string>;
  search: string; open?: () => void;
}
export interface GFilter { label: string; options: { value: string; label: string }[]; match: (r: GRow, v: string) => boolean }
interface Group { key: string; events: GRow[] }

const plural = (n: number, one: string) => `${num(n)} ${n === 1 ? one : one + 's'}`;
const stamp = (d: Date) => (
  <><div className="t-main" style={{ fontWeight: 600 }}>{fmtDate(d)}</div><div className="t-sub">{fmtTime(d)} · {rel(d)}</div></>
);

export function GroupTable({ rows, filters = [], subjectLabel, searchPlaceholder, noun, emptyText, onCount, pageSize = 10 }: {
  rows: GRow[]; filters?: GFilter[]; subjectLabel: string; searchPlaceholder: string; noun: string; emptyText?: string; onCount?: (n: number) => void; pageSize?: number;
}) {
  const [q, setQ] = useState('');
  const [fv, setFv] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = rows
      .filter((r) => !t || r.search.toLowerCase().includes(t))
      .filter((r) => filters.every((f) => !fv[f.label] || f.match(r, fv[f.label])))
      .slice().sort((a, b) => b.at.getTime() - a.at.getTime() || (b.seq || 0) - (a.seq || 0));
    const order: Group[] = []; const by = new Map<string, Group>();
    list.forEach((r) => {
      let g = by.get(r.group);
      if (!g) { g = { key: r.group, events: [] }; by.set(r.group, g); order.push(g); }
      g.events.push(r);
    });
    return { order, count: list.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, fv]);
  useEffect(() => { if (onCount) onCount(groups.count); }, [groups.count]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasOpen = rows.some((r) => r.open);
  const cols = 6 + (hasOpen ? 1 : 0);
  const pages = Math.max(1, Math.ceil(groups.order.length / pageSize));
  const cur = Math.min(page, pages);
  const start = (cur - 1) * pageSize;
  const shown = groups.order.slice(start, start + pageSize);
  const reset = () => setPage(1);

  const eventRow = (e: GRow, key: string, cls: string) => (
    <tr key={key} className={`${cls}${e.open ? ' clickable' : ''}`} onClick={e.open ? (ev) => { if ((ev.target as HTMLElement).closest('[data-stop]')) return; e.open!(); } : undefined}>
      <td className="nowrap">{stamp(e.at)}</td>
      <td>{cls.includes('gt-child') ? <span className="gt-same">same as above</span> : e.subject}</td>
      <td><ActionBadge action={e.action} /></td>
      <td className="wrap"><div className="t-main au-detail">{e.detail || 'No details were recorded.'}</div>{e.extra ? <div className="t-sub">{e.extra}</div> : null}</td>
      <td><span className="au-who">{e.who}</span></td>
      <td className="nowrap"><span className="au-no">{e.seq != null ? '#' + e.seq : '—'}</span></td>
      {hasOpen ? <td className="col-right"><button className="btn btn-xs btn-ghost" type="button" data-stop onClick={e.open}>Open<Svg name="arrowRight" /></button></td> : null}
    </tr>
  );

  return (
    <div className="gt">
      <div className="af-toolbar">
        <div className="tl-search">
          <Svg name="search" />
          <input type="search" placeholder={searchPlaceholder} aria-label={searchPlaceholder} value={q} onChange={(e) => { setQ(e.target.value); reset(); }} />
        </div>
        {filters.length ? (
          <div className="af-filters">
            {filters.map((f) => (
              <Select key={f.label} ariaLabel={f.label} placeholder={f.label} clearable value={fv[f.label] || ''} onChange={(v) => { setFv({ ...fv, [f.label]: v }); reset(); }} options={f.options} />
            ))}
          </div>
        ) : null}
      </div>

      <div className="tbl-wrap">
        <table className="tbl gt-tbl">
          <thead><tr><th>Date</th><th>{subjectLabel}</th><th>Action</th><th>Description</th><th>Who</th><th>Event</th>{hasOpen ? <th /> : null}</tr></thead>
          <tbody>
            {!shown.length ? (
              <tr><td colSpan={cols}><div className="tbl-empty"><Svg name="search" /><div>{emptyText || 'Nothing matches these filters.'}</div></div></td></tr>
            ) : shown.map((g) => {
              const top = g.events[0];
              if (g.events.length === 1) return eventRow(top, g.key, 'gt-single');
              const isOpen = !!open[g.key];
              const kinds = Array.from(new Set(g.events.map((e) => e.action)));
              const whos = Array.from(new Set(g.events.map((e) => e.who)));
              const toggle = () => setOpen({ ...open, [g.key]: !isOpen });
              const rowsOut = [
                <tr key={g.key} className={`gt-parent${isOpen ? ' is-open' : ''}`} onClick={toggle}>
                  <td className="nowrap"><div className="gt-inline"><b>{fmtDate(top.at)}</b><span className="t-sub">{fmtTime(top.at)} · {rel(top.at)}</span></div></td>
                  <td className="nowrap"><div className="gt-inline">{top.subject}</div></td>
                  <td><span className="gt-kinds">{kinds.slice(0, 3).map((k) => <ActionBadge key={k} action={k} />)}{kinds.length > 3 ? <span className="af-more">+{kinds.length - 3}</span> : null}</span></td>
                  <td className="nowrap gt-sumcell"><div className="gt-sum" title={top.detail}><b>{plural(g.events.length, noun)}</b><span> · latest: {top.detail || 'no details'}</span></div></td>
                  <td><span className="au-who">{whos[0]}</span>{whos.length > 1 ? <span className="af-more"> +{whos.length - 1}</span> : null}</td>
                  <td className="nowrap">
                    <div className="gt-first">
                      <span className="au-no">{top.seq != null ? '#' + top.seq : '—'}</span>
                      <button type="button" className="grp-toggle gt-count" data-stop aria-expanded={isOpen} aria-label={`${isOpen ? 'Hide' : 'Show'} all ${plural(g.events.length, noun)} for ${top.subjectText}`}
                        onClick={(e) => { e.stopPropagation(); toggle(); }}>
                        <span>{g.events.length}</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                      </button>
                    </div>
                  </td>
                  {hasOpen ? <td /> : null}
                </tr>,
              ];
              if (isOpen) g.events.forEach((e, i) => rowsOut.push(eventRow(e, g.key + ':' + i, `gt-child${i === 0 ? ' gt-c-first' : ''}${i === g.events.length - 1 ? ' gt-c-last' : ''}`)));
              return rowsOut;
            })}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <div className="pager-info">{groups.order.length
          ? <>Showing <b>{num(start + 1)}–{num(Math.min(start + pageSize, groups.order.length))}</b> of <b>{num(groups.order.length)}</b>{groups.order.length !== groups.count ? <span className="pager-sub"> · {plural(groups.count, noun)} in all</span> : null}</>
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
