// Dashboard charts (ported from the inline script of dashboard.ejs). Static, as before; colours are the ones the page used.
const COLORS = ['#F16F3F', '#F8A66B', '#F58A50', '#292832', '#77716F'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const R2 = (v: number) => Math.round(v * 100) / 100;

function smoothPath(pts: number[][]) {
  if (pts.length < 2) return pts.length ? 'M' + pts[0][0] + ' ' + pts[0][1] : '';
  const d = ['M' + pts[0][0] + ' ' + pts[0][1]];
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[Math.max(i - 2, 0)], p1 = pts[i - 1], p2 = pts[i], p3 = pts[Math.min(i + 1, pts.length - 1)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push('C' + [c1x, c1y, c2x, c2y, p2[0], p2[1]].map(R2).join(' '));
  }
  return d.join(' ');
}

export function AreaChart({ buckets }: { buckets: { date: string; n: number }[] }) {
  if (!buckets.length) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--text-3)', fontSize: 12 }}>No intake data in range</div>;
  const W = 780, H = 200, L = 46, R = 16, T = 18, B = 30;
  const innerW = W - L - R, innerH = H - T - B;
  let maxVal = Math.max(1, ...buckets.map((b) => b.n));
  const mag = Math.pow(10, Math.floor(Math.log(maxVal) / Math.LN10));
  maxVal = Math.ceil(maxVal / mag) * mag || 1;
  const xOf = (i: number) => L + (buckets.length === 1 ? innerW / 2 : (i * innerW) / (buckets.length - 1));
  const yOf = (v: number) => T + innerH - (v / maxVal) * innerH;
  const pts = buckets.map((b, i) => [xOf(i), yOf(b.n)]);
  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxVal * f));
  const tickCount = Math.min(6, buckets.length);
  const ticks = Array.from({ length: tickCount }, (_, k) => {
    const idx = Math.round((k * (buckets.length - 1)) / Math.max(1, tickCount - 1));
    const d = new Date(buckets[idx].date + 'T00:00:00');
    return { idx, lbl: MONTHS[d.getMonth()] + ' ' + d.getDate() };
  });
  const line = smoothPath(pts);
  const area = line + ' L' + xOf(buckets.length - 1) + ' ' + (T + innerH) + ' L' + L + ' ' + (T + innerH) + ' Z';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Daily intake trend">
      <defs><linearGradient id="gradDash" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F16F3F" stopOpacity=".22" /><stop offset="100%" stopColor="#F16F3F" stopOpacity="0" /></linearGradient></defs>
      {gridVals.map((v) => (
        <g key={v}>
          <line x1={L} y1={yOf(v)} x2={W - R} y2={yOf(v)} stroke="#F1E6DF" strokeWidth="1" />
          <text x={L - 9} y={yOf(v) + 3.5} textAnchor="end" fontSize="10" fill="#77716F" fontWeight="600">{v}</text>
        </g>
      ))}
      {ticks.map((t) => <text key={t.idx} x={xOf(t.idx)} y={H - 10} textAnchor="middle" fontSize="10" fill="#77716F" fontWeight="600">{t.lbl}</text>)}
      <path d={area} fill="url(#gradDash)" />
      <path d={line} fill="none" stroke="#F16F3F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Sys { code: string; name?: string; n: number }
const toItems = (s: Sys[]) => s.map((x, i) => ({ name: x.name || x.code, value: x.n, color: COLORS[i % COLORS.length] }));

export function Donut({ items: raw }: { items: Sys[] }) {
  const items = toItems(raw || []);
  if (!items.length) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140, color: 'var(--text-3)', fontSize: 12 }}>No data yet</div>;
  const total = items.reduce((a, b) => a + b.value, 0) || 1;
  const R = 60, C = 2 * Math.PI * R, SW = 17, size = 168, cx = size / 2, cy = size / 2;
  let offset = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="Records by source">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#F4EBE6" strokeWidth={SW} />
      {items.map((it) => {
        const len = (it.value / total) * C, gap = items.length > 1 ? 2.5 : 0, dash = Math.max(0.5, len - gap), off = offset;
        offset += len;
        return <circle key={it.name} className="dseg" cx={cx} cy={cy} r={R} fill="none" stroke={it.color} strokeWidth={SW} strokeLinecap="butt" strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-off} transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: 'stroke-width .16s ease,opacity .16s ease' }} />;
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" className="donut-center">{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="donut-center-sub">TOTAL</text>
    </svg>
  );
}

export function DonutLegend({ items: raw }: { items: Sys[] }) {
  const items = toItems(raw || []);
  const total = items.reduce((a, b) => a + b.value, 0) || 1;
  return <>{items.map((it) => (
    <div className="dl-row" key={it.name}>
      <span className="lg-dot" style={{ background: it.color }} />
      <span className="dl-name">{it.name}</span>
      <span className="dl-val">{it.value}<span style={{ color: 'var(--text-3)', fontWeight: 600 }}> · {Math.round((it.value / total) * 100)}%</span></span>
    </div>
  ))}</>;
}
