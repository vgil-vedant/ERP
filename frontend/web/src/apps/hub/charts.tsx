// Charts, drawn as SVG exactly as the old script drew them (ported from erp-hub.js).
import { useId, useRef, useState } from 'react';
import { MONTHS, Svg, esc, fmtDate, hideTip, num, pct, pctS, rel, showTip } from './lib';
import type { Bucket, Metrics } from './model';
import { D, DEPT_HUE, PORTAL_ICON } from './model';

const R2 = (v: number) => Math.round(v * 100) / 100;

function niceMax(v: number) {
  if (v <= 5) return 5;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * pow;
}
function smoothPath(pts: number[][]) {
  if (!pts.length) return '';
  if (pts.length < 3) return 'M' + pts.map((p) => p[0] + ' ' + p[1]).join(' L');
  const d = ['M' + pts[0][0] + ' ' + pts[0][1]];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push('C' + [c1x, c1y, c2x, c2y, p2[0], p2[1]].map(R2).join(' '));
  }
  return d.join(' ');
}

export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const id = 'sg' + useId().replace(/:/g, '');
  const w = 82, h = 30, pad = 2;
  if (!values.length) return null;
  const max = Math.max(...values) || 1;
  const min = Math.min(...values);
  const base = Math.min(min, max * 0.6);
  const span = Math.max(1, max - base);
  const pts = values.map((v, i) => [pad + (i * (w - pad * 2)) / Math.max(1, values.length - 1), h - pad - ((v - base) / span) * (h - pad * 2)]);
  const line = smoothPath(pts);
  const area = line + ' L' + (w - pad) + ' ' + h + ' L' + pad + ' ' + h + ' Z';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity=".26" /><stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export interface DonutItem { name: string; value: number; color: string }
export function Donut({ items, centerLabel, hover, setHover, unit = 'records', of = 'of intake' }: { items: DonutItem[]; centerLabel?: string; hover: number | null; setHover: (i: number | null) => void; unit?: string; of?: string }) {
  const total = items.reduce((a, b) => a + b.value, 0) || 1;
  const R = 60, C = 2 * Math.PI * R, SW = 17, size = 168, cx = size / 2, cy = size / 2;
  let offset = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Distribution of received records by source system" onMouseLeave={hideTip}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--surface-3)" strokeWidth={SW} />
      {items.map((it, i) => {
        const len = (it.value / total) * C;
        const gap = items.length > 1 ? 2.5 : 0;
        const dash = Math.max(0.5, len - gap);
        const off = offset; offset += len;
        const on = hover === i;
        return (
          <circle key={it.name} className="dseg" cx={cx} cy={cy} r={R} fill="none" stroke={it.color} strokeWidth={hover === null ? SW : on ? SW + 5 : SW} strokeLinecap="butt"
            strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-off} transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-width .16s ease,opacity .16s ease', opacity: hover === null ? 1 : on ? 1 : 0.58 }}
            onMouseMove={(e) => {
              setHover(i);
              showTip(`<div class="ct-title">${esc(it.name)}</div><div class="ct-row"><span class="ct-dot" style="background:${it.color}"></span>${unit}<b>${num(it.value)}</b></div><div class="ct-row" style="color:#A9C3B8;font-size:10.5px">${pctS(it.value, total)} ${of}</div>`, e.clientX, e.clientY);
            }}
            onMouseLeave={() => { setHover(null); hideTip(); }} />
        );
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" className="donut-center">{num(total)}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="donut-center-sub">{(centerLabel || 'TOTAL RECORDS').toUpperCase()}</text>
    </svg>
  );
}

export function DonutLegend({ items, hover }: { items: DonutItem[]; hover: number | null }) {
  const total = items.reduce((a, b) => a + b.value, 0) || 1;
  return (
    <>
      {items.map((it, i) => (
        <div key={it.name} className={'dl-row' + (hover !== null && hover !== i ? ' is-dim' : '')}>
          <span className="lg-dot" style={{ background: it.color }} />
          <span className="dl-name">{it.name}</span>
          <span className="dl-val">{num(it.value)}<span style={{ color: 'var(--text-3)', fontWeight: 600 }}> · {pct(it.value, total).toFixed(0)}%</span></span>
        </div>
      ))}
    </>
  );
}

export function AreaChart({ buckets, labels = ['Received', 'Refused'], minMax = 0 }: { buckets: Bucket[]; labels?: [string, string]; minMax?: number }) {
  const W = 780, H = 400, L = 46, R = 16, T = 18, B = 30;
  const innerW = W - L - R, innerH = H - T - B;
  const [at, setAt] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // minMax lets a caller keep the y axis at least that tall (the dashboard uses 400)
  const maxVal = Math.max(minMax, niceMax(Math.max(1, ...buckets.map((b) => b.received), ...buckets.map((b) => b.refused))));
  const xOf = (i: number) => L + (buckets.length === 1 ? innerW / 2 : (i * innerW) / (buckets.length - 1));
  const yOf = (v: number) => T + innerH - (v / maxVal) * innerH;
  const okPts = buckets.map((b, i) => [xOf(i), yOf(b.received)]);
  const badPts = buckets.map((b, i) => [xOf(i), yOf(b.refused)]);
  const gridVals = minMax && maxVal % 50 === 0
    ? Array.from({ length: maxVal / 50 + 1 }, (_, k) => k * 50) // 0, 50, 100 … up to the top of the axis
    : [0, 0.2, 0.4, 0.6, 0.8, 1].map((f) => maxVal * f);
  const tickCount = Math.min(6, buckets.length);
  const ticks = Array.from({ length: tickCount }, (_, k) => {
    const i = Math.round((k * (buckets.length - 1)) / Math.max(1, tickCount - 1));
    const b = buckets[i];
    const lbl = buckets.length <= 7 ? MONTHS[b.d.getMonth()] + ' ' + b.d.getDate() : b.d.getDate() + ' ' + MONTHS[b.d.getMonth()];
    return { i, lbl };
  });
  const okLine = smoothPath(okPts), badLine = smoothPath(badPts);
  const okArea = okLine + ` L${xOf(buckets.length - 1)} ${T + innerH} L${L} ${T + innerH} Z`;
  const b = at === null ? null : buckets[at];
  const move = (e: React.MouseEvent) => {
    const box = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * W;
    let i = Math.round((px - L) / (innerW / Math.max(1, buckets.length - 1)));
    i = Math.max(0, Math.min(buckets.length - 1, i));
    setAt(i);
    const bk = buckets[i];
    showTip(`<div class="ct-title">${fmtDate(bk.d)}</div>
      <div class="ct-row"><span class="ct-dot" style="background:#3FC594"></span>${labels[0]}<b>${num(bk.received)}</b></div>
      <div class="ct-row"><span class="ct-dot" style="background:#D8A64E"></span>${labels[1]}<b>${num(bk.refused)}</b></div>`, e.clientX, e.clientY);
  };
  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Received records and refused attempts over time">
      <defs><linearGradient id="gradOk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0E9F6B" stopOpacity=".22" /><stop offset="100%" stopColor="#0E9F6B" stopOpacity="0" /></linearGradient></defs>
      {gridVals.map((v) => (
        <g key={v}>
          <line x1={L} y1={yOf(v)} x2={W - R} y2={yOf(v)} stroke="var(--border)" strokeWidth="1" />
          <text x={L - 9} y={yOf(v) + 3.5} textAnchor="end" fontSize="10" fill="var(--text-3)" fontWeight="600">{num(Math.round(v))}</text>
        </g>
      ))}
      {ticks.map((t) => <text key={t.i + t.lbl} x={xOf(t.i)} y={H - 10} textAnchor="middle" fontSize="10" fill="var(--text-3)" fontWeight="600">{t.lbl}</text>)}
      <path d={okArea} fill="url(#gradOk)" />
      <path d={okLine} fill="none" stroke="#0E9F6B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d={badLine} fill="none" stroke="#D8A64E" strokeWidth="1.7" strokeDasharray="4 4" strokeLinecap="round" />
      <line id="focusLine" x1={at === null ? 0 : xOf(at)} y1={T} x2={at === null ? 0 : xOf(at)} y2={T + innerH} stroke="#9FD8BC" strokeWidth="1" strokeDasharray="3 3" opacity={at === null ? 0 : 1} />
      <circle id="focusOk" r="4.5" fill="var(--surface)" stroke="#0E9F6B" strokeWidth="2.4" cx={at === null ? undefined : xOf(at)} cy={b ? yOf(b.received) : undefined} opacity={at === null ? 0 : 1} />
      <circle id="focusBad" r="3.5" fill="var(--surface)" stroke="#D8A64E" strokeWidth="2" cx={at === null ? undefined : xOf(at)} cy={b ? yOf(b.refused) : undefined} opacity={b && b.refused ? 1 : 0} />
      <rect id="hit" x={L} y={T} width={innerW} height={innerH} fill="transparent" style={{ cursor: 'crosshair' }} onMouseMove={move} onMouseLeave={() => { setAt(null); hideTip(); }} />
    </svg>
  );
}

export function Bars({ rows, labels = ['Kept', 'Rolled back', 'back', 'all kept'] }: { rows: Metrics['perSystem']; labels?: [string, string, string, string] }) {
  const max = Math.max(1, ...rows.map((r) => r.kept + r.rolled));
  return (
    <>
      {rows.map((r) => {
        const hue = DEPT_HUE[r.code];
        return (
        <div className="bar-row" key={r.code}>
          <div className="bar-name"><span className="bar-ic sys-tint" style={{ ['--sys' as string]: hue || D.SYS_COLOR[r.code] }} aria-hidden="true"><Svg name={PORTAL_ICON[r.code] || 'grid'} /></span><span>{r.name}</span></div>
          <div className="bar-track" style={hue ? { background: `color-mix(in srgb, ${hue} 10%, var(--surface))` } : undefined}
            onMouseMove={(e) => showTip(`<div class="ct-title">${esc(r.name)}</div>
        <div class="ct-row"><span class="ct-dot" style="background:${hue || '#3FC594'}"></span>${labels[0]}<b>${num(r.kept)}</b></div>
        <div class="ct-row"><span class="ct-dot" style="background:#D8A64E"></span>${labels[1]}<b>${num(r.rolled)}</b></div>`, e.clientX, e.clientY)}
            onMouseLeave={hideTip}>
            <div className="bar-fill" style={{ width: `${(r.kept / max) * 100}%`, ...(hue ? { background: `linear-gradient(90deg, ${hue}, color-mix(in srgb, ${hue} 72%, var(--surface)))` } : {}) }} />
            <div className="bar-fill alt" style={{ width: `${(r.rolled / max) * 100}%` }} />
          </div>
          <div className="bar-val">{num(r.kept + r.rolled)}<small style={hue && !r.rolled ? { color: hue } : undefined}>{r.rolled ? r.rolled + ' ' + labels[2] : labels[3]}</small></div>
        </div>
        );
      })}
    </>
  );
}

export function HealthRows({ m, compact, names = ['201 · new intake written', '200 · duplicate retry absorbed', '4xx / 5xx · rolled back', 'Commit rate'], rateOf }: { m: Pick<Metrics, 'kept' | 'dup' | 'rolled' | 'totalAttempts'>; compact?: boolean; names?: [string, string, string, string]; rateOf?: number }) {
  const rows = [
    { name: names[0], value: m.kept, color: 'var(--success)' },
    { name: names[1], value: m.dup, color: '#4FB9A8' },
    { name: names[2], value: m.rolled, color: '#D8A64E' },
  ];
  return (
    <>
      {rows.map((r) => (
        <div className="health-row" key={r.name}>
          <span className="lg-dot" style={{ background: r.color }} />
          <span className="hr-name">{r.name}</span>
          <span className="hr-val">{num(r.value)}</span>
          <span className="hr-pct">{pctS(r.value, m.totalAttempts)}</span>
        </div>
      ))}
      {!compact && (
        <div className="health-row" style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 11 }}>
          <span className="lg-dot" style={{ background: 'var(--ink)' }} />
          <span className="hr-name" style={{ color: 'var(--ink)', fontWeight: 800 }}>{names[3]}</span>
          <span className="hr-val">{pctS(rateOf ?? m.kept + m.dup, m.totalAttempts)}</span>
          <span className="hr-pct" />
        </div>
      )}
    </>
  );
}

export function Meter({ m }: { m: Pick<Metrics, 'kept' | 'dup' | 'rolled' | 'totalAttempts'> }) {
  const segs = [{ v: m.kept, c: 'var(--success)' }, { v: m.dup, c: '#4FB9A8' }, { v: m.rolled, c: '#D8A64E' }];
  return <>{segs.map((s, i) => <span key={i} style={{ width: `${pct(s.v, m.totalAttempts).toFixed(2)}%`, background: s.c }} />)}</>;
}

export interface StatusRow { code: string; name: string; delivered: number; pending: number; rejected: number; lastAt: string | null }
/** Events by department: delivered / waiting / rejected as three parts of one bar, and when each office last delivered. */
export function StatusBars({ rows }: { rows: StatusRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.delivered + r.pending + r.rejected));
  return (
    <>
      {rows.map((r) => {
        const hue = DEPT_HUE[r.code] || D.SYS_COLOR[r.code];
        const total = r.delivered + r.pending + r.rejected;
        const w = (n: number) => `${(n / max) * 100}%`;
        return (
          <div className="bar-row bar-row--status" key={r.code}>
            <div className="bar-name"><span className="bar-ic sys-tint" style={{ ['--sys' as string]: hue }} aria-hidden="true"><Svg name={PORTAL_ICON[r.code] || 'grid'} /></span><span>{r.name}</span></div>
            <div className="bar-track" style={{ background: `color-mix(in srgb, ${hue} 10%, var(--surface))` }} onMouseLeave={hideTip}
              onMouseMove={(e) => showTip(`<div class="ct-title">${esc(r.name)}</div>
        <div class="ct-row"><span class="ct-dot" style="background:${hue}"></span>Delivered<b>${num(r.delivered)}</b></div>
        <div class="ct-row"><span class="ct-dot" style="background:#D8A64E"></span>Waiting<b>${num(r.pending)}</b></div>
        <div class="ct-row"><span class="ct-dot" style="background:#D6584F"></span>Rejected<b>${num(r.rejected)}</b></div>`, e.clientX, e.clientY)}>
              <div className="bar-fill" style={{ width: w(r.delivered), background: `linear-gradient(90deg, ${hue}, color-mix(in srgb, ${hue} 72%, var(--surface)))` }} />
              <div className="bar-fill alt" style={{ width: w(r.pending) }} />
              <div className="bar-fill bad" style={{ width: w(r.rejected) }} />
            </div>
            <div className="bar-val">{num(total)}<small>{r.lastAt ? rel(new Date(r.lastAt)) : 'none yet'}</small></div>
          </div>
        );
      })}
    </>
  );
}

export interface OpenRow { code: string; name: string; open: number; records: number }
/** A round axis maximum and step (at most five steps) for a largest value. */
function axisScale(max: number): { top: number; step: number; ticks: number[] } {
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
  const step = steps.find((x) => max / x <= 5) || 1000;
  const top = Math.max(step, Math.ceil(max / step) * step);
  return { top, step, ticks: Array.from({ length: top / step + 1 }, (_, k) => k * step) };
}
/** Open work by department, as vertical columns on labelled axes. It fills the card: every position is a percentage of the plot area. */
export function OpenBars({ rows }: { rows: OpenRow[] }) {
  const sc = axisScale(Math.max(1, ...rows.map((r) => r.records)));
  const pctOf = (v: number) => `${(v / sc.top) * 100}%`;
  const cols = { gridTemplateColumns: `repeat(${Math.max(1, rows.length)}, minmax(0, 1fr))` };
  return (
    <div className="vchart" role="img" aria-label="Open records and all records for each department">
      <div className="vchart-y" aria-hidden="true"><div className="vchart-inner">
        {sc.ticks.map((t) => <span key={t} style={{ bottom: pctOf(t) }}>{num(t)}</span>)}
      </div></div>
      <div className="vchart-main">
        <div className="vchart-grid" aria-hidden="true">
          {sc.ticks.map((t) => <i key={t} className={t === 0 ? 'is-base' : ''} style={{ bottom: pctOf(t) }} />)}
        </div>
        <div className="vbars" style={cols}>
          {rows.map((r) => {
            const hue = DEPT_HUE[r.code] || D.SYS_COLOR[r.code];
            return (
              <div className="vbar-area" key={r.code}>
                <div className="vbar-inner">
                  <div className="vbar-col" style={{ height: pctOf(r.records), minHeight: 6, background: `color-mix(in srgb, ${hue} 14%, var(--surface))` }} onMouseLeave={hideTip}
                    onMouseMove={(e) => showTip(`<div class="ct-title">${esc(r.name)}</div>
        <div class="ct-row"><span class="ct-dot" style="background:${hue}"></span>Open<b>${num(r.open)}</b></div>
        <div class="ct-row"><span class="ct-dot" style="background:#CFE0D8"></span>All records<b>${num(r.records)}</b></div>`, e.clientX, e.clientY)}>
                    <div className="vbar-fill" style={{ height: `${r.records ? (r.open / r.records) * 100 : 0}%`, background: `linear-gradient(0deg, ${hue}, color-mix(in srgb, ${hue} 72%, var(--surface)))` }} />
                  </div>
                  <div className="vbar-val" style={{ bottom: `calc(${pctOf(r.records)} + 6px)` }}>{num(r.open)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div />
      <div className="vnames" style={cols}>
        {rows.map((r) => {
          const hue = DEPT_HUE[r.code] || D.SYS_COLOR[r.code];
          return <div className="vbar-name" key={r.code}><span className="bar-ic sys-tint" style={{ ['--sys' as string]: hue }} aria-hidden="true"><Svg name={PORTAL_ICON[r.code] || 'grid'} /></span><b>{r.name}</b></div>;
        })}
      </div>
      <div className="vchart-legend">
        <span><i className="lg-dot" style={{ background: 'var(--emerald)' }} />Open (filled part)</span>
        <span><i className="lg-dot" style={{ background: 'var(--border-strong)' }} />All records the office holds (full column)</span>
      </div>
    </div>
  );
}

export interface PeopleHeatRow { code: string; name: string; total: number; series: number[] }
/** People on file by department: a heat map of how many people each office added on each of the last days. */
export function PeopleHeat({ rows, dates, weekly, totalNote }: { rows: PeopleHeatRow[]; dates: Date[]; weekly?: boolean; totalNote?: string }) {
  const grand = rows.reduce((t, r) => t + r.total, 0);
  const max = Math.max(1, ...rows.flatMap((r) => r.series));
  const tint = (hue: string, n: number) => (n ? `color-mix(in srgb, ${hue} ${Math.round(18 + 82 * Math.sqrt(n / max))}%, var(--surface))` : 'var(--surface-3)');
  const n = dates.length;
  const gap = Math.max(1, Math.ceil(n / 4));
  const marks = [0, 1, 2, 3].map((k) => k * gap).filter((i) => i < n);
  return (
    <div className="pheat" role="img" aria-label="People added per day in each department over the last days">
      <div className="pheat-row pheat-axis" aria-hidden="true">
        <span />
        <div className="pheat-cells" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>{marks.map((i) => <em key={i} style={{ gridColumn: `${i + 1} / span ${Math.min(gap, n - i)}` }}>{fmtDate(dates[i]).replace(/ \d{4}$/, '')}</em>)}</div>
        <span />
      </div>
      {rows.map((r) => {
        const hue = DEPT_HUE[r.code] || D.SYS_COLOR[r.code] || '#87968F';
        return (
          <div className="pheat-row" key={r.code}>
            <div className="bar-name"><span className="bar-ic sys-tint" style={{ ['--sys' as string]: hue }} aria-hidden="true"><Svg name={PORTAL_ICON[r.code] || 'grid'} /></span><span>{r.name}</span></div>
            <div className="pheat-cells" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
              {r.series.map((v, i) => (
                <i key={i} className="pheat-cell" style={{ background: tint(hue, v) }} onMouseLeave={hideTip}
                  onMouseMove={(e) => showTip(`<div class="ct-title">${esc(r.name)} · ${weekly ? 'week of ' : ''}${fmtDate(dates[i])}</div><div class="ct-row"><span class="ct-dot" style="background:${hue}"></span>People added<b>${num(v)}</b></div>`, e.clientX, e.clientY)} />
              ))}
            </div>
            <div className="bar-val">{num(r.total)}<small>{pctS(r.total, grand)}</small></div>
          </div>
        );
      })}
      <div className="pheat-legend"><span>Fewer added</span><i style={{ background: 'var(--surface-3)' }} /><i style={{ background: 'color-mix(in srgb, var(--emerald) 30%, var(--surface))' }} /><i style={{ background: 'color-mix(in srgb, var(--emerald) 60%, var(--surface))' }} /><i style={{ background: 'var(--emerald)' }} /><span>More added</span><span className="pheat-total" title="People on file"><Svg name="users" /><b>{num(grand)}</b>{totalNote || 'on file'}</span></div>
    </div>
  );
}

export interface RadarAxis { key: string; label: string; created: number; refused: number }
/** Office activity as a radar chart: one axis per department, one translucent polygon per metric. */
export function RadarChart({ axes, labels, days, periodText }: { axes: RadarAxis[]; labels: [string, string]; days: number; periodText?: string }) {
  const when = periodText || `last ${days} days`;
  const W = 560, H = 440, cx = W / 2, cy = H / 2 + 4, R = 165;
  const n = axes.length;
  const sc = axisScale(Math.max(1, ...axes.flatMap((a) => [a.created, a.refused])));
  const rings = sc.ticks.slice(1);
  const ang = (i: number) => -Math.PI / 2 + (2 * Math.PI * i) / n;
  const pt = (i: number, v: number): [number, number] => [R2(cx + Math.cos(ang(i)) * R * (v / sc.top)), R2(cy + Math.sin(ang(i)) * R * (v / sc.top))];
  const poly = (vals: number[]) => 'M' + vals.map((v, i) => pt(i, v).join(' ')).join(' L') + ' Z';
  const series: { name: string; color: string; vals: number[] }[] = [
    { name: labels[0], color: '#0E9F6B', vals: axes.map((a) => a.created) },
    { name: labels[1], color: '#D8A64E', vals: axes.map((a) => a.refused) },
  ];
  const tip = (e: React.MouseEvent, a: RadarAxis, s: { name: string; color: string }, v: number) =>
    showTip(`<div class="ct-title">${esc(a.label)}</div><div class="ct-row"><span class="ct-dot" style="background:${s.color}"></span>${esc(s.name)}<b>${num(v)}</b></div><div class="ct-row" style="color:#A9C3B8;font-size:10.5px">${esc(when)}</div>`, e.clientX, e.clientY);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${labels[0]} and ${labels[1]} for each department, ${when}`} onMouseLeave={hideTip}>
      {rings.map((v) => (
        <polygon key={v} points={axes.map((_, i) => pt(i, v).join(',')).join(' ')} fill={v === sc.top ? 'var(--surface-2)' : 'none'} stroke="var(--border-strong)" strokeWidth="1" />
      ))}
      {axes.map((a, i) => <line key={a.key} x1={cx} y1={cy} x2={pt(i, sc.top)[0]} y2={pt(i, sc.top)[1]} stroke="var(--border)" strokeWidth="1" />)}
      {rings.map((v) => <text key={'t' + v} x={cx + 5} y={R2(cy - R * (v / sc.top)) - 3} fontSize="9.5" fontWeight="600" fill="var(--text-3)">{num(v)}</text>)}
      {series.map((s) => (
        <g key={s.name}>
          <path d={poly(s.vals)} fill={s.color} fillOpacity=".2" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />
          {s.vals.map((v, i) => { const [x, y] = pt(i, v); return <circle key={axes[i].key} cx={x} cy={y} r="5" fill={s.color} stroke="#fff" strokeWidth="2" />; })}
        </g>
      ))}
      {axes.map((a, i) => {
        const x = cx + Math.cos(ang(i)) * (R + 18), y = cy + Math.sin(ang(i)) * (R + 18), c = Math.cos(ang(i)), sn = Math.sin(ang(i));
        return <text key={'l' + a.key} x={R2(x)} y={R2(y + (sn < -0.9 ? -4 : sn > 0.5 ? 12 : 4))} textAnchor={c > 0.25 ? 'start' : c < -0.25 ? 'end' : 'middle'} fontSize="12" fontWeight="700" fill="var(--chart-label)">{a.label}</text>;
      })}
      {series.map((s) => axes.map((a, i) => { const [x, y] = pt(i, s.vals[i]); return <circle key={s.name + a.key} cx={x} cy={y} r="13" fill="transparent" style={{ cursor: 'crosshair' }} onMouseMove={(e) => tip(e, a, s, s.vals[i])} />; }))}
    </svg>
  );
}

/** A doughnut with the share inside each segment, and a bordered label for each category outside it, joined by a leader line. */
export function DonutPro({ items, centerLabel, hover, setHover, unit = 'records' }: { items: DonutItem[]; centerLabel?: string; hover: number | null; setHover: (i: number | null) => void; unit?: string }) {
  const total = items.reduce((a, b) => a + b.value, 0) || 1;
  const W = 620, H = 420, cx = W / 2, cy = H / 2, R = 128, r = 78, GAP = items.length > 1 ? 0.022 : 0;
  const pt = (rad: number, a: number): [number, number] => [R2(cx + Math.cos(a) * rad), R2(cy + Math.sin(a) * rad)];
  let acc = -Math.PI / 2;
  const segs = items.map((it, i) => {
    const frac = it.value / total, a0 = acc, a1 = acc + frac * 2 * Math.PI;
    acc = a1;
    return { it, i, frac, a0, a1, mid: (a0 + a1) / 2 };
  });
  const LH = 28, BOXH = 22;
  // outside labels: one column per side, sorted by height and pushed apart so they never overlap
  const place = (side: 1 | -1) => {
    const list = segs.filter((s) => (Math.cos(s.mid) >= 0 ? 1 : -1) === side).map((s) => ({ s, y: cy + Math.sin(s.mid) * (R + 18) })).sort((a, b) => a.y - b.y);
    for (let k = 0; k < list.length; k++) list[k].y = Math.max(list[k].y, k ? list[k - 1].y + LH : 16);
    const over = list.length ? list[list.length - 1].y - (H - 16) : 0;
    if (over > 0) list.forEach((l) => { l.y -= over; });
    for (let k = list.length - 2; k >= 0; k--) list[k].y = Math.min(list[k].y, list[k + 1].y - LH);
    return list;
  };
  const labels = [...place(1), ...place(-1)];
  const short = (t: string) => (t.length > 11 ? t.slice(0, 10) + '…' : t);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Share of ${unit} by department`} onMouseLeave={() => { setHover(null); hideTip(); }}>
      {segs.map(({ it, i, frac, a0, a1, mid }) => {
        const on = hover === i, RO = on ? R + 5 : R;
        const s0 = a0 + GAP / 2, s1 = a1 - GAP / 2;
        const o = (a: number): [number, number] => [R2(cx + Math.cos(a) * RO), R2(cy + Math.sin(a) * RO)];
        const n = (a: number): [number, number] => [R2(cx + Math.cos(a) * r), R2(cy + Math.sin(a) * r)];
        const large = s1 - s0 > Math.PI ? 1 : 0;
        const d = frac >= 0.9999
          ? `M${cx - RO} ${cy} A${RO} ${RO} 0 1 1 ${cx + RO} ${cy} A${RO} ${RO} 0 1 1 ${cx - RO} ${cy} Z M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`
          : `M${o(s0)[0]} ${o(s0)[1]} A${RO} ${RO} 0 ${large} 1 ${o(s1)[0]} ${o(s1)[1]} L${n(s1)[0]} ${n(s1)[1]} A${r} ${r} 0 ${large} 0 ${n(s0)[0]} ${n(s0)[1]} Z`;
        const [tx, ty] = pt((R + r) / 2, mid);
        return (
          <g key={it.name} style={{ opacity: hover === null || on ? 1 : 0.55, transition: 'opacity .16s ease' }}>
            <path d={d} fill={it.color} fillRule="evenodd" style={{ cursor: 'default' }}
              onMouseMove={(e) => { setHover(i); showTip(`<div class="ct-title">${esc(it.name)}</div><div class="ct-row"><span class="ct-dot" style="background:${it.color}"></span>${unit}<b>${num(it.value)}</b></div><div class="ct-row" style="color:#A9C3B8;font-size:10.5px">${pctS(it.value, total)} of ${num(total)}</div>`, e.clientX, e.clientY); }} />
            {frac >= 0.05 && <text x={tx} y={ty + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--surface)" style={{ pointerEvents: 'none' }}>{Math.round(frac * 100)}%</text>}
          </g>
        );
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" className="donut-center">{num(total)}</text>
      <text x={cx} y={cy + 15} textAnchor="middle" className="donut-center-sub">{(centerLabel || 'TOTAL').toUpperCase()}</text>
      {labels.map(({ s, y }) => {
        const side = Math.cos(s.mid) >= 0 ? 1 : -1;
        const label = short(s.it.name), count = ' · ' + num(s.it.value), bw = Math.max(60, (label.length + count.length) * 6.9 + 18);
        const edge = cx + side * (R + 48);
        const [x0, y0] = pt(R + 3, s.mid), [x1, y1] = pt(R + 14, s.mid);
        const bx = side === 1 ? edge : edge - bw;
        return (
          <g key={'l' + s.it.name} className="dp-label" style={{ opacity: hover === null || hover === s.i ? 1 : 0.55 }}
            onMouseMove={(e) => { setHover(s.i); showTip(`<div class="ct-title">${esc(s.it.name)}</div><div class="ct-row"><span class="ct-dot" style="background:${s.it.color}"></span>${unit}<b>${num(s.it.value)}</b></div><div class="ct-row" style="color:#A9C3B8;font-size:10.5px">${pctS(s.it.value, total)} of ${num(total)}</div>`, e.clientX, e.clientY); }}>
            <polyline points={`${x0},${y0} ${x1},${y1} ${edge},${R2(y)}`} fill="none" stroke={s.it.color} strokeWidth="1.1" />
            <circle cx={x0} cy={y0} r="2" fill={s.it.color} />
            <rect x={R2(bx)} y={R2(y - BOXH / 2)} width={R2(bw)} height={BOXH} rx="6" fill="var(--surface)" stroke={s.it.color} strokeWidth="1.2" />
            <text x={R2(bx + bw / 2)} y={R2(y + 4)} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="var(--chart-label)">{label}<tspan fontWeight="800" fill={s.it.color}>{count}</tspan></text>
          </g>
        );
      })}
    </svg>
  );
}
