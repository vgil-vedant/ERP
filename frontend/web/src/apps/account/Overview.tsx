import { Icon } from '../../shared/icons';
import type { AccountBoot } from './types';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const nice = (d: string) => { const p = d.split('-'); return `${Number(p[2])} ${MON[Number(p[1]) - 1]} ${p[0]}`; };
const stamp = (iso: string | null) => (iso ? iso.slice(0, 16).replace('T', ' ') + ' UTC' : '—');
const plural = (n: number, w: string) => `${w}${n === 1 ? '' : 's'}`;

const DOT = ['bg-[var(--pc-1)]', 'bg-[var(--pc-2)]', 'bg-[var(--pc-3)]', 'bg-[var(--pc-4)]', 'bg-[var(--pc-5)]'];
const SEG = ['stroke-[var(--pc-1)]', 'stroke-[var(--pc-2)]', 'stroke-[var(--pc-3)]', 'stroke-[var(--pc-4)]', 'stroke-[var(--pc-5)]'];
const HEAT = ['fill-[var(--h0)]', 'fill-[var(--h1)]', 'fill-[var(--h2)]', 'fill-[var(--h3)]', 'fill-[var(--h4)]'];

const card = 'ac-card overflow-hidden rounded-[14px] border border-ac-line bg-ac-card shadow-[0_1px_2px_rgba(11,35,26,.05),0_8px_20px_-16px_var(--ac-shadow)]';
const cardHead = 'flex items-center justify-between gap-[10px] border-b border-ac-line px-5 py-4';
const pill = 'rounded-full bg-ac-chip px-[10px] py-[2px] text-[12px] font-bold text-ac-accent-ink';
const lbl = 'text-[11.5px] leading-[1.3] text-ac-muted';

interface Item { label: string; count: number; i: number }

function Donut({ items, total, centre, aria }: { items: Item[]; total: number; centre: string; aria: string }) {
  let acc = 0;
  return (
    <svg className="ac-donut h-[158px] w-[158px] flex-none max-[480px]:h-[140px] max-[480px]:w-[140px]" viewBox="0 0 42 42" role="img" aria-label={aria}>
      <circle className="stroke-ac-chip" cx="21" cy="21" r="15.9155" fill="none" strokeWidth="5" />
      {total > 0 && items.filter((it) => it.count).map((it) => {
        const pct = (it.count / total) * 100;
        const off = 25 - acc; acc += pct;
        return (
          <circle key={it.label} className={`${SEG[it.i]} transition-opacity duration-150 hover:opacity-80`} cx="21" cy="21" r="15.9155" fill="none" strokeWidth="5"
            strokeDasharray={`${pct.toFixed(3)} ${(100 - pct).toFixed(3)}`} strokeDashoffset={off.toFixed(3)}>
            <title>{`${it.label}: ${it.count}`}</title>
          </circle>
        );
      })}
      <text className="fill-ac-text text-[8px] font-bold" x="21" y="21.5" textAnchor="middle" dominantBaseline="middle">{total}</text>
      <text className="fill-ac-muted text-[2.8px]" x="21" y="27" textAnchor="middle">{centre}</text>
    </svg>
  );
}

function Legend({ items, empty }: { items: Item[]; empty?: string }) {
  return (
    <ul className="m-0 flex min-w-[150px] flex-1 list-none flex-col gap-[9px] p-0">
      {!items.length && empty && <li className="flex min-w-0 items-center gap-[9px] text-[13.5px] text-ac-muted">{empty}</li>}
      {items.map((it) => (
        <li key={it.label} className="flex min-w-0 items-center gap-[9px] text-[13.5px]">
          <span className={`h-[10px] w-[10px] flex-none rounded-[3px] ${DOT[it.i]}`} />
          <span className="min-w-0 flex-1 truncate" title={it.label}>{it.label}</span>
          <b className="tabular-nums">{it.count}</b>
        </li>
      ))}
    </ul>
  );
}

export function Overview({ boot, openSubmissions }: { boot: AccountBoot; openSubmissions: () => void }) {
  const { activity: a, site, person } = boot;
  const STEP = 16, LEFT = 28, TOP = 18, heat = a.heat;
  const portalItems: Item[] = a.byPortal.map((p, i) => ({ label: p.name, count: p.count, i }));
  const formItems: Item[] = a.here.byForm.slice(0, 4).map((f, i) => ({ label: f.label, count: f.count, i }));
  if (a.here.byForm.length > 4) formItems.push({ label: 'Other forms', count: a.here.byForm.slice(4).reduce((t, f) => t + f.count, 0), i: 4 });

  const kpi = (icon: string, label: string, big: React.ReactNode, foot: string, small?: boolean) => (
    <div className="flex min-w-0 flex-col justify-between gap-[14px] rounded-[14px] border border-ac-line bg-ac-card p-4">
      <div className="flex min-w-0 items-start gap-[13px]">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-[10px] bg-ac-chip text-ac-accent-ink [&_svg]:h-[19px] [&_svg]:w-[19px]"><Icon n={icon} /></span>
        <div><div className={lbl}>{label}</div>
          <div className={small ? 'pt-[2px] text-[15px] font-bold leading-normal tabular-nums' : 'text-[26px] font-bold leading-[1.15] tracking-[-.02em] tabular-nums'}>{big}</div></div>
      </div>
      <div className="border-t border-ac-line pt-[10px] text-[12px] text-ac-muted">{foot}</div>
    </div>
  );
  const sm = (t: string) => <small className="text-[13px] font-medium tracking-normal text-ac-muted">{t}</small>;

  return (
    <>
      {boot.justRegistered && (
        <div className="mb-4 rounded-[10px] border border-ac-good-line bg-ac-good-bg px-[15px] py-3 text-[13.5px] text-ac-good-ink" role="status">
          Registered. This one account now works on every portal — and your details are already in the ERP database as <code>{person.erpCitizenRef || person.personRef}</code>.
        </div>
      )}
      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(215px,1fr))] gap-[14px]">
        {kpi('list', 'Submissions', a.total, `across all ${a.portalsTotal} websites`)}
        {kpi('grid', 'Websites used', <>{a.portalsUsed}{sm(` of ${a.portalsTotal}`)}</>, 'with at least one submission')}
        {kpi('database', 'Confirmed in the ERP', <>{a.confirmed}{sm(` of ${a.total}`)}</>, 'each has an ERP ref')}
        {kpi('calendar', 'Last activity', a.last ? stamp(a.last) : '—', a.last ? 'most recent submission' : 'nothing submitted yet', true)}
      </div>

      <h2 className="mb-3 mt-[22px] text-[15px] font-bold">The five websites</h2>
      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-[14px]">
        {a.byPortal.map((p, i) => {
          const portal = boot.portals.find((x) => x.code === p.code);
          const linkCls = 'mt-auto flex items-center gap-[6px] border-t border-ac-line pt-[11px] text-[12.5px] font-semibold text-ac-accent-ink no-underline hover:underline [&_svg]:h-[13px] [&_svg]:w-[13px]';
          return (
            <article key={p.code} className={`flex min-w-0 flex-col gap-[3px] rounded-[14px] border bg-ac-card p-4 ${p.current ? 'border-ac-accent shadow-[inset_0_0_0_1px_var(--ac-accent)]' : 'border-ac-line'}`}>
              <div className="mb-[6px] flex min-w-0 items-center gap-2">
                <span className={`h-[10px] w-[10px] flex-none rounded-[3px] ${DOT[i]}`} />
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{p.name}</span>
                {p.current && <span className="rounded-full bg-ac-accent px-2 py-px text-[10.5px] font-bold text-[#0F1714]">this site</span>}
              </div>
              <div className="mb-[14px] text-[24px] font-bold tracking-[-.02em] tabular-nums">{p.count}<small className="ml-[5px] text-[12px] font-medium tracking-normal text-ac-muted"> {plural(p.count, 'submission')}</small></div>
              {!p.current
                ? <a className={linkCls} href={portal?.href}>Open <Icon n="external" /></a>
                : <a className={linkCls} href="#submissions" onClick={(e) => { e.preventDefault(); openSubmissions(); }} aria-label={`Open my submissions on ${p.name}`}>Open <Icon n="external" /></a>}
            </article>
          );
        })}
      </div>

      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] gap-4">
        <section className={card} aria-labelledby="ac-h-portals">
          <div className={cardHead}><div className="text-[15px] font-bold" id="ac-h-portals">Activity by website</div><span className={pill}>{a.total}</span></div>
          <div className="flex flex-wrap items-center gap-[22px] p-5 max-[480px]:justify-center">
            <Donut items={portalItems} total={a.total} centre="submissions" aria={`Submissions by website: ${portalItems.map((i) => `${i.label} ${i.count}`).join(', ')}`} />
            <Legend items={portalItems} />
          </div>
          {!a.total && <p className="m-0 px-5 pb-[18px] text-[12.5px] text-ac-muted">No submissions yet, so there is nothing to chart.</p>}
        </section>
        <section className={card} aria-labelledby="ac-h-forms">
          <div className={cardHead}><div className="text-[15px] font-bold" id="ac-h-forms">Forms used on {site.name}</div><span className={pill}>{a.here.count}</span></div>
          <div className="flex flex-wrap items-center gap-[22px] p-5 max-[480px]:justify-center">
            <Donut items={formItems} total={a.here.count} centre={`on ${site.name}`}
              aria={`Forms used on ${site.name}: ${formItems.length ? formItems.map((i) => `${i.label} ${i.count}`).join(', ') : 'none'}`} />
            <Legend items={formItems} empty={`No form submitted on ${site.name} yet.`} />
          </div>
        </section>
      </div>

      <section className={`${card} mb-2`} aria-labelledby="ac-h-heat">
        <div className={cardHead}><div className="text-[15px] font-bold" id="ac-h-heat">Activity calendar</div>
          <span className="text-[12.5px] text-ac-muted">{heat.inWindow} {plural(heat.inWindow, 'submission')} in the last {heat.weeks} weeks, all websites</span></div>
        <div className="overflow-x-auto px-5 pb-4 pt-[18px]">
          <svg className="block h-auto w-full min-w-[340px] max-w-[440px]" viewBox={`0 0 ${LEFT + heat.weeks * STEP} ${TOP + 7 * STEP}`} role="img" aria-label={`Calendar of submissions per day, ${heat.from} to ${heat.to}`}>
            {['Mon', 'Wed', 'Fri'].map((d, i) => <text key={d} className="fill-ac-muted text-[6px]" x="0" y={TOP + i * 2 * STEP + 10}>{d}</text>)}
            {heat.columns.map((col, w) => {
              const first = col.find((c) => !c.future);
              return (
                <g key={w}>
                  {first && Number(first.date.slice(8)) <= 7 && <text className="fill-ac-muted text-[6px]" x={LEFT + w * STEP} y="10">{MON[Number(first.date.slice(5, 7)) - 1]}</text>}
                  {col.map((c, d) => c.future ? null : (
                    <rect key={d} className={`${HEAT[c.level]} stroke-[rgba(0,0,0,.04)]`} strokeWidth=".5" x={LEFT + w * STEP} y={TOP + d * STEP} width="13" height="13" rx="3">
                      <title>{`${nice(c.date)}: ${c.count} ${plural(c.count, 'submission')}`}</title>
                    </rect>
                  ))}
                </g>
              );
            })}
          </svg>
          <div className="mt-[10px] flex items-center gap-[7px] text-[11.5px] text-ac-muted" aria-hidden="true">Less
            <svg viewBox="0 0 80 13" width="80" height="13">{[0, 1, 2, 3, 4].map((l) => <rect key={l} className={`${HEAT[l]} stroke-[rgba(0,0,0,.04)]`} strokeWidth=".5" x={l * 16} y="0" width="13" height="13" rx="3" />)}</svg>
            More</div>
        </div>
      </section>
      {a.total >= 100 && <p className="text-[12.5px] text-ac-muted">Counts cover your latest 100 submissions.</p>}
    </>
  );
}
