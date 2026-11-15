// The ERP console shell: layout + the current page + the detail drawer + toasts (ported from layout-foot.ejs).
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Layout } from './Layout';
import { Dashboard } from './Dashboard';
import { Intake } from './Intake';
import { Citizens } from './Citizens';
import { Audit } from './Audit';
import { Portals } from './Portals';
import { Sync } from './Sync';
import { Integration } from './Integration';
import { installBehaviours } from './behaviours';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConsoleBoot = Record<string, any> & { page: string; currentPath: string; systems: unknown[] };
interface Toast { id: number; msg: string }

export function Shell({ boot }: { boot: ConsoleBoot }) {
  const [drawer, setDrawer] = useState<{ title: string; body: ReactNode } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const closeRef = useRef<HTMLButtonElement>(null);
  const api = useRef<ReturnType<typeof installBehaviours> | null>(null);
  const tid = useRef(0);

  const closeDrawer = useCallback(() => setDrawer(null), []);
  const toast = useCallback((msg: string) => {
    const id = ++tid.current;
    setToasts((t) => [...t, { id, msg }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  const ctx = useMemo(() => ({
    openDrawer: (title: string, body: ReactNode) => setDrawer({ title, body }),
    goPage: (d: number) => api.current?.goPage(d),
    exportTableCSV: (f?: string) => api.current?.exportTableCSV(f),
  }), []);

  useEffect(() => { api.current = installBehaviours({ closeDrawer, toast }); return () => api.current?.dispose(); }, [closeDrawer, toast]);
  useEffect(() => { document.body.classList.toggle('no-scroll', !!drawer); if (drawer) closeRef.current?.focus(); }, [drawer]);

  // the page is rendered once and never again: its table is reordered and filtered in place by behaviours.ts
  const page = useMemo(() => <Page boot={boot} ctx={ctx} />, [boot, ctx]);

  return (
    <>
      <Layout currentPath={boot.currentPath} locals={{ filter: boot.filter }} children={page} />
      <div className={`drawer-backdrop${drawer ? ' is-open' : ''}`} id="drawerBackdrop" onClick={closeDrawer} />
      <div className={`drawer${drawer ? ' is-open' : ''}`} id="detailDrawer" role="dialog" aria-modal="true" aria-label="Record details">
        <div className="drawer-head">
          <div className="drawer-title" id="drawerTitle">{drawer ? drawer.title : 'Record details'}</div>
          <button className="drawer-close" id="drawerClose" ref={closeRef} type="button" aria-label="Close details" onClick={closeDrawer}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="drawer-body" id="drawerBody">{drawer ? drawer.body : null}</div>
      </div>
      <div className="toasts" id="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M20 6 9 17l-5-5" /></svg>{t.msg}
          </div>
        ))}
      </div>
    </>
  );
}

const Page = memo(function Page({ boot: b, ctx }: { boot: ConsoleBoot; ctx: unknown }) {
  switch (b.page) {
    case 'dashboard': return <Dashboard ctx={ctx} summary={b.summary} systems={b.systems} recent={b.recent} recentAudit={b.recentAudit} dailyIntake={b.dailyIntake} />;
    case 'intake': return <Intake ctx={ctx} system={b.system} rows={b.rows} systems={b.systems} />;
    case 'citizens': return <Citizens ctx={ctx} rows={b.rows} />;
    case 'audit': return <Audit ctx={ctx} rows={b.rows} />;
    case 'portals': return <Portals ctx={ctx} filter={b.filter} bySystem={b.bySystem} recent={b.recent} systems={b.systems} FORM_LABEL={b.FORM_LABEL} />;
    case 'sync': return <Sync ctx={ctx} rows={b.rows} summary={b.summary} total={b.total} siteFilter={b.siteFilter} pgAvailable={b.pgAvailable} />;
    default: return <Integration ctx={ctx} summary={b.summary} pgUp={b.pgUp} erpSummary={b.erpSummary} />;
  }
});
