/** Turns an inline CSS string ("width:10%;color:red") into a React style object (used where the string has dynamic parts). */
export function S(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0 || !decl.trim()) continue;
    const k = decl.slice(0, i).trim(), v = decl.slice(i + 1).trim();
    out[k.startsWith('--') ? k : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
  }
  return out;
}

/**
 * Parses a run of HTML attributes ('required data-x="1" maxlength=30') into React props. The old templates printed this text
 * through an escaping output tag, which turns every quote into &#34;: an attribute written as aria-current="page" therefore reached
 * the browser with the value "page" (quotes included). The same happens here so the pages behave exactly as before.
 */
const ENT: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&#34;', "'": '&#39;' };
const UNENT: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&#34;': '"', '&quot;': '"', '&#39;': "'" };
const MAP: Record<string, string> = { class: 'className', for: 'htmlFor', maxlength: 'maxLength', minlength: 'minLength', readonly: 'readOnly', novalidate: 'noValidate', tabindex: 'tabIndex', autofocus: 'autoFocus', autocomplete: 'autoComplete', inputmode: 'inputMode', colspan: 'colSpan', rowspan: 'rowSpan' };
export function A(text: unknown, raw = false): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const plain = String(text == null ? '' : text);
  const src = raw ? plain : plain.replace(/[&<>"']/g, (c) => ENT[c]);   // raw = the old template used the unescaped output tag
  const re = /([^\s=]+)(?:=([^\s]+))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const name = MAP[m[1]] || m[1];
    out[name] = m[2] === undefined ? true : m[2].replace(/&(?:amp|lt|gt|#34|quot|#39);/g, (e) => UNENT[e]);
  }
  return out;
}

import { createElement } from 'react';
import type { ReactNode } from 'react';

/** The old templates' unescaped output tag (<%- html %>) used mid-markup: the (trusted, server-made) HTML becomes React elements. */
const VOIDS = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'use', 'stop']);
const DEC: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#34;': '"', '&#39;': "'", '&nbsp;': ' ' };
const camel = (k: string) => (k === 'class' ? 'className' : k === 'for' ? 'htmlFor' : k.startsWith('data-') || k.startsWith('aria-') ? k : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()));
export function rawHtml(html: unknown): ReactNode {
  const src = String(html == null ? '' : html);
  type Frame = { tag: string; props: Record<string, unknown>; kids: ReactNode[] };
  const root: Frame = { tag: '', props: {}, kids: [] };
  const stack: Frame[] = [root];
  const re = /<(\/)?([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/)?>|([^<]+)/g;
  let m: RegExpExecArray | null, k = 0;
  const close = () => { const f = stack.pop()!; stack[stack.length - 1].kids.push(createElement(f.tag, { ...f.props, key: k++ }, ...f.kids)); };
  while ((m = re.exec(src))) {
    if (m[5] !== undefined) { stack[stack.length - 1].kids.push(m[5].replace(/&(?:amp|lt|gt|quot|#34|#39|nbsp);/g, (e) => DEC[e])); continue; }
    const tag = m[2].toLowerCase();
    if (m[1]) { if (stack.length > 1) close(); continue; }
    const props: Record<string, unknown> = {};
    for (const a of m[3].matchAll(/([^\s=]+)(?:="([^"]*)"|='([^']*)')?/g)) {
      const v = a[2] !== undefined ? a[2] : a[3];
      props[camel(a[1])] = v === undefined ? true : v.replace(/&(?:amp|lt|gt|quot|#34|#39);/g, (e) => DEC[e]);
    }
    if (m[4] || VOIDS.has(tag)) stack[stack.length - 1].kids.push(createElement(tag, { ...props, key: k++ }));
    else stack.push({ tag, props, kids: [] });
  }
  while (stack.length > 1) close();
  return root.kids;
}
