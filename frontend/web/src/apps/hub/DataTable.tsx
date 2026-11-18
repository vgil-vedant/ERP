// The sortable, filterable, paged table used by every list in the hub (ported from createTable in erp-hub.js).
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Select } from './controls';
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
  /** Fold rows that belong to one subject (one person, one record) under a single row that opens to show the rest. */
  group?: { key: (r: T, i: number) => string; noun: string; plural?: string };
}
interface Props<T> { cfg: TableCfg<T>; onExport: (name: string, csv: string, count: number) => void; showExport?: boolean }

const optionsOf = <T,>(f: Filter<T>) => (typeof f.options === 'function' ? f.options() : f.options);

export function DataTable<T>({ cfg, onExport, showExport = true }: Props<T>) {
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

  // rows -> groups, in the order each subject first appears (so the row shown is the first one in the current sort, e.g. the newest)
  const groups = useMemo(() => {
    if (!cfg.group) return rows.map((r) => [r]);
    const order: T[][] = []; const by = new Map<string, T[]>();
    rows.forEach((r, i) => { const k = cfg.group!.key(r, i); let g = by.get(k); if (!g) { g = []; by.set(k, g); order.push(g); } g.push(r); });
    return order;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({});
  const per = cfg.pageSize || 8;
  const pages = Math.max(1, Math.ceil(groups.length / per));
  const cur = Math.min(page, pages);
  const start = (cur - 1) * per;
  const slice = groups.slice(start, start + per);
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
          <Select key={f.key} ariaLabel={f.label} placeholder={f.label} clearable value={eff(f, i)} onChange={(v) => { setFv({ ...fv, [f.key]: v }); setPage(1); }} options={opts[i]} />
        ))}
        {showExport && <button className="btn btn-sm" type="button" onClick={exportCsv}><Svg name="download" /> Export</button>}
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
            ) : slice.map((g, idx) => {
              const gk = cfg.group ? cfg.group.key(g[0], start + idx) + '#' + (start + idx) : String(start + idx);
              const many = !!cfg.group && g.length > 1;
              // the open state follows the subject, not its position on the page
              const stable = cfg.group ? cfg.group.key(g[0], 0) : gk;
              const open = many && !!openKeys[stable];
              const rowEl = (r: T, key: string, child: boolean, head: boolean) => (
                <tr key={key} className={`${cfg.onRow ? 'clickable' : ''}${child ? ' grp-child' : ''}${head && many ? ' grp-head' : ''}${head && open ? ' is-open' : ''}`}
                  onClick={cfg.onRow ? (e) => { if ((e.target as HTMLElement).closest('[data-stop]')) return; cfg.onRow!(r); } : undefined}>
                  {cfg.columns.map((c, ci) => (
                    <td key={c.key} className={`${c.align === 'right' ? 'col-right' : ''} ${c.nowrap ? 'nowrap' : ''}`}>
                      {ci === 0 && head && many ? (
                        <div className="grp-cell">
                          <button className="grp-toggle" type="button" data-stop aria-expanded={open}
                            aria-label={`${open ? 'Hide' : 'Show'} all ${g.length} ${cfg.group!.plural || cfg.group!.noun + 's'}`}
                            onClick={() => setOpenKeys({ ...openKeys, [stable]: !open })}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                            <span>{g.length}</span>
                          </button>
                          <div className="grp-main">{c.render(r)}</div>
                        </div>
                      ) : c.render(r)}
                    </td>
                  ))}
                </tr>
              );
              return [rowEl(g[0], gk, false, true)].concat(open ? g.slice(1).map((r, j) => rowEl(r, gk + ':' + j, true, false)) : []);
            })}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <div className="pager-info">{groups.length ? <>Showing <b>{num(start + 1)}–{num(Math.min(start + per, groups.length))}</b> of <b>{num(groups.length)}</b>{cfg.group && groups.length !== rows.length ? <span className="pager-sub"> · {num(rows.length)} {cfg.group.plural || cfg.group.noun + 's'} in all</span> : null}</> : 'No rows'}</div>
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
