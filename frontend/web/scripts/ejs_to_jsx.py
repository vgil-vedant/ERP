#!/usr/bin/env python3
"""Converts an EJS template (HTML + <% %> tags) into a React (TSX) function component.

Supported EJS: <%= expr %> (escaped output), <%- expr %> (raw: icons only), if / else if / else, X.forEach(function (a, i) { ... }),
and plain statement scriptlets (<% var x = ...; %>). Anything else is copied as code. The output is a one-off conversion: the generated
TSX is then maintained by hand. Usage: ejs_to_jsx.py <in.ejs> <out.tsx> <ComponentName> <local1,local2,...> [drawerKind]
"""
import os, re, sys, json
from html.parser import HTMLParser

M0, M1 = '', ''
VOID = {'br', 'hr', 'img', 'input', 'meta', 'link', 'col', 'wbr', 'source', 'track', 'area', 'base', 'embed', 'param'}
TABLEISH = {'table', 'thead', 'tbody', 'tfoot', 'tr', 'colgroup', 'select'}
SVG_ATTR = {'viewbox': 'viewBox', 'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin',
            'stroke-dasharray': 'strokeDasharray', 'fill-rule': 'fillRule', 'clip-rule': 'clipRule', 'preserveaspectratio': 'preserveAspectRatio',
            'stop-color': 'stopColor', 'stop-opacity': 'stopOpacity', 'text-anchor': 'textAnchor', 'font-size': 'fontSize', 'font-weight': 'fontWeight',
            'autocomplete': 'autoComplete', 'maxlength': 'maxLength', 'tabindex': 'tabIndex', 'colspan': 'colSpan', 'rowspan': 'rowSpan',
            'inputmode': 'inputMode', 'readonly': 'readOnly', 'for': 'htmlFor', 'class': 'className', 'novalidate': 'noValidate', 'charset': 'charSet',
            'autofocus': 'autoFocus', 'minlength': 'minLength', 'enctype': 'encType', 'srcset': 'srcSet', 'datetime': 'dateTime', 'hreflang': 'hrefLang',
            'crossorigin': 'crossOrigin', 'contenteditable': 'contentEditable', 'frameborder': 'frameBorder', 'cellpadding': 'cellPadding', 'cellspacing': 'cellSpacing',
            'allowfullscreen': 'allowFullScreen', 'playsinline': 'playsInline', 'xlink:href': 'xlinkHref', 'xmlns:xlink': 'xmlnsXlink', 'usemap': 'useMap'}
BOOL = {'hidden', 'selected', 'disabled', 'checked', 'required', 'autofocus', 'multiple', 'readonly', 'novalidate', 'defer', 'async', 'open'}

def camel_attr(k):
    if k in SVG_ATTR: return SVG_ATTR[k]
    if '-' in k and not k.startswith(('data-', 'aria-')): return re.sub(r'-([a-z])', lambda m: m.group(1).upper(), k)
    return k

class N:
    def __init__(s, tag, attrs, parent): s.tag, s.attrs, s.kids, s.parent = tag, attrs, [], parent

class P(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.root = N('#root', [], None); s.cur = s.root
    def handle_starttag(s, tag, attrs):
        n = N(tag, attrs, s.cur); s.cur.kids.append(n)
        if tag not in VOID: s.cur = n
    def handle_startendtag(s, tag, attrs): s.cur.kids.append(N(tag, attrs, s.cur))
    def handle_endtag(s, tag):
        c = s.cur
        while c is not None and c.tag != tag: c = c.parent
        if c is not None and c.parent is not None: s.cur = c.parent
    def handle_data(s, d): s.cur.kids.append(d)
    def handle_comment(s, d): pass

def js_str(s): return json.dumps(s, ensure_ascii=False)
def tpl(s):  # JS template literal from text containing markers
    out = []
    for part in re.split(f'({M0}\\d+{M1})', s):
        m = re.fullmatch(f'{M0}(\\d+){M1}', part)
        if m: out.append('${' + TAGS[int(m.group(1))][1].strip() + '}')
        else: out.append(part.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${'))
    return '`' + ''.join(out) + '`'
def esc_tpl(t): return t.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')

def tpl_seq(items, i, stop):
    """Template-literal body for the text of a <style>/<script>, with EJS if/else/output turned into ${...}."""
    out = ''
    while i < len(items):
        it = items[i]
        if it[0] == 't': out += esc_tpl(it[1]); i += 1; continue
        if it[0] == 'e': i += 1; continue
        c = classify(*it[1]); k = c[0]
        if k in stop: break
        if k in ('out', 'raw'): out += '${' + c[1] + '}'; i += 1
        elif k == 'if':
            cond = c[1]; i += 1; expr = ''
            while True:
                body, i = tpl_seq(items, i, ('elseif', 'else', 'end'))
                expr += f'({cond}) ? `{body}` : ' if cond is not None else f'`{body}`'
                nk = classify(*items[i][1]); i += 1
                if nk[0] == 'end': break
                cond = nk[1] if nk[0] == 'elseif' else None
            if cond is not None or not expr.endswith('`'): expr += "''"
            out += '${' + expr + '}'
        else: i += 1
    return out, i

def has_marker(s): return M0 in s

def style_literal(v):
    items = []
    for decl in [x for x in v.split(';') if x.strip()]:
        k, _, val = decl.partition(':'); k = k.strip(); val = val.strip()
        key = k if k.startswith('--') else re.sub(r'-([a-z])', lambda m: m.group(1).upper(), k)
        items.append(f'{json.dumps(key)}:{json.dumps(val)}')
    return '{{' + ','.join(items) + '}}'

EACH_VAR = []   # stack of loop variable names
INC = re.compile(r"^include\(\s*([\s\S]+?)\s*(?:,\s*(\{[\s\S]*\}))?\s*\)$")

def partial_name(rel):
    return 'P_' + re.sub(r'[^A-Za-z0-9]', '_', rel)

def include_call(code):
    m = INC.match(code.strip())
    if not m: return None
    return '{inc(L, ' + m.group(1) + ', ' + (m.group(2) or '{}') + ')}'

def attr_jsx(n):
    out = []
    for k, v in n.attrs:
        if re.fullmatch(f'{M0}(\\d+){M1}', k):
            tg = TAGS[int(re.fullmatch(f'{M0}(\\d+){M1}', k).group(1))]
            out.append('{...A(' + tg[1].strip() + (', true' if tg[0] == '-' else '') + ')}'); continue
        if k == 'onclick':
            m = re.match(r"\s*(\w+)\((.*)\)\s*;?\s*$", v, re.S)
            fn = m.group(1) if m else ''
            if fn == 'openDrawer':
                first = re.search(f'{M0}(\\d+){M1}', v)
                title = TAGS[int(first.group(1))][1].strip() if first else "''"
                var = EACH_VAR[-1] if EACH_VAR else 'row'
                out.append(f'onClick={{() => ctx.openDrawer({title}, <Drawer kind="{DRAWER}" row={{{var}}} />)}}')
            elif fn in ('exportTableCSV', 'goPage'):
                out.append('onClick={() => ctx.%s(%s)}' % (fn, m.group(2)))
            continue
        k2 = camel_attr(k)
        if k == 'style':
            out.append('style=' + (f'{{S({tpl(v)})}}' if has_marker(v) else style_literal(v))); continue
        if v is None or (k in BOOL and v in ('', k)): out.append(k2 if k2 != 'data-sort' else 'data-sort=""'); continue
        if has_marker(v):
            single = re.fullmatch(f'{M0}(\\d+){M1}', v)
            out.append(f'{k2}={{{TAGS[int(single.group(1))][1].strip()}}}' if single else f'{k2}={{{tpl(v)}}}')
        elif k2 in ('tabIndex', 'colSpan', 'rowSpan', 'maxLength'): out.append(f'{k2}={{{v}}}')
        else: out.append(f'{k2}={js_str(v)}')
    return (' ' + ' '.join(out)) if out else ''

# ---- items: ('t', text) | ('e', N) | ('c', kind, code...) ----
def classify(kind, code):
    c = code.strip()
    if kind == '=': return ('out', c)
    if kind == '-': return ('raw', c)
    m = re.match(r'^if\s*\((.*?)\)\s*\{([\s\S]*)$', c, re.S)
    if m and balanced(m.group(1)): return ('if', m.group(1), m.group(2))
    m = re.match(r'^for\s*\((.*?)\)\s*\{([\s\S]*)$', c, re.S)
    if m and balanced(m.group(1)): return ('for', m.group(1), m.group(2))
    m = re.match(r'^\}\s*else\s+if\s*\((.*)\)\s*\{\s*$', c, re.S)
    if m: return ('elseif', m.group(1))
    if re.match(r'^\}\s*else\s*\{\s*$', c): return ('else',)
    if re.match(r'^\}\)\s*;?\s*$', c): return ('endeach',)
    if re.match(r'^\}\s*$', c): return ('end',)
    m = re.match(r'^([^;{}]+?)\.forEach\(function\s*\(([^)]*)\)\s*\{([\s\S]*)$', c, re.S)
    if m: return ('each', m.group(1), m.group(2), keep_vars(m.group(3)))
    return ('code', keep_vars(c))
def keep_vars(code):
    if 'drawerHtml' not in code: return code
    return ' '.join(re.findall(r'var\s+(?:fields|systemList)\s*=[^;]+;', code))

def balanced(s): return s.count('(') == s.count(')')

def items_of(children):
    out = []
    for k in children:
        if isinstance(k, str):
            for part in re.split(f'({M0}\\d+{M1})', k):
                m = re.fullmatch(f'{M0}(\\d+){M1}', part)
                if m: out.append(('m', TAGS[int(m.group(1))]))
                elif part != '': out.append(('t', part))
        else: out.append(('e', k))
    return out

def is_block_open(it): return it[0] == 'm' and classify(*it[1])[0] in ('if', 'each', 'for')
def kind_of(it): return classify(*it[1])[0] if it[0] == 'm' else None

def gen_seq(items, i, ind, stop, parent=''):
    """returns (code_stmts, parts, next_index); stops (without consuming) at an item whose kind is in `stop`."""
    code, parts = [], []
    while i < len(items):
        it = items[i]
        kd = kind_of(it)
        if kd in stop: break
        if it[0] == 't':
            t = it[1]
            prev = items[i - 1] if i else None; nxt = items[i + 1] if i + 1 < len(items) else None
            def inline(x): return x is not None and (x[0] == 'e' or (x[0] == 'm' and kind_of(x) in ('out', 'raw')))
            if t.strip() == '':
                if parent in TABLEISH: pass
                elif '\n' not in t: parts.append(('t', ' '))
                elif inline(prev) and inline(nxt): parts.append(('t', ' '))
            else:
                lead = re.match(r'\s*', t).group(0); trail = re.search(r'\s*$', t).group(0)
                body = re.sub(r'\s+', ' ', t.strip())
                pre = ' ' if lead and ('\n' not in lead or inline(prev)) else ''
                post = ' ' if trail and ('\n' not in trail or inline(nxt)) else ''
                parts.append(('t', pre + body + post))
            i += 1
        elif it[0] == 'e':
            parts.append(('x', gen_el(it[1], ind))); i += 1
        else:
            c = classify(*it[1]); k = c[0]
            if k == 'out': parts.append(('e', c[1])); i += 1
            elif k == 'raw': parts.append(('x', include_call(c[1]) or ('{rawHtml(' + c[1] + ')}'))); i += 1
            elif k == 'code':
                if 'drawerHtml' not in c[1]: code.append(c[1])
                i += 1
            elif k == 'if':
                branches = []; cond = c[1]; rest = c[2]; i += 1
                while True:
                    sub_code, sub_parts, i = gen_seq(items, i, ind, ('elseif', 'else', 'end'), parent)
                    if rest.strip(): sub_code = [rest.strip()] + sub_code
                    branches.append((cond, wrap(sub_code, sub_parts))); rest = ''
                    nk = classify(*items[i][1]); i += 1
                    if nk[0] == 'end': break
                    cond = nk[1] if nk[0] == 'elseif' else None
                expr = ''
                for cnd, body in branches:
                    expr += f'({cnd}) ? ({body}) : ' if cnd is not None else f'({body})'
                if branches[-1][0] is not None: expr += 'null'
                parts.append(('x', '{' + expr + '}'))
            elif k == 'for':
                hdr, rest = c[1], c[2]; i += 1
                sub_code, sub_parts, i = gen_seq(items, i, ind, ('end',), parent)
                i += 1
                if rest.strip(): sub_code = [rest.strip()] + sub_code
                body = wrap(sub_code, sub_parts, key='__o.length')
                parts.append(('x', '{(() => { const __o = []; for (' + hdr + ') { ' + '; '.join(sub_code) + '; __o.push(' + body + '); } return __o; })()}'))
            elif k == 'each':
                names = [x.strip() for x in c[2].split(',') if x.strip()]
                EACH_VAR.append(names[0])
                keyv = names[1] if len(names) > 1 else '__k'
                if len(names) == 1: names.append('__k')
                rest = c[3]; i += 1
                sub_code, sub_parts, i = gen_seq(items, i, ind, ('endeach',), parent)
                i += 1
                EACH_VAR.pop()
                if rest.strip(): sub_code = [rest.strip()] + sub_code
                body = wrap(sub_code, sub_parts, key=keyv)
                parts.append(('x', '{(' + c[1] + ').map(function (' + ', '.join(names) + ') { return (' + body + '); })}' if not sub_code else
                             '{(' + c[1] + ').map(function (' + ', '.join(names) + ') { ' + '; '.join(sub_code) + '; return (' + body + '); })}'))
            else: i += 1
    return code, parts, i

def emit(parts):
    """Typed parts -> JSX child strings. Adjacent text and <%= %> outputs become ONE text node (as in the old HTML), so
    server output is 'page 2 of 5', not 'page <!-- -->2<!-- --> of <!-- -->5'."""
    out, run = [], []
    def flush():
        if not run: return
        if all(k == 't' for k, _ in run):
            text = ''.join(v for _, v in run)
            if text == ' ': out.append("{' '}")
            elif re.search(r'[{}<>]', text): out.append('{' + json.dumps(text, ensure_ascii=False) + '}')
            else:   # JSX trims text at line ends, so a space at either end is written out
                out.append(("{' '}" if text.startswith(' ') else '') + text.strip(' ') + ("{' '}" if text.endswith(' ') else ''))
        else:
            out.append('{`' + ''.join(esc_tpl(v) if k == 't' else '${(' + v + ") ?? ''}" for k, v in run) + '`}')
        run.clear()
    for k, v in parts:
        if k == 'x': flush(); out.append(v)
        else: run.append((k, v))
    flush()
    return out

def wrap(code, parts, key=None):
    inner = '\n'.join(emit(parts))
    frag = f'<Fragment key={{{key}}}>{inner}</Fragment>' if key else f'<>{inner}</>'
    if code and not key: return '(() => { ' + '; '.join(code) + '; return ' + frag + '; })()'
    return frag

def gen_el(n, ind):
    only = [k for k in n.kids if not (isinstance(k, str) and k.strip() == '')]
    if any(k == 'data-children' for k, _ in n.attrs): return '{children}'
    attrs = attr_jsx(n)
    if n.tag in VOID: return f'<{n.tag}{attrs} />'
    if len(only) == 1 and isinstance(only[0], str):
        m = re.fullmatch(f'\\s*{M0}(\\d+){M1}\\s*', only[0])
        if m and TAGS[int(m.group(1))][0] == '-' and 'include(' not in TAGS[int(m.group(1))][1]:
            return f'<{n.tag}{attrs} dangerouslySetInnerHTML={{{{ __html: {TAGS[int(m.group(1))][1].strip()} }}}} />'
    if n.tag in ('style', 'script') and n.kids:
        body, _ = tpl_seq(items_of(n.kids), 0, ())
        return f'<{n.tag}{attrs} dangerouslySetInnerHTML={{{{ __html: `{body}` }}}} />'
    if n.tag == 'title':
        body, _ = tpl_seq(items_of(n.kids), 0, ())
        return f'<title{attrs}>{{`{body.strip()}`}}</title>'
    if n.tag == 'textarea':
        raw = ''.join(k for k in n.kids if isinstance(k, str)).strip()
        m = re.fullmatch(f'{M0}(\\d+){M1}', raw)
        if m: return f'<textarea{attrs} defaultValue={{{TAGS[int(m.group(1))][1].strip()}}} />'
        return f'<textarea{attrs}></textarea>'
    items = items_of(n.kids)
    code, parts, _ = gen_seq(items, 0, ind, (), n.tag)
    inner = '\n'.join(emit(parts))
    if not parts: return f'<{n.tag}{attrs}></{n.tag}>'
    if code: inner = '{(() => { ' + '; '.join(code) + '; return (<>' + inner + '</>); })()}'
    return f'<{n.tag}{attrs}>{inner}</{n.tag}>'

def inline_includes(src, base):
    def sub(m):
        rel = m.group(1)
        path = os.path.normpath(os.path.join(base, rel + ('' if rel.endswith('.ejs') else '.ejs')))
        return inline_includes(open(path, encoding='utf-8').read(), os.path.dirname(path))
    return re.sub(r"<%-\s*include\(\s*'([^']+)'\s*\)\s*%>", sub, src)

TAGS = []
KEEP_SCRIPTS = False
TRANSFORM = None   # applied to the template text after its partials are inlined
SPLIT_IF = re.compile(r'^([\s\S]*?;)\s*(if\s*\([\s\S]*\)\s*\{)\s*$')
def split_if(code):
    """'<statements>; if (cond) { <more statements>' (a block that stays open) -> (statements, 'if (cond) { more')."""
    if re.match(r'(?:if|for)\s*\(', code): return None
    for m in re.finditer(r';\s*((?:if|for)\s*\()', code):
        rest = code[m.start(1):]
        if rest.count('{') > rest.count('}') and code[:m.start() + 1].count('{') == code[:m.start() + 1].count('}'):
            return code[:m.start() + 1], rest
    return None

def convert_parts(src, locals_, drawer, base=None):
    global TAGS, DRAWER
    DRAWER = drawer
    if base: src = inline_includes(src, base)
    if TRANSFORM: src = TRANSFORM(src)
    src = re.sub(r'<%#[\s\S]*?%>', '', src)
    if not KEEP_SCRIPTS: src = re.sub(r'<script[\s\S]*?</script>', '', src)
    if not base: src = re.sub(r"<%-\s*include\([^)]*\)\s*%>", '', src)   # console pages: the layout is converted separately
    TAGS = []
    def sub(m):
        kind, code = m.group(1), m.group(2)
        sp = split_if(code.strip()) if kind == '' else None
        if sp:
            TAGS.append(('', sp[0])); TAGS.append(('', sp[1]))
            return f'{M0}{len(TAGS)-2}{M1}{M0}{len(TAGS)-1}{M1}'
        TAGS.append((kind, code)); return f'{M0}{len(TAGS)-1}{M1}'
    tpl_src = re.sub(r'<%([-=]?)([\s\S]*?)%>', sub, src)
    p = P(); p.feed(tpl_src)
    items = items_of(p.root.kids)
    code, parts, _ = gen_seq(items, 0, 0, ())
    body = '\n'.join(emit(parts))
    code_js = ';\n  '.join(code) + (';' if code else '')
    return code_js, body

def convert(src, name, locals_, drawer, base=None):
    code_js, body = convert_parts(src, locals_, drawer, base)
    return f"""/* eslint-disable */
// @ts-nocheck  (converted from EJS by scripts/ejs_to_jsx.py; maintained by hand from here)
import {{ Fragment }} from 'react';
import {{ S }} from '../../shared/css';
import {{ Drawer }} from './drawers';

export function {name}({{ {', '.join(locals_)} }}) {{
  {code_js}
  return (
    <>
{body}
    </>
  );
}}
"""

def convert_fn(src, fname, locals_, base):
    """One view as a function component taking the template locals object L (portal pages)."""
    code_js, body = convert_parts(src, locals_, '', base)
    return f"""export function {fname}(L) {{
  const {{ {', '.join(locals_)} }} = L;
  {code_js}
  return (
    <>
{body}
    </>
  );
}}
"""

if __name__ == '__main__':
    src_path, out_path, name, locals_ = sys.argv[1:5]
    drawer = sys.argv[5] if len(sys.argv) > 5 else ''
    open(out_path, 'w', encoding='utf-8').write(convert(open(src_path, encoding='utf-8').read(), name, [x for x in locals_.split(',') if x], drawer))
