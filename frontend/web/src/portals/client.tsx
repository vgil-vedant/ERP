// Browser entry of the portal replicas: hydrates the server-rendered page with the same React view, then starts its behaviours.
import { createElement, useEffect } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { install } from './behaviours';

type Mod = { views: Record<string, (L: unknown) => unknown>; scripts?: Record<string, string[]> };
// ePrisons keeps several plain page scripts; they are bundled unchanged and started after the page has been hydrated
const EPRISONS_SCRIPTS = import.meta.glob('../../../portals/eprisons/public/js/*.js');

const LOADERS: Record<string, () => Promise<Mod>> = {
  cctns: () => import('./cctns/views.generated'),
  eforensics: () => import('./eforensics/views.generated'),
  ecourts: () => import('./ecourts/views.generated'),
  aadhaar: () => import('./aadhaar/views.generated'),
  eprisons: () => import('./eprisons/views.generated'),
};

async function main() {
  const el = document.getElementById('boot');
  if (!el || !el.textContent) return;
  const raw = el.textContent;
  const boot = JSON.parse(raw, (_k, v) => (v && typeof v === 'object' && typeof v.__date === 'string' ? new Date(v.__date) : v)) as { portal: string; view: string; locals: Record<string, unknown> };
  const load = LOADERS[boot.portal];
  if (!load) return;
  const mod = await load();
  const { views } = mod;
  const fn = views[boot.view];
  if (!fn) return;
  const L = { ...boot.locals, __boot: raw };
  const Root = () => {
    useEffect(() => {
      if (boot.portal === 'eprisons') {
        for (const name of (mod.scripts && mod.scripts[boot.view]) || []) {
          const load = EPRISONS_SCRIPTS[`../../../portals/eprisons/public/js/${name}.js`];
          if (load) void load();
        }
      } else install(boot.portal);
    }, []);
    return fn(L) as never;
  };
  hydrateRoot(document, createElement(Root), { onRecoverableError: (e) => console.error('[hydration]', e) });
}
void main();
