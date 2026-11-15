// Charts, drawn as SVG exactly as the old script drew them (ported from erp-hub.js).
import { useId, useRef, useState } from 'react';
import { MONTHS, esc, fmtDate, hideTip, num, pct, pctS, showTip } from './lib';
import type { Bucket, Metrics } from './model';
import { D, DEPT_HUE } from './model';

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
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#F1F7F3" strokeWidth={SW} />
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
          <line x1={L} y1={yOf(v)} x2={W - R} y2={yOf(v)} stroke="#EDF4F0" strokeWidth="1" />
          <text x={L - 9} y={yOf(v) + 3.5} textAnchor="end" fontSize="10" fill="#66766F" fontWeight="600">{num(Math.round(v))}</text>
        </g>
      ))}
      {ticks.map((t) => <text key={t.i + t.lbl} x={xOf(t.i)} y={H - 10} textAnchor="middle" fontSize="10" fill="#66766F" fontWeight="600">{t.lbl}</text>)}
      <path d={okArea} fill="url(#gradOk)" />
      <path d={okLine} fill="none" stroke="#0E9F6B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d={badLine} fill="none" stroke="#D8A64E" strokeWidth="1.7" strokeDasharray="4 4" strokeLinecap="round" />
      <line id="focusLine" x1={at === null ? 0 : xOf(at)} y1={T} x2={at === null ? 0 : xOf(at)} y2={T + innerH} stroke="#9FD8BC" strokeWidth="1" strokeDasharray="3 3" opacity={at === null ? 0 : 1} />
      <circle id="focusOk" r="4.5" fill="#fff" stroke="#0E9F6B" strokeWidth="2.4" cx={at === null ? undefined : xOf(at)} cy={b ? yOf(b.received) : undefined} opacity={at === null ? 0 : 1} />
      <circle id="focusBad" r="3.5" fill="#fff" stroke="#D8A64E" strokeWidth="2" cx={at === null ? undefined : xOf(at)} cy={b ? yOf(b.refused) : undefined} opacity={b && b.refused ? 1 : 0} />
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
          <div className="bar-name"><span className="sys-dot" style={{ background: hue || D.SYS_COLOR[r.code] }} /><span>{r.name}</span></div>
          <div className="bar-track" style={hue ? { background: `color-mix(in srgb, ${hue} 10%, #fff)` } : undefined}
            onMouseMove={(e) => showTip(`<div class="ct-title">${esc(r.name)}</div>
        <div class="ct-row"><span class="ct-dot" style="background:${hue || '#3FC594'}"></span>${labels[0]}<b>${num(r.kept)}</b></div>
        <div class="ct-row"><span class="ct-dot" style="background:#D8A64E"></span>${labels[1]}<b>${num(r.rolled)}</b></div>`, e.clientX, e.clientY)}
            onMouseLeave={hideTip}>
            <div className="bar-fill" style={{ width: `${(r.kept / max) * 100}%`, ...(hue ? { background: `linear-gradient(90deg, ${hue}, color-mix(in srgb, ${hue} 72%, #fff))` } : {}) }} />
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
