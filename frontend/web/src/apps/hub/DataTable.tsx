// The sortable, filterable, paged table used by every list in the hub (ported from createTable in erp-hub.js).
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Svg, esc, num } from './lib';

export interface Column<T> {
  key: string; label: string; sortable?: boolean; align?: 'right'; nowrap?: boolean;
  render: (r: T) => ReactNode; sortValue?: (r: T) => string | number; csv: (r: T) => string | number;
}
export interface Filter<T> {
  key: string; label: string; options: { value: string; label: string }[] | (() => { value: string; label: string }[]); match: (r: T, v: string) => boolean;
}
export interface TableCfg<T> {
  columns: Column<T>[]; rows: () => T[]; searchPlaceholder?: string; searchKeys: (r: T) => (string | number | null)[]; filters?: Filter<T>[];
  pageSize?: number; defaultSort?: string; defaultDir?: 'asc' | 'desc'; onRow?: (r: T) => void; exportName?: string; emptyText?: string;
  onCount?: (n: number) => void;
}
interface Props<T> { cfg: TableCfg<T>; onExport: (name: string, csv: string, count: number) => void }

const optionsOf = <T,>(f: Filter<T>) => (typeof f.options === 'function' ? f.options() : f.options);

export function DataTable<T>({ cfg, onExport }: Props<T>) {
  const filters = cfg.filters || [];
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(cfg.defaultSort || null);
  const [dir, setDir] = useState<'asc' | 'desc'>(cfg.defaultDir || 'desc');
  const [fv, setFv] = useState<Record<string, string>>({});

  // a filter value that is no longer one of the options (the data changed) is dropped
  const opts = filters.map((f) => optionsOf(f));
  const eff = (f: Filter<T>, i: number) => (opts[i].some((o) => o.value === fv[f.key]) ? fv[f.key] : '');

  const all = cfg.rows();
  const rows = useMemo(() => {
    let out = all;
    const query = q.trim().toLowerCase();
    if (query) out = out.filter((r) => cfg.searchKeys(r).join(' ').toLowerCase().includes(query));
    filters.forEach((f, i) => { const v = eff(f, i); if (v) out = out.filter((r) => f.match(r, v)); });
    if (sortKey) {
      const col = cfg.columns.find((c) => c.key === sortKey);
      if (col && col.sortValue) {
        const sv = col.sortValue;
        out = out.slice().sort((a, b) => {
          const av = sv(a), bv = sv(b);
          if (av === bv) return 0;
          const res = av > bv ? 1 : -1;
          return dir === 'asc' ? res : -res;
        });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, q, sortKey, dir, fv]);

  const per = cfg.pageSize || 8;
  const pages = Math.max(1, Math.ceil(rows.length / per));
  const cur = Math.min(page, pages);
  const start = (cur - 1) * per;
  const slice = rows.slice(start, start + per);
  useEffect(() => { if (cfg.onCount) cfg.onCount(rows.length); }, [rows.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => { setQ(''); setPage(1); setFv({}); };
  const sortBy = (k: string) => {
    if (sortKey === k) setDir(dir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setDir(k === 'received' || k === 'at' ? 'desc' : 'asc'); }
    setPage(1);
  };
  const exportCsv = () => {
    const cols = cfg.columns.filter((c) => c.label);
    const head = cols.map((c) => '"' + c.label.replace(/"/g, '""') + '"').join(',');
    const body = rows.map((r) => cols.map((c) => {
      let v = String(c.csv(r)).replace(/<[^>]*>/g, '');
      if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; /* a spreadsheet must not read a value as a formula */
      return '"' + v.replace(/"/g, '""') + '"';
    }).join(',')).join('\n');
    onExport((cfg.exportName || 'erp-export') + '.csv', head + '\n' + body, rows.length);
  };

  const first = Math.max(1, cur - 2);
  const to = Math.min(pages, first + 4);
  const from = Math.max(1, to - 4);
  const windowPages: number[] = [];
  for (let p = from; p <= to; p++) windowPages.push(p);

  return (
    <>
      <div className="tbl-toolbar">
        <div className="tbl-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
          <input type="search" placeholder={cfg.searchPlaceholder || 'Search…'} aria-label={cfg.searchPlaceholder || 'Search table'} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        {filters.map((f, i) => (
          <select key={f.key} className="field" aria-label={f.label} value={eff(f, i)} onChange={(e) => { setFv({ ...fv, [f.key]: e.target.value }); setPage(1); }}>
            <option value="">{f.label}</option>
            {opts[i].map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
        <button className="btn btn-sm" type="button" onClick={exportCsv}><Svg name="download" /> Export</button>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              {cfg.columns.map((c) => {
                const sorted = sortKey === c.key;
                return (
                  <th key={c.key} className={`${c.sortable ? 'sortable' : ''} ${sorted ? 'is-sorted' : ''} ${c.align === 'right' ? 'col-right' : ''}`}
                    aria-sort={sorted ? (dir === 'asc' ? 'ascending' : 'descending') : undefined} onClick={c.sortable ? () => sortBy(c.key) : undefined}>
                    <span className="th-inner">{c.label}{c.sortable && (
                      <svg className="sort-ind" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m8 9 4-4 4 4M8 15l4 4 4-4" /></svg>
                    )}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {!slice.length ? (
              <tr><td colSpan={cfg.columns.length}><div className="tbl-empty">
                <Svg name="search" /><div>{cfg.emptyText || 'Nothing matches these filters.'}</div>
                <button className="btn btn-sm btn-ghost" type="button" style={{ marginTop: 10 }} onClick={reset}>Clear filters</button>
              </div></td></tr>
            ) : slice.map((r, idx) => (
              <tr key={start + idx} className={cfg.onRow ? 'clickable' : ''}
                onClick={cfg.onRow ? (e) => { if ((e.target as HTMLElement).closest('[data-stop]')) return; cfg.onRow!(r); } : undefined}>
                {cfg.columns.map((c) => <td key={c.key} className={`${c.align === 'right' ? 'col-right' : ''} ${c.nowrap ? 'nowrap' : ''}`}>{c.render(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <div className="pager-info">{rows.length ? <>Showing <b>{num(start + 1)}–{num(Math.min(start + per, rows.length))}</b> of <b>{num(rows.length)}</b></> : 'No rows'}</div>
        <div className="pager-btns">
          <button className="pg" disabled={cur === 1} aria-label="Previous page" onClick={() => setPage(Math.max(1, cur - 1))}><Svg name="chevLeft" /></button>
          {windowPages.map((p) => <button key={p} className={`pg ${p === cur ? 'is-active' : ''}`} onClick={() => setPage(p)}>{p}</button>)}
          <button className="pg" disabled={cur === pages} aria-label="Next page" onClick={() => setPage(Math.min(pages, cur + 1))}><Svg name="arrowRight" /></button>
        </div>
      </div>
    </>
  );
}
void esc;
