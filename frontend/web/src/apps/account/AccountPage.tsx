import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../../shared/icons';
import { Overview } from './Overview';
import type { AccountBoot } from './types';

type View = 'overview' | 'info' | 'submissions';
const parseView = (): View => { const h = location.hash.replace('#', ''); return h === 'info' || h === 'submissions' ? h : 'overview'; };
const THEME_KEY = 'erp_auth_theme';

const navItem = 'ac-item relative flex h-10 items-center gap-[11px] rounded-xl px-[11px] text-[13.5px] text-ac-text no-underline transition-[background,color] duration-150 hover:bg-ac-chip [&_svg]:block [&_svg]:h-[19px] [&_svg]:w-[19px] [&_svg]:flex-[0_0_19px] [&_svg]:text-ac-ic hover:[&_svg]:text-ac-accent';
const navOn = 'is-active bg-[linear-gradient(90deg,#E7F7EE,#F3FBF7_70%)] font-semibold text-ac-nav-ink shadow-[inset_0_0_0_1px_rgba(174,226,200,.55)] dark:bg-none dark:bg-ac-chip dark:shadow-[inset_0_0_0_1px_rgba(127,211,174,.25)] [&_svg]:!text-ac-accent';
const group = 'mx-[11px] mb-[6px] mt-4 text-[10.5px] font-bold uppercase tracking-[.1em] text-ac-faint';
const span = 'min-w-0 flex-1 truncate';

export function AccountPage({ boot }: { boot: AccountBoot }) {
  const { site, person, portals } = boot;
  const [view, setView] = useState<View>(parseView);
  const [menu, setMenu] = useState(false);
  const [sw, setSw] = useState(false);
  const [notice, setNotice] = useState(true);
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  const swBtn = useRef<HTMLButtonElement>(null);
  const swList = useRef<HTMLUListElement>(null);

  const go = useCallback((v: View) => { try { history.replaceState(null, '', '#' + v); } catch { /* ignore */ } setView(v); setMenu(false); }, []);
  useEffect(() => { const on = () => setView(parseView()); window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on); }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenu(false); if (sw) { setSw(false); swBtn.current?.focus(); } } };
    const click = (e: MouseEvent) => { if (sw && !swList.current?.contains(e.target as Node) && !swBtn.current?.contains(e.target as Node)) setSw(false); };
    document.addEventListener('keydown', key); document.addEventListener('click', click);
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('click', click); };
  }, [sw]);

  const toggleTheme = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
    setDark(!dark);
  };
  const focusItem = (i: number) => { const items = swList.current?.querySelectorAll<HTMLElement>('[data-port-link]'); if (items?.length) items[(i + items.length) % items.length].focus(); };
  const onSwKey = (e: React.KeyboardEvent) => {
    const items = Array.from(swList.current?.querySelectorAll<HTMLElement>('[data-port-link]') ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); focusItem(i + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusItem(i - 1); }
    else if (e.key === 'Home') { e.preventDefault(); focusItem(0); }
    else if (e.key === 'End') { e.preventDefault(); focusItem(items.length - 1); }
  };

  const titles: Record<View, [string, string]> = {
    overview: ['Overview', 'What you have done on the five websites, counted from your own submissions.'],
    info: ['Account info', 'Your details, as stored on the platform and in the ERP.'],
    submissions: [`My submissions on ${site.name}`, `Every record below was entered on ${site.name} and written to two databases: this one and the ERP's. The ERP ref column is the proof.`],
  };
  const dot = ['bg-[var(--pc-1)]', 'bg-[var(--pc-2)]', 'bg-[var(--pc-3)]', 'bg-[var(--pc-4)]', 'bg-[var(--pc-5)]'];
  const code = (v: string | null) => (v ? <code>{v}</code> : <>—</>);
  const info: [string, string, React.ReactNode][] = [
    ['user', 'Name', person.fullName], ['mail', 'Email', person.email], ['phone', 'Mobile', person.mobile || '—'], ['id', 'Reference', <code>{person.personRef}</code>],
    ['calendar', 'Registered', `${person.registeredOn}, via ${person.registeredVia}`], ['database', 'In the ERP as', code(person.erpCitizenRef)],
  ];
  const cardCls = 'ac-card overflow-hidden rounded-[14px] border border-ac-line bg-ac-card shadow-[0_1px_2px_rgba(11,35,26,.05),0_8px_20px_-16px_var(--ac-shadow)]';
  const th = 'whitespace-nowrap border-b border-ac-line bg-ac-side px-4 py-[11px] text-left align-top text-[10.5px] font-extrabold uppercase tracking-[.09em] text-ac-muted';
  const td = 'whitespace-nowrap border-b border-ac-line px-4 py-[11px] text-left align-top group-last:border-b-0 group-hover:bg-ac-side';

  return (
    <div className="contents">
      <div className={`ac-notice relative flex-none bg-[#064D36] px-11 py-[7px] text-center text-[12.5px] leading-[1.3] text-white ${notice ? '' : 'hidden'}`}>
        <span>Unofficial Local Demonstration — Not an Official Government Service</span>
        <button type="button" aria-label="Dismiss this notice" onClick={() => setNotice(false)}
          className="absolute right-2 top-1/2 grid h-[26px] w-[26px] -translate-y-1/2 cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-white hover:bg-white/[.18] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-1 [&_svg]:h-[15px] [&_svg]:w-[15px]"><Icon n="close" /></button>
      </div>

      <div className={`ac-shell relative grid min-h-0 flex-1 grid-cols-[268px_minmax(0,1fr)] max-[900px]:grid-cols-[minmax(0,1fr)] ${menu ? 'menu-open' : ''}`} id="acShell">
        <aside id="acSide" aria-label="Sidebar"
          className={`ac-side flex min-h-0 flex-col overflow-y-auto border-r border-ac-line bg-[linear-gradient(180deg,#F6FCF9_0%,var(--ac-card)_34%,var(--ac-card)_100%)] px-[14px] pb-[14px] pt-[18px] dark:bg-none dark:bg-ac-side max-[900px]:absolute max-[900px]:inset-y-0 max-[900px]:left-0 max-[900px]:z-30 max-[900px]:w-[280px] max-[900px]:max-w-[86vw] max-[900px]:transition-transform max-[900px]:duration-[250ms] ${menu ? 'max-[900px]:translate-x-0 max-[900px]:shadow-[0_0_40px_rgba(0,0,0,.25)]' : 'max-[900px]:-translate-x-[102%]'}`}>
          <div className="relative flex items-center gap-2 border-b border-ac-line pb-4 pt-[2px]">
            <button ref={swBtn} id="acSwitch" type="button" aria-haspopup="menu" aria-expanded={sw} aria-controls="acSwitchMenu" title="Switch website"
              onClick={() => setSw(!sw)} onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setSw(true); window.setTimeout(() => focusItem(0), 0); } }}
              className={`m-0 flex min-w-0 flex-1 cursor-pointer items-center gap-[11px] rounded-xl border p-[6px] text-left text-inherit transition-[background,border-color] duration-150 hover:border-ac-line hover:bg-ac-chip ${sw ? 'border-ac-line bg-ac-chip' : 'border-transparent bg-transparent'}`}>
              <span className="grid h-[42px] w-[42px] flex-none place-items-center rounded-xl bg-[linear-gradient(145deg,#0F1714,#21362D)] text-[#C7F3DC] shadow-[0_8px_18px_-12px_rgba(11,35,26,.9)] [&_svg]:h-[22px] [&_svg]:w-[22px]"><Icon n="grid" /></span>
              <span className="flex min-w-0 flex-col leading-[1.25]">
                <span className="truncate text-[16px] font-bold tracking-[-.01em]">{site.name}</span>
                <span className="truncate text-[11.5px] text-ac-muted">{site.hostname} · replica</span>
              </span>
              <span className={`ml-auto grid flex-none place-items-center text-ac-ic transition-transform duration-200 [&_svg]:h-[17px] [&_svg]:w-[17px] ${sw ? 'rotate-180' : ''}`}><Icon n="chevdown" /></span>
            </button>
            <button id="acClose" type="button" aria-label="Close menu" onClick={() => setMenu(false)}
              className="hidden h-[34px] w-[34px] flex-none cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-ac-muted max-[900px]:grid [&_svg]:h-[19px] [&_svg]:w-[19px]"><Icon n="close" /></button>
            {sw && (
              <ul ref={swList} id="acSwitchMenu" role="menu" aria-label="Switch website" onKeyDown={onSwKey}
                className="absolute inset-x-0 top-[calc(100%-8px)] z-40 m-0 list-none rounded-xl border border-ac-line bg-ac-card p-[6px] shadow-[0_18px_40px_-18px_var(--ac-shadow),0_2px_6px_rgba(11,35,26,.08)]">
                {portals.map((p, i) => {
                  const cur = p.code === site.code;
                  return (
                    <li key={p.code} role="none">
                      <a role="menuitem" data-port-link href={p.href} aria-current={cur ? 'true' : undefined}
                        onClick={(e) => { e.preventDefault(); if (cur) setSw(false); else window.location.href = p.href + location.hash; }}
                        className={`flex items-center gap-[11px] rounded-[9px] px-[10px] py-[9px] text-ac-text no-underline hover:bg-ac-chip focus-visible:bg-ac-chip ${cur ? 'is-current bg-ac-chip font-semibold' : ''}`}>
                        <span className={`h-[10px] w-[10px] flex-none rounded-[3px] ${dot[i]}`} />
                        <span className="flex min-w-0 flex-1 flex-col leading-[1.3]"><span className="truncate text-[13.5px]">{p.name}</span><span className="truncate text-[11px] font-normal text-ac-muted">{p.hostname}</span></span>
                        {cur && <span className="grid flex-none text-ac-accent [&_svg]:h-4 [&_svg]:w-4"><Icon n="check" /></span>}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <nav className="flex flex-1 flex-col gap-[2px] pt-[6px]" aria-label="Account navigation">
            <div className={group}>Account</div>
            <a href="#overview" className={`${navItem} ${view === 'overview' ? navOn : ''}`} aria-current={view === 'overview' ? 'page' : undefined} onClick={(e) => { e.preventDefault(); go('overview'); }}><Icon n="user" /><span className={span}>Overview</span></a>
            <a href="#submissions" className={`${navItem} ${view === 'submissions' ? navOn : ''}`} aria-current={view === 'submissions' ? 'page' : undefined} onClick={(e) => { e.preventDefault(); go('submissions'); }}>
              <Icon n="list" /><span className={span}>My submissions</span>
              <b className="rounded-full border border-ac-line bg-ac-card px-[7px] py-px text-[11px] font-semibold text-ac-accent-ink">{boot.submissions.length}</b></a>
            <div className={group}>{site.name}</div>
            <a href="/" className={navItem}><Icon n="home" /><span className={span}>Portal home</span></a>
            {boot.links.map((l) => <a key={l[1]} href={l[1]} className={navItem}><Icon n={l[2]} /><span className={span}>{l[0]}</span></a>)}
          </nav>

          <div className="mt-4 flex flex-col gap-[10px] border-t border-ac-line pt-[14px]">
            <a href="#info" aria-label="Account info" aria-current={view === 'info' ? 'page' : undefined} onClick={(e) => { e.preventDefault(); go('info'); }}
              className={`ac-profile relative flex items-center gap-[11px] rounded-xl border px-[11px] py-2 text-ac-text no-underline transition-[background,border-color] duration-150 hover:bg-ac-chip ${view === 'info' ? 'is-active border-[rgba(174,226,200,.9)] bg-[linear-gradient(90deg,#E7F7EE,#F3FBF7_70%)] dark:border-ac-line dark:bg-none dark:bg-ac-chip dark:shadow-[inset_0_0_0_1px_rgba(127,211,174,.25)]' : 'border-ac-line bg-ac-card'}`}>
              <span className="grid h-[34px] w-[34px] flex-[0_0_34px] place-items-center rounded-full bg-[linear-gradient(145deg,#0F1714,#21362D)] text-[14px] font-bold text-[#C7F3DC]" aria-hidden="true">{(person.fullName || '?').trim().charAt(0).toUpperCase()}</span>
              <span className="flex min-w-0 flex-col leading-[1.3]"><span className="truncate text-[13.5px] font-semibold">{person.fullName}</span><span className="truncate text-[11.5px] text-ac-muted">Account info</span></span>
              <svg className="ml-auto h-[15px] w-[15px] flex-none text-ac-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
            </a>
            <form className="m-0" method="post" action="/account/logout">
              <button type="submit" className="flex h-10 w-full cursor-pointer items-center justify-center gap-[9px] rounded-lg border-[1.5px] border-ac-line bg-transparent text-[13.5px] text-ac-text transition-[background] duration-150 hover:bg-ac-chip [&_svg]:h-4 [&_svg]:w-4"><Icon n="logout" /><span>Sign out of all portals</span></button>
            </form>
          </div>
        </aside>
        {menu && <div id="acScrim" className="absolute inset-0 z-20 bg-[rgba(20,18,16,.45)]" onClick={() => setMenu(false)} />}

        <main id="main" className="min-h-0 min-w-0 overflow-y-auto px-8 pb-10 pt-[26px] max-[900px]:px-4 max-[900px]:pb-8 max-[900px]:pt-[18px]">
          <header className="mx-auto mb-[22px] flex max-w-[1100px] items-start gap-[14px]">
            <button id="acMenu" className="ac-menu hidden h-[38px] w-[38px] flex-none cursor-pointer place-items-center rounded-lg border border-ac-line bg-ac-card text-ac-text max-[900px]:grid [&_svg]:h-[19px] [&_svg]:w-[19px]"
              type="button" aria-label="Open menu" aria-controls="acSide" aria-expanded={menu} onClick={() => setMenu(true)}><Icon n="menu" /></button>
            <div className="min-w-0 flex-1">
              <h1 className="m-0 text-[26px] font-bold leading-[1.2] tracking-[-.02em] max-[900px]:text-[22px]" id="acHeading">{titles[view][0]}</h1>
              <p className="m-0 mt-[5px] text-[13.5px] text-ac-muted" id="acSub">{titles[view][1]}</p>
            </div>
            <button className="ac-theme grid h-[38px] w-[38px] flex-none cursor-pointer place-items-center rounded-full border border-ac-line bg-ac-card text-ac-text [&_svg]:h-[17px] [&_svg]:w-[17px]"
              id="lgTheme" type="button" aria-pressed={dark} aria-label="Switch colour theme" title="Switch colour theme" onClick={toggleTheme}>
              <Icon n={dark ? 'sun' : 'moon'} />
            </button>
          </header>

          <section className="mx-auto max-w-[1100px]" hidden={view !== 'overview'} id="view-overview">{view === 'overview' && <Overview boot={boot} openSubmissions={() => go('submissions')} />}</section>

          <section className="mx-auto max-w-[1100px]" hidden={view !== 'info'} id="view-info">
            {view === 'info' && (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[14px] max-[480px]:grid-cols-[minmax(0,1fr)]">
                {info.map(([ic, label, val]) => (
                  <div key={label} className="flex min-w-0 items-stretch overflow-hidden rounded-xl border border-ac-line bg-ac-card">
                    <span className="grid w-[50px] flex-none place-items-center border-r border-ac-line bg-ac-chip text-ac-accent-ink [&_svg]:h-[18px] [&_svg]:w-[18px]"><Icon n={ic} /></span>
                    <div className="min-w-0 px-[14px] py-3"><div className="text-[11.5px] leading-[1.3] text-ac-muted">{label}</div><div className="break-words text-[14.5px] font-semibold leading-[1.4] [overflow-wrap:anywhere]">{val}</div></div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mx-auto max-w-[1100px]" hidden={view !== 'submissions'} id="view-submissions">
            {view === 'submissions' && (
              <div className={cardCls}>
                <div className="flex items-center justify-between gap-[10px] border-b border-ac-line px-5 py-4">
                  <div className="text-[15px] font-bold">Submissions on {site.name}</div>
                  <span className="rounded-full bg-ac-chip px-[10px] py-[2px] text-[12px] font-bold text-ac-accent-ink">{boot.submissions.length}</span>
                </div>
                {!boot.submissions.length ? (
                  <div className="px-5 py-11 text-center">
                    <span className="mb-3 inline-grid h-12 w-12 place-items-center rounded-xl bg-ac-chip text-ac-accent-ink [&_svg]:h-[22px] [&_svg]:w-[22px]"><Icon n="inbox" /></span>
                    <p className="m-0">Nothing submitted on {site.name} yet.</p>
                    <p className="m-0 mt-1 text-[13px] text-ac-muted">Fill in a form on this portal — it will appear here and in the ERP console at the same time.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[13.5px]">
                      <thead><tr>{['Portal', 'Form', 'Portal ref', 'ERP ref', 'When'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {boot.submissions.map((s, i) => (
                          <tr key={i} className="group">
                            <td className={td}>{s.site}</td>
                            <td className={td}>{s.heading || s.route}<br /><code>{s.route}</code></td>
                            <td className={td}><code>{s.reference}</code></td>
                            <td className={td}>{s.erpRef ? <code>{s.erpRef}</code> : <>—</>}</td>
                            <td className={td}>{s.createdAt}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
