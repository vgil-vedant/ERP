// The Person Lookup view of the hub. The page itself is the shared module in
// frontend/shared/person-lookup (also used by the ERP console), served by the hub
// under /assets/lookup/. It is loaded the first time the view opens and mounted once.
//
// The module keeps the person it is showing in the address (?ref=, ?q=) next to
// the hub's own #view, so the back button steps out of a profile to the search
// and then to the idle panes. Opening the view from the navigation or the
// breadcrumb is a fresh start instead: the hub clears those parameters and calls
// syncLookup(), and the pane goes back to "Live from the departments".
import { useEffect, useRef, useState } from 'react';

interface LookupApi { focus: () => void; reset: () => void; applyUrl: () => void }
interface LookupWindow extends Window {
  PersonLookup?: { mount: (el: HTMLElement, opts: Record<string, unknown>) => LookupApi };
  WorkflowProgressCard?: unknown;
}

const BASE = '/assets/lookup/';
let loading: Promise<void> | null = null;
// The module is mounted once for the life of the page, so the hub can reach it.
let instance: LookupApi | null = null;

/** Make the lookup pane match the address. The hub calls this when it navigates to the view. */
export function syncLookup() { if (instance) instance.applyUrl(); }

function loadModule(): Promise<void> {
  if (loading) return loading;
  const css = (href: string) => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    document.head.appendChild(l);
  };
  const js = (src: string) => new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.async = false;
    s.onload = () => resolve();
    // drop a tag that failed, so the next attempt really loads the file again
    s.onerror = () => { s.remove(); reject(new Error(src)); };
    document.head.appendChild(s);
  });
  css(BASE + 'workflow-progress.css');
  css(BASE + 'person-lookup.css');
  loading = js(BASE + 'workflow-progress.js').then(() => js(BASE + 'person-lookup.js'));
  loading.catch(() => { loading = null; });
  return loading;
}

export function LookupView({ active }: { active: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<LookupApi | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!active) return;
    if (api.current) { api.current.focus(); return; }
    let cancelled = false;
    loadModule().then(() => {
      const w = window as LookupWindow;
      if (cancelled || api.current || !host.current) return;
      if (!w.PersonLookup || !w.WorkflowProgressCard) { setFailed(true); return; }
      api.current = w.PersonLookup.mount(host.current, { api: '/api/lookup', urlState: true, loginUrl: '/login', revealAadhaar: true });
      instance = api.current;
    }, () => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [active]);

  return (
    <section className={'view' + (active ? ' is-active' : '')} id="view-lookup" data-title="Person Lookup" data-section="ERP Management"
      data-desc="One identifier in, everything UIDAI, CCTNS, e-Forensics, eCourts and ePrisons hold about the person out.">
      {failed
        ? <div className="card"><div className="card-title">Person lookup unavailable</div><div className="card-sub">Its script did not load. Reload the page.</div></div>
        : <div ref={host} />}
    </section>
  );
}
