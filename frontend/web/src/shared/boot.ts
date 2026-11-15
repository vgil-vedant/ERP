// The server puts each page's data in <script type="application/json" id="boot">. JSON blocks are never executed,
// so the portals' CSP (script-src 'self') stays untouched.
export function readBoot<T>(): T {
  const el = document.getElementById('boot');
  if (!el || !el.textContent) throw new Error('boot data missing');
  return JSON.parse(el.textContent) as T;
}
