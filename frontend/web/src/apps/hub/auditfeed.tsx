// The people-style log: one row per subject (a person, a record, an entity), each opening to its events,
// told apart by what was done (read, receive, search…) with a coloured stepper per kind of action.
// Used by the Audit Trail, the Lookup audit and the Activity log.
import { useEffect, useMemo, useState } from 'react';
import { Select } from './controls';
import { Svg, fmtDate, fmtTime, num, rel } from './lib';
import { actionTone } from './timeline';
import { distinctOptions } from './model';
import type { Audit } from './model';

const TONE_WORD: Record<string, string> = { read: 'Read', search: 'Search', create: 'Received or created', update: 'Changed', delete: 'Removed or refused', login: 'Sign-in', export: 'Export', other: 'Other' };
const TONE_ICON: Record<string, string> = { search: 'search', read: 'file', create: 'inbox', update: 'refresh', delete: 'alert', login: 'lock', export: 'download', other: 'pulse' };
const initials = (s: string) => s.replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
const stamp = (d: Date) => `${fmtDate(d)}, ${fmtTime(d)}`;
const plural = (n: number, one: string) => `${num(n)} ${n === 1 ? one : one + 's'}`;

/** One event of a log. Events with the same `group` belong to one subject and fold under one row. */
export interface FeedRow {
  id: string; seq?: number | null; at: Date; group: string;
  /** the subject's name, a line under it, an icon (or initials when empty) and an optional colour for its tile */
  title: string; sub?: string; icon?: string; tint?: string;
  action: string; detail: string; by: string; extra?: string;
  search: string; open?: () => void;
}
export interface FeedFilter { label: string; options: { value: string; label: string }[]; match: (r: FeedRow, v: string) => boolean }
interface Group { key: string; first: FeedRow; events: FeedRow[] }

export function LogFeed({ rows, filters = [], searchPlaceholder, noun, emptyText, onCount, pageSize = 10 }: {
  rows: FeedRow[]; filters?: FeedFilter[]; searchPlaceholder: string; noun: string; emptyText?: string; onCount?: (n: number) => void; pageSize?: number;
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
      if (!g) { g = { key: r.group, first: r, events: [] }; by.set(r.group, g); order.push(g); }
      g.events.push(r);
    });
    return { order, count: list.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, fv]);
  useEffect(() => { if (onCount) onCount(groups.count); }, [groups.count]); // eslint-disable-line react-hooks/exhaustive-deps

  const pages = Math.max(1, Math.ceil(groups.order.length / pageSize));
  const cur = Math.min(page, pages);
  const start = (cur - 1) * pageSize;
  const shown = groups.order.slice(start, start + pageSize);
  const reset = () => setPage(1);

  return (
    <div className="af">
      <div className="af-toolbar">
        <div className="tl-search">
          <Svg name="search" />
          <input type="search" placeholder={searchPlaceholder} aria-label={searchPlaceholder} value={q} onChange={(e) => { setQ(e.target.value); reset(); }} />
        </div>
        {filters.map((f) => (
          <Select key={f.label} ariaLabel={f.label} placeholder={f.label} clearable value={fv[f.label] || ''} onChange={(v) => { setFv({ ...fv, [f.label]: v }); reset(); }} options={f.options} />
        ))}
      </div>

      {!shown.length ? (
        <div className="tl-empty"><Svg name="search" /><div>{emptyText || 'Nothing matches these filters.'}</div></div>
      ) : (
        <ol className="af-list">
          {shown.map((g) => {
            const isOpen = !!open[g.key];
            const latest = g.events[0];
            const t0 = g.first;
            const kinds = Array.from(new Set(g.events.map((e) => e.action)));
            const bys = Array.from(new Set(g.events.map((e) => e.by)));
            // the events of one subject, by what was done: one section (and one stepper) per action, oldest first
            const byAction = kinds.map((k) => ({ k, list: g.events.filter((e) => e.action === k).slice().reverse() }));
            const kidsId = 'af-' + g.key.replace(/[^a-z0-9]+/gi, '-');
            const toggle = () => setOpen({ ...open, [g.key]: !isOpen });
            return (
              <li key={g.key} className={`af-row${isOpen ? ' is-open' : ''}`}>
                <div className="af-head" onClick={toggle}>
                  <span className="af-av" aria-hidden="true" style={t0.tint ? { ['--av' as string]: t0.tint } : undefined}>{t0.icon ? <Svg name={t0.icon} /> : initials(t0.title)}</span>
                  <div className="af-main">
                    <b>{t0.title}{t0.sub ? <> <span className="af-sep">·</span> {t0.sub}</> : null}</b>
                    <span>{g.events.length === 1 ? (latest.seq != null ? `${noun} #${latest.seq}` : `1 ${noun}`) : plural(g.events.length, noun)} · by {bys.slice(0, 2).join(', ')}{bys.length > 2 ? ` +${bys.length - 2}` : ''}</span>
                  </div>
                  <span className="af-kinds">{kinds.slice(0, 3).map((k) => <span key={k} className={`tl-badge tl-badge--${actionTone(k)}`}>{k}</span>)}{kinds.length > 3 ? <span className="af-more">+{kinds.length - 3}</span> : null}</span>
                  <time className="af-when" title={stamp(latest.at)}>{rel(latest.at)}</time>
                  <button type="button" className="af-toggle" aria-expanded={isOpen} aria-controls={kidsId} aria-label={`${isOpen ? 'Hide' : 'Show'} the ${plural(g.events.length, noun)} for ${t0.title}`}
                    onClick={(e) => { e.stopPropagation(); toggle(); }}>
                    <Svg name="arrowRight" />
                  </button>
                </div>
                {isOpen ? (
                  <div className="af-body" id={kidsId}>
                    {byAction.map(({ k, list }) => {
                      const tone = actionTone(k);
                      return (
                        <section key={k} className={`af-sec af-tone--${tone}`} aria-label={`${k}, ${plural(list.length, noun)}`}>
                          <header className="af-sec-head">
                            <span className="af-sec-ic" aria-hidden="true"><Svg name={TONE_ICON[tone]} /></span>
                            <div><b>{k}</b><span>{TONE_WORD[tone]} · {plural(list.length, noun)} · latest {stamp(list[list.length - 1].at)}</span></div>
                          </header>
                          <ol className="af-steps">
                            {list.map((e, i) => {
                              const now = i === list.length - 1;
                              const body = (
                                <>
                                  <b>{e.seq != null ? `#${e.seq} · ` : ''}{e.detail || 'No details were recorded'}</b>
                                  <span>by {e.by}{e.extra ? ` · ${e.extra}` : ''}</span>
                                </>
                              );
                              return (
                                <li key={e.id} className={`af-step ${now ? 'is-now' : 'is-done'}`} aria-current={now ? 'step' : undefined}>
                                  <span className="af-node" aria-hidden="true">{now ? null : <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m3.5 8.4 2.9 2.9 6.1-6.3" /></svg>}</span>
                                  {e.open
                                    ? <button type="button" className="af-step-body" onClick={e.open} title="Open this event">{body}</button>
                                    : <div className="af-step-body af-step-body--plain">{body}</div>}
                                  <span className="af-step-meta"><time>{stamp(e.at)}</time>{now ? <span className="af-tag">Latest</span> : null}</span>
                                </li>
                              );
                            })}
                          </ol>
                        </section>
                      );
                    })}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}

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

/* ---------------------------------------------------------------------- the Audit Trail */
const ENTITY_ICON: Record<string, string> = { ingest: 'sync', lookup: 'search', citizen: 'users', intake: 'inbox', submission: 'inbox', officer: 'user' };

export function AuditFeed({ rows, onOpen, onCount }: { rows: Audit[]; onOpen: (a: Audit) => void; onCount?: (n: number) => void }) {
  const feed: FeedRow[] = useMemo(() => rows.map((a) => ({
    id: 'a' + a.id, seq: a.id, at: a.at, group: a.entityId ? a.entity + ':' + a.entityId : '#' + a.id,
    title: a.entity, sub: a.entityId || undefined, icon: ENTITY_ICON[a.entity] || undefined,
    action: a.action, detail: a.details, by: a.maker, extra: [a.approver ? 'approved by ' + a.approver : '', a.ref].filter(Boolean).join(' · '),
    search: [String(a.id), a.entity, a.entityId, a.action, a.maker, a.approver, a.details, a.ref].join(' '), open: () => onOpen(a),
  })), [rows, onOpen]);
  const asRecords = rows as unknown as Record<string, unknown>[];
  const filters: FeedFilter[] = [
    { label: 'Any time', options: [{ value: 'today', label: 'Today' }, { value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }],
      match: (r, v) => (v === 'today' ? r.at.toDateString() === new Date().toDateString() : Date.now() - r.at.getTime() <= Number(v) * 86400000) },
    { label: 'All entities', options: distinctOptions(asRecords, 'entity'), match: (r, v) => r.title === v },
    { label: 'All actions', options: distinctOptions(asRecords, 'action'), match: (r, v) => r.action === v },
    { label: 'All makers', options: distinctOptions(asRecords, 'maker'), match: (r, v) => r.by === v },
  ];
  return <LogFeed rows={feed} filters={filters} noun="event" searchPlaceholder="Search event #, entity, action, maker, details or reference…" onCount={onCount} emptyText="No audit event matches these filters." />;
}
