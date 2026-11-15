#!/usr/bin/env python3
"""Converts every view of a portal (frontend/portals/<name>/views/**.ejs) into one TSX module.
Views are the pages and custom/ files; partials (head/header/footer) are inlined; every other partial and every _*.ejs becomes a
function component called through inc(). Usage: gen_portal_views.py <portal> [extra,locals]
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
import ejs_to_jsx as E

portal = sys.argv[1]
extra = [x for x in (sys.argv[2] if len(sys.argv) > 2 else '').split(',') if x] + ['__boot']
# the plain script tag becomes: boot data + the bundle that hydrates the page and runs its behaviours
BOOT = '<script id="boot" type="application/json"><%- __boot %></script><script type="module" src="/account/ui/app/portal.js"></script>'
SCRIPT_TAG = re.compile(r'<script src="/static/js/([\w-]+)\.js" defer></script>')
USED = {}   # view key -> script names (ePrisons keeps several plain scripts; the browser bundle loads the right ones)
SCRIPT_REPL = [('<script src="/static/js/replica.js" defer></script>', '<script id="boot" type="application/json"><%- __boot %></script><script type="module" src="/account/ui/app/portal.js"></script>')] if portal != 'eprisons' else []
def swap_scripts(src):
    if portal == 'eprisons':
        names = SCRIPT_TAG.findall(src)
        if names:
            src = SCRIPT_TAG.sub('', src)
            src = src.replace('</body>', BOOT + '</body>', 1) if '</body>' in src else src + BOOT
            CUR.extend(n for n in names if n not in CUR)
        return src
    for a, b in SCRIPT_REPL: src = src.replace(a, b)
    return src
CUR = []
E.KEEP_SCRIPTS = True
E.TRANSFORM = lambda s: swap_scripts(s)
root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'portals', portal, 'views'))
out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src', 'portals', portal))
os.makedirs(out_dir, exist_ok=True)
INLINED = {'head', 'header', 'footer'}

views, partials = [], []
for dirpath, _, files in sorted(os.walk(root)):
    rel_dir = os.path.relpath(dirpath, root)
    for f in sorted(files):
        if not f.endswith('.ejs'): continue
        full = os.path.join(dirpath, f)
        in_partials = rel_dir.split(os.sep)[0] == 'partials'
        if in_partials and rel_dir == 'partials' and f[:-4] in INLINED: continue
        if in_partials or f.startswith('_'):
            key = os.path.relpath(full, os.path.join(root, 'partials')).replace(os.sep, '/')[:-4] if in_partials else f[:-4]
            partials.append((key, full))
        else:
            views.append((os.path.relpath(full, root).replace(os.sep, '/')[:-4], full))

# free variables of the templates = the locals the servers pass
KEYWORDS = set('if else for while return var let const function typeof new in of true false null undefined this try catch throw switch case break continue default delete void instanceof do'.split())
GLOBALS = set('Object Math String Array JSON Number Boolean Date parseInt parseFloat isNaN encodeURIComponent decodeURIComponent RegExp Set Map Error console process require include'.split())
def codes(src):
    return [m.group(2) for m in re.finditer(r'<%([-=]?)([\s\S]*?)%>', re.sub(r'<%#[\s\S]*?%>', '', src))]
free_all = set()
declared_by = {}
for _, f in views + partials + [(None, os.path.join(root, 'partials', n + '.ejs')) for n in INLINED if os.path.exists(os.path.join(root, 'partials', n + '.ejs'))]:
    src = open(f, encoding='utf-8').read()
    declared, used = set(), set()
    for c in codes(src):
        c = re.sub(r'/\*[\s\S]*?\*/', '', c); c = re.sub(r'(?m)(?<![:\'"])//.*$', '', c)   # JS comments
        c2 = re.sub(r"'[^'\\]*(?:\\.[^'\\]*)*'|\"[^\"\\]*(?:\\.[^\"\\]*)*\"", "''", c)   # drop string literals
        for st in re.findall(r'\b(?:const|let|var)\s+([^;]+)', c2):
            depth, cur, parts_ = 0, '', []
            for ch in st:
                if ch in '([{': depth += 1
                elif ch in ')]}': depth -= 1
                if ch == ',' and depth == 0: parts_.append(cur); cur = ''
                else: cur += ch
            parts_.append(cur)
            for ptxt in parts_:
                mm = re.match(r'\s*([A-Za-z_$][\w$]*)', ptxt)
                if mm: declared.add(mm.group(1))
        for m in re.finditer(r'function\s*\w*\s*\(([^)]*)\)', c2): declared |= {x.strip() for x in m.group(1).split(',') if x.strip()}
        for m in re.finditer(r'(?:^|[(,\s])([A-Za-z_$][\w$]*)\s*=>', c2): declared.add(m.group(1))
        for m in re.finditer(r'(?<![.\w$])([A-Za-z_$][\w$]*)', c2): used.add(m.group(1))
    free_all |= (used - declared)
    declared_by[f] = declared
locals_ = sorted((free_all - KEYWORDS - GLOBALS) | set(extra))
print(portal, 'locals:', ', '.join(locals_))

def balance(src):
    """A template that opens a tag in one <% if %> branch and closes it in a later one cannot be a tree. The inner markup is
    repeated in each branch, which renders exactly the same HTML."""
    open_re = re.compile(r"<% if \((?P<c>[^)]*)\) \{ %>(?P<a><(?!/)(?:[^>%]|<%[\s\S]*?%>)*>)<% \} else \{ %>(?P<b><(?!/)(?:[^>%]|<%[\s\S]*?%>)*>)<% \} %>")
    while True:
        m = open_re.search(src)
        if not m: return src
        close_re = re.compile(r"<% if \(" + re.escape(m.group('c')) + r"\) \{ %>(?P<ca></[a-z]+>)<% \} else \{ %>(?P<cb></[a-z]+>)<% \} %>")
        mc = close_re.search(src, m.end())
        if not mc: return src
        inner = src[m.end():mc.start()]
        rep = ('<% if (' + m.group('c') + ') { %>' + m.group('a') + inner + mc.group('ca') + '<% } else { %>' + m.group('b') + inner + mc.group('cb') + '<% } %>')
        src = src[:m.start()] + rep + src[mc.end():]

def fn_name(prefix, key): return prefix + re.sub(r'[^A-Za-z0-9]', '_', key)
def conv(key, full, prefix):
    CUR.clear()
    inl = set().union(*[declared_by.get(os.path.join(root, 'partials', n + '.ejs'), set()) for n in INLINED]) if prefix == 'V_' else set()
    mine = [x for x in locals_ if x not in declared_by.get(full, set()) and x not in inl]
    out = E.convert_fn(balance(open(full, encoding='utf-8').read()), fn_name(prefix, key), mine, os.path.dirname(full))
    if prefix == 'V_' and CUR: USED[key] = list(CUR)
    return out
fns = [conv(k, f, 'P_') for k, f in partials] + [conv(k, f, 'V_') for k, f in views]
mod = """/* eslint-disable */
// @ts-nocheck  (converted from EJS by scripts/ejs_to_jsx.py; maintained by hand from here)
// Every view of the %s portal as a React function of the template locals (rendered on the server).
import { Fragment } from 'react';
import { S, A, rawHtml } from '../../shared/css';

// include(name, data): the old templates' partial-with-data call
const inc = (L, rel, data) => {
  const key = String(rel).replace(/^(?:\\.\\.\\/|\\.\\/)*(?:partials\\/)?/, '').replace(/\\.ejs$/, '');
  const fn = PARTIALS[key];
  if (!fn) throw new Error('no partial ' + rel);
  return fn(Object.assign({}, L, data));
};

""" % portal + '\n'.join(fns) + "\nconst PARTIALS = {\n" + ''.join(f"  {k!r}: {fn_name('P_', k)},\n" for k, _ in partials) + "};\n\nexport const localNames = " + repr(locals_) + ";\n\n// plain scripts a view needs in the browser (ePrisons); loaded after the page is hydrated\nexport const scripts = " + repr(USED) + ";\n\nexport const views = {\n" + ''.join(f"  {k!r}: {fn_name('V_', k)},\n" for k, _ in views) + "};\n"
open(os.path.join(out_dir, 'views.generated.tsx'), 'w', encoding='utf-8').write(mod)
print(portal, len(views), 'views,', len(partials), 'partials')
