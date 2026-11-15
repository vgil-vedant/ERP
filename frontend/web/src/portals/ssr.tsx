// Server-side rendering of the portal replicas. The portals' own servers call render() for every page, so the HTML
// (forms, messages, banner) is in the response exactly as before. The page carries its data as JSON; the browser bundle
// (client.tsx) hydrates it and starts the page's behaviours.
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import * as cctns from './cctns/views.generated';
import * as eforensics from './eforensics/views.generated';
import * as ecourts from './ecourts/views.generated';
import * as aadhaar from './aadhaar/views.generated';
import * as eprisons from './eprisons/views.generated';

type Mod = { views: Record<string, (L: any) => any>; localNames: string[] }; // eslint-disable-line @typescript-eslint/no-explicit-any
const PORTALS: Record<string, Mod> = { cctns, eforensics, ecourts, aadhaar, eprisons };
const HYDRATED = new Set(['cctns', 'eforensics', 'ecourts', 'aadhaar', 'eprisons']);

export const has = (portal: string, view: string) => !!(PORTALS[portal] && PORTALS[portal].views[view]);

// JSON inside a <script>: "<" is escaped so the data can never close the tag. "://" is written as ":\/\/" (still valid JSON, identical once
// parsed) so addresses of the original sites that sit in the page data are not literal links in the page source.
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
// a Date travels as {__date: iso} and is turned back into a Date by the browser bundle
function dateAware(this: Record<string, unknown>, k: string, v: unknown) { const raw = this[k]; return raw instanceof Date ? { __date: raw.toISOString() } : v; }
const safeJson = (o: unknown) => JSON.stringify(o, dateAware).replace(/</g, '\\u003c').split(LS).join('\\u2028').split(PS).join('\\u2029').replace(/:\/\//g, ':\\/\\/');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function render(portal: string, view: string, locals: any): string {
  const mod = PORTALS[portal];
  const fn = mod && mod.views[view];
  if (!fn) throw new Error(`no React view for ${portal}/${view}`);
  let boot = '';
  if (HYDRATED.has(portal)) {
    const pick: Record<string, unknown> = {};
    for (const k of mod.localNames) if (k !== '__boot' && locals[k] !== undefined) pick[k] = locals[k];
    boot = safeJson({ portal, view, locals: pick });
  }
  // locals travel inside one prop: a template local named `ref` or `key` would otherwise be swallowed by React
  const L = { ...locals, __boot: boot };
  const Root = ({ L: l }: { L: unknown }) => fn(l);
  return '<!doctype html>\n' + renderToString(createElement(Root, { L }));
}
