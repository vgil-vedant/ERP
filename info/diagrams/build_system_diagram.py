#!/usr/bin/env python3
"""
Builds info/diagrams/system-architecture.svg: the whole 4_ERP system on one page.

    python3 info/diagrams/build_system_diagram.py
    (then render the SVG to PNG; see render_system_diagram.js)

Colour key: blue = front end (FE), green = back end (BE), amber = database (DB),
violet = integration bus. Numbered badges follow one record from an officer's
"Save" to a live ERP screen.
"""
import os
from html import escape

W, H = 2400, 1590
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'system-architecture.svg')

FE = ('#1D4ED8', '#EEF4FF', '#BFD3FB')
BE = ('#047857', '#ECFDF5', '#A7E3C9')
DB = ('#B45309', '#FFF7E8', '#F5CF8F')
BUS = ('#6D28D9', '#F5F1FF', '#CDBDF7')
INK, TEXT2, TEXT3, LINE = '#111827', '#374151', '#6B7280', '#D1D5DB'
FONT = "Inter, 'Segoe UI', Roboto, Arial, sans-serif"

out = []
def add(s): out.append(s)

def text(x, y, s, size=15, weight=400, fill=INK, anchor='start', italic=False, mono=False):
    fam = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace" if mono else FONT
    add(f'<text x="{x}" y="{y}" font-family="{fam}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"'
        f'{" font-style=\"italic\"" if italic else ""}>{escape(s)}</text>')

def lines(x, y, rows, size=14, gap=19, fill=TEXT2, weight=400, mono=False, anchor='start'):
    for i, r in enumerate(rows):
        text(x, y + i * gap, r, size, weight, fill, anchor, mono=mono)

def box(x, y, w, h, colours, r=12, dash=False, sw=1.6):
    stroke, fill, _ = colours
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"'
        f'{" stroke-dasharray=\"7 6\"" if dash else ""}/>')

def tag(x, y, label, colours):
    stroke = colours[0]
    w = 12 + len(label) * 8.2
    add(f'<rect x="{x}" y="{y}" width="{w}" height="20" rx="10" fill="{stroke}"/>')
    text(x + w / 2, y + 14.5, label, 11.5, 800, '#fff', 'middle')
    return w

def cylinder(x, y, w, h, title, rows, sub=None):
    stroke, fill, rim = DB
    e = 12
    add(f'<path d="M{x},{y+e} L{x},{y+h-e} A{w/2},{e} 0 0 0 {x+w},{y+h-e} L{x+w},{y+e}" fill="{fill}" stroke="{stroke}" stroke-width="1.6"/>')
    add(f'<ellipse cx="{x+w/2}" cy="{y+e}" rx="{w/2}" ry="{e}" fill="{rim}" stroke="{stroke}" stroke-width="1.6"/>')
    tag(x + 10, y + 30, 'DB', DB)
    text(x + 46, y + 45, title, 14.5, 800, INK)
    if sub: text(x + 12, y + 66, sub, 12.5, 600, DB[0])
    lines(x + 12, y + (86 if sub else 68), rows, 12.5, 17, TEXT2)

def arrow(points, colour, label=None, lx=None, ly=None, dash=False, width=2.2, label_anchor='middle', label_bg=True, head=True):
    d = 'M' + ' L'.join(f'{px},{py}' for px, py in points)
    mid = colour.replace('#', '')
    add(f'<path d="{d}" fill="none" stroke="{colour}" stroke-width="{width}" stroke-linejoin="round"'
        f'{" stroke-dasharray=\"8 6\"" if dash else ""}{f" marker-end=\"url(#h{mid})\"" if head else ""}/>')
    if label:
        size = 12.5
        tw = len(label) * 6.9 + 16
        bx = lx - (tw / 2 if label_anchor == 'middle' else 0)
        if label_bg:
            add(f'<rect x="{bx}" y="{ly-15}" width="{tw}" height="22" rx="11" fill="#fff" stroke="{colour}" stroke-width="1.2"/>')
        text(bx + tw / 2, ly + 1, label, size, 700, colour, 'middle')

def badge(x, y, n, colour='#DC2626'):
    add(f'<circle cx="{x}" cy="{y}" r="15" fill="{colour}" stroke="#fff" stroke-width="3"/>')
    text(x, y + 5.5, str(n), 15, 800, '#fff', 'middle')

markers = {'#1D4ED8', '#047857', '#B45309', '#6D28D9', '#DC2626', '#6B7280', '#111827'}
add(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">')
add('<defs>' + ''.join(
    f'<marker id="h{c.replace("#", "")}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
    f'<path d="M0,0 L10,5 L0,10 z" fill="{c}"/></marker>' for c in markers)
    + '<linearGradient id="hdr" x1="0" x2="1"><stop offset="0" stop-color="#0F172A"/><stop offset="1" stop-color="#1E3A8A"/></linearGradient>'
    + '<filter id="sh" x="-5%" y="-5%" width="110%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#0F172A" flood-opacity=".10"/></filter>'
    + '</defs>')
add(f'<rect width="{W}" height="{H}" fill="#F8FAFC"/>')

# ---------------------------------------------------------------- header
add(f'<rect x="0" y="0" width="{W}" height="104" fill="url(#hdr)"/>')
text(40, 50, '4_ERP · System architecture and data flow', 32, 800, '#fff')
text(40, 82, 'ERP for Maharashtra Prisons, five government-portal replicas with their own department offices, and the integration bus that links them. Unofficial local demonstration; synthetic data only.', 15.5, 400, '#CBD5E1')
# key
kx = 1860
for i, (lab, col) in enumerate([('FE  front end (what users see)', FE), ('BE  back end (server logic)', BE), ('DB  database', DB), ('Integration bus', BUS)]):
    yy = 22 + i * 20
    add(f'<rect x="{kx}" y="{yy}" width="14" height="14" rx="3" fill="{col[1]}" stroke="{col[0]}" stroke-width="2"/>')
    text(kx + 22, yy + 12, lab, 13, 600, '#E2E8F0')

# ---------------------------------------------------------------- column A: people
text(40, 146, 'PEOPLE', 13, 800, TEXT3)
def person(y, title, rows, colour):
    add(f'<g filter="url(#sh)"><rect x="40" y="{y}" width="250" height="{30 + 19 * len(rows) + 30}" rx="14" fill="#fff" stroke="{colour}" stroke-width="1.6"/></g>')
    add(f'<circle cx="72" cy="{y+32}" r="15" fill="{colour}"/><circle cx="72" cy="{y+27}" r="5" fill="#fff"/><path d="M62,{y+40} a10,7 0 0 1 20,0" fill="#fff"/>')
    text(96, y + 38, title, 16, 800, INK)
    lines(56, y + 70, rows, 13, 19, TEXT2)
person(170, 'Citizen', ['Uses the public portal pages:', 'one registration works on all', 'five portals; files forms,', 'visit requests, grievances.'], '#0EA5E9')
person(470, 'Department officer', ['Signs in to their own', 'department office (/office):', 'UIDAI, CCTNS, e-Forensics,', 'eCourts or ePrisons.', 'Separate login per department.'], '#7C3AED')
person(830, 'ERP user / administrator', ['Prison ERP staff and admins.', 'Search one identifier in', 'Person Lookup; watch records', 'arrive live; audit trail.'], '#DC2626')

# ---------------------------------------------------------------- column B: platform service
PX, PY, PW, PH = 330, 140, 1120, 1130
add(f'<rect x="{PX}" y="{PY}" width="{PW}" height="{PH}" rx="18" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.6" stroke-dasharray="9 7"/>')
text(PX + 20, PY + 32, 'PLATFORM SERVICE', 14, 800, TEXT3)
text(PX + 190, PY + 32, 'one Node.js + Express process · backend/platform-api · five portal ports + hub', 14, 500, TEXT3)
text(PX + 40, PY + 66, 'FRONT END', 12, 800, FE[0])
text(PX + 405, PY + 66, 'BACK END', 12, 800, BE[0])
text(PX + 750, PY + 66, 'DATABASE (one per department)', 12, 800, DB[0])

portals = [
    ('UIDAI / Aadhaar', ':4177', '#2F2B69', 'uidai.sqlite', ['Enrolment & update forms', 'Approval issues Aadhaar no.'], ['residents, enrolments,', 'update requests, outbox']),
    ('CCTNS', ':4175', '#0062CC', 'cctns.sqlite', ['FIR registration', 'Police verification requests'], ['FIRs, verification', 'requests, outbox']),
    ('e-Forensics', ':4176', '#6D3FE6', 'eforensics.sqlite', ['CESF case submission', 'Lab workflow, custody chain'], ['forensic cases, exhibits,', 'custody events, outbox']),
    ('eCourts', ':4178', '#105B59', 'ecourts.sqlite', ['Case filing, registration (CNR)', 'Hearings, judgment, appeal'], ['cases, hearings, orders,', 'outbox']),
    ('ePrisons', ':4173', '#0D4F86', 'eprisons.sqlite', ['Admission, conviction, release', 'e-Mulakat visits, grievances'], ['custody, visits,', 'grievances, outbox']),
]
ROW0, ROWH, GAP = PY + 82, 150, 14
db_right = []
for i, (name, port, col, dbf, be_rows, db_rows) in enumerate(portals):
    y = ROW0 + i * (ROWH + GAP)
    add(f'<rect x="{PX+16}" y="{y}" width="6" height="{ROWH}" rx="3" fill="{col}"/>')
    # FE
    box(PX + 34, y, 340, ROWH, FE)
    tag(PX + 46, y + 12, 'FE', FE)
    text(PX + 84, y + 27, f'{name}  {port}', 16, 800, INK)
    lines(PX + 48, y + 56, ['Public replica pages (unchanged)', 'Officer workspace  /office', '  login · dashboard · forms ·', '  record steppers · delivery log'], 13, 19, TEXT2)
    # BE
    box(PX + 400, y, 310, ROWH, BE)
    tag(PX + 412, y + 12, 'BE', BE)
    text(PX + 450, y + 27, 'Department module', 15, 800, INK)
    lines(PX + 414, y + 56, be_rows + ['Validation · workflow rules', 'Writes record + outbox event'], 13, 19, TEXT2)
    # DB
    cylinder(PX + 740, y + 2, 360, ROWH - 4, dbf, db_rows + ['officers, activity log'], 'own file, departments/')
    db_right.append((PX + 1100, y + ROWH / 2))
    arrow([(PX + 374, y + ROWH / 2), (PX + 398, y + ROWH / 2)], FE[0], width=2)
    arrow([(PX + 710, y + ROWH / 2), (PX + 738, y + ROWH / 2)], BE[0], width=2)

# shared strip
SY = ROW0 + 5 * (ROWH + GAP) + 8
add(f'<line x1="{PX+16}" y1="{SY-12}" x2="{PX+PW-16}" y2="{SY-12}" stroke="{LINE}" stroke-width="1.4"/>')
text(PX + 20, SY + 8, 'SHARED BY THE FIVE PORTALS', 12, 800, TEXT3)
box(PX + 34, SY + 18, 340, 140, FE)
tag(PX + 46, SY + 30, 'FE', FE)
text(PX + 84, SY + 45, 'ERP Hub dashboard  :4100', 16, 800, INK)
lines(PX + 48, SY + 74, ['React app (admin sign-in)', 'Dashboard, records, citizens,', 'audit, Person Lookup view', '(lookup data via ERP API)'], 13, 19, TEXT2)
box(PX + 400, SY + 18, 310, 140, BE)
tag(PX + 412, SY + 30, 'BE', BE)
text(PX + 450, SY + 45, 'Shared identity + hub', 15, 800, INK)
lines(PX + 414, SY + 74, ['Citizen registration & sign-in', 'Portal form submissions', 'Write-through to ERP intake', 'Hub API + lookup proxy'], 13, 19, TEXT2)
cylinder(PX + 740, SY + 20, 360, 136, 'platform.sqlite', ['person, session, submission,', 'submission_field, erp_sync'], 'citizen accounts & forms')
arrow([(PX + 374, SY + 88), (PX + 398, SY + 88)], FE[0], width=2)
arrow([(PX + 710, SY + 88), (PX + 738, SY + 88)], BE[0], width=2)

# ---------------------------------------------------------------- column C: integration bus
BX, BY, BW, BH = 1490, 222, 250, 800
add(f'<g filter="url(#sh)"><rect x="{BX}" y="{BY}" width="{BW}" height="{BH}" rx="16" fill="{BUS[1]}" stroke="{BUS[0]}" stroke-width="2"/></g>')
tag(BX + 14, BY + 14, 'MIDDLEWARE', BUS)
text(BX + 14, BY + 62, 'Integration bus', 21, 800, BUS[0])
lines(BX + 14, BY + 90, ['Transactional outbox:', 'record and event saved in', 'one step, nothing lost.'], 13.5, 19, TEXT2)
steps = [
    ('Instant', 'delivered as soon as it is', 'saved (~10–60 ms)'),
    ('Signed', 'HMAC-SHA256 + timestamp;', 'forgeries refused'),
    ('Ordered', 'oldest first, batches', 'of up to 50'),
    ('Retried', '1 s → 2 s → … → 60 s', 'while the ERP is away'),
    ('Exactly once', 'ERP ignores an event id', 'it has already applied'),
    ('Visible', 'delivery log in every', 'department office'),
]
for i, (h, a, b) in enumerate(steps):
    yy = BY + 170 + i * 98
    add(f'<rect x="{BX+14}" y="{yy}" width="{BW-28}" height="84" rx="10" fill="#fff" stroke="{BUS[2]}" stroke-width="1.3"/>')
    text(BX + 28, yy + 26, h, 14.5, 800, BUS[0])
    lines(BX + 28, yy + 48, [a, b], 12.5, 18, TEXT2)
for (x, y) in db_right:
    arrow([(x, y), (BX - 2, y)], BUS[0], width=2.2)
text((PX + 1100 + BX) / 2, db_right[0][1] - 10, 'outbox', 12, 700, BUS[0], 'middle')

# ---------------------------------------------------------------- column D: ERP service
EX, EY, EW, EH = 1780, 140, 580, 1130
add(f'<rect x="{EX}" y="{EY}" width="{EW}" height="{EH}" rx="18" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.6" stroke-dasharray="9 7"/>')
text(EX + 20, EY + 32, 'ERP SERVICE', 14, 800, '#DC2626')
text(EX + 140, EY + 32, 'separate Node.js process · backend/erp-api · :4200', 14, 500, TEXT3)

box(EX + 24, EY + 56, EW - 48, 220, FE)
tag(EX + 38, EY + 70, 'FE', FE)
text(EX + 76, EY + 85, 'ERP console  :4200', 17, 800, INK)
lines(EX + 40, EY + 116, ['Dashboard · Received Records · Citizens · Audit Trail', 'Person Lookup: one identifier (Aadhaar, mobile, CNR,', '  FIR, prisoner no., name) → everything five systems hold', 'Identity card · case journey stepper · per-system records', 'Timeline · live banner when a new record arrives', 'Same lookup module also runs inside the hub (:4100)'], 13, 19.5, TEXT2)

box(EX + 24, EY + 310, EW - 48, 330, BE)
tag(EX + 38, EY + 324, 'BE', BE)
text(EX + 76, EY + 339, 'erp-api (Express)', 17, 800, INK)
ingest_y = EY + 372
blocks = [
    ('POST /api/ingest/events', ['verifies signature · applies each event once', 'matches the person: Aadhaar → EID → mobile + name']),
    ('POST /api/intake', ['citizen form write-through (both DBs or neither)']),
    ('GET /api/lookup · /person/:ref', ['5 connectors in parallel, each with its own timeout;', 'a system that is down never hides the others']),
    ('GET /api/lookup/stream', ['live Server-Sent Events to open lookup pages']),
]
yy = ingest_y
for h, rows in blocks:
    add(f'<rect x="{EX+40}" y="{yy}" width="{EW-80}" height="{26 + 18 * len(rows)}" rx="8" fill="#fff" stroke="{BE[2]}" stroke-width="1.2"/>')
    text(EX + 54, yy + 19, h, 13.5, 800, BE[0], mono=True)
    lines(EX + 54, yy + 38, rows, 12.5, 18, TEXT2)
    yy += 26 + 18 * len(rows) + 10

cylinder(EX + 24, EY + 680, EW - 48, 250, 'erp.sqlite', [
    'Intake:  source_system · citizen · intake · intake_field',
    'Audit:   audit_log (append-only: no UPDATE, no DELETE)',
    'Lookup:  lookup_subject (one row per real person)',
    '         lookup_identifier (hashed + masked numbers)',
    '         lookup_record (each record, per person)',
    'Bus:     lookup_link · ingest_event (idempotency)',
], 'the ERP’s own database · never opened by a portal')

box(EX + 24, EY + 960, EW - 48, 140, ('#334155', '#F1F5F9', '#CBD5E1'), dash=True)
tag(EX + 38, EY + 974, 'DB', DB)
text(EX + 76, EY + 989, 'PostgreSQL  demo_replica', 16, 800, INK)
lines(EX + 40, EY + 1018, ['Read-only migration and backup of both SQLite', 'databases (database/postgres); used by the console’s', 'Sync Activity and Integration Status pages.'], 13, 19, TEXT2)

# ERP internal arrows
arrow([(EX + EW / 2, EY + 276), (EX + EW / 2, EY + 306)], FE[0], width=2)
arrow([(EX + EW / 2, EY + 640), (EX + EW / 2, EY + 676)], BE[0], width=2)
arrow([(EX + EW - 70, EY + 930), (EX + EW - 70, EY + 956)], '#6B7280', dash=True, width=1.8)

# ---------------------------------------------------------------- cross-service arrows
# bus -> ERP ingest
arrow([(BX + BW, ingest_y + 20), (EX + 38, ingest_y + 20)], BUS[0], 'signed HTTP push', (BX + BW + EX + 38) / 2, ingest_y + 4, width=3)
# shared BE -> ERP: write-through + hub reads
sbx, sby = PX + 710, SY + 150
arrow([(PX + 555, SY + 158), (PX + 555, SY + 196), (BX + BW / 2, SY + 196), (BX + BW / 2 + 0, SY + 196), (EX - 18, SY + 196), (EX - 18, EY + 500), (EX + 38, EY + 500)],
      BE[0], 'HTTP only: POST /api/intake (write-through) · hub reads ERP API + lookup proxy', (PX + 555 + EX) / 2 + 40, SY + 190, width=2.4)
# live stream back to FE
arrow([(EX + EW - 40, EY + 360), (EX + EW - 40, EY + 282)], '#DC2626', width=2.4)
text(EX + EW - 48, EY + 300, 'live (SSE)', 12, 800, '#DC2626', 'end')

# people -> front ends
arrow([(290, 250), (PX + 34, ROW0 + 60)], '#0EA5E9', width=2)
arrow([(290, 560), (PX + 34, ROW0 + 2 * (ROWH + GAP) + 70)], '#7C3AED', width=2.4)
arrow([(290, 905), (300, 905), (300, SY + 88), (PX + 34, SY + 88)], '#DC2626', 'hub :4100', 300, SY + 64, width=2)
# ERP user -> ERP console (route along the bottom, up the far right)
arrow([(165, 980), (165, 1320), (EX + EW + 20, 1320), (EX + EW + 20, EY + 160), (EX + EW - 24, EY + 160)], '#DC2626', 'ERP console :4200', 900, 1320, width=2)

# numbered journey of one record
badge(330 - 2, ROW0 + 2 * (ROWH + GAP) + 70, 1, '#7C3AED')
badge(PX + 724, ROW0 + 2 * (ROWH + GAP) + ROWH / 2 - 22, 2)
badge((PX + 1100 + BX) / 2, ROW0 + 2 * (ROWH + GAP) + ROWH / 2 - 22, 3)
badge(EX + 8, ingest_y + 20, 4)
badge(EX + EW / 2 + 22, EY + 658, 5)
badge(EX + EW - 40, EY + 300 + 16, 6)

# ---------------------------------------------------------------- bottom: how it works
FY = 1350
add(f'<rect x="40" y="{FY}" width="{W-80}" height="{H-FY-24}" rx="16" fill="#fff" stroke="{LINE}" stroke-width="1.4"/>')
text(64, FY + 36, 'HOW ONE RECORD TRAVELS', 14, 800, TEXT3)
flow = [
    ('1', 'Officer saves', 'A department officer signs in to their own office (e.g. CCTNS) and registers an FIR.', '#7C3AED'),
    ('2', 'Department DB', 'The record and an outbox event are written together, in that department’s own database.', '#DC2626'),
    ('3', 'Integration bus', 'The bus sends it at once to the ERP, signed; if the ERP is away it retries until delivered.', '#DC2626'),
    ('4', 'ERP ingest', 'The ERP checks the signature, applies the event once and finds the person across departments.', '#DC2626'),
    ('5', 'ERP database', 'The record is filed under every person it names; its numbers become searchable.', '#DC2626'),
    ('6', 'Live on screen', 'Open Person Lookup pages (ERP and hub) show it within a fraction of a second.', '#DC2626'),
]
cw = (W - 80 - 48) / 6
for i, (n, h, d, c) in enumerate(flow):
    x = 64 + i * cw
    badge(x + 16, FY + 76, n, c)
    text(x + 42, FY + 82, h, 16, 800, INK)
    words, row, rows = d.split(), '', []
    for w_ in words:
        if len(row) + len(w_) + 1 > 44:
            rows.append(row); row = w_
        else:
            row = (row + ' ' + w_).strip()
    rows.append(row)
    lines(x + 4, FY + 114, rows, 13.5, 20, TEXT2)
    if i < 5:
        arrow([(x + cw - 34, FY + 76), (x + cw - 8, FY + 76)], '#94A3B8', width=2)
add(f'<line x1="64" y1="{FY+186}" x2="{W-64}" y2="{FY+186}" stroke="{LINE}" stroke-width="1.2"/>')
text(64, FY + 212, 'Rules that always hold: the ERP never calls a portal and never opens a portal database; no portal opens the ERP database; data moves only portal → ERP, over HTTP. '
     'Identity numbers are stored in the ERP only as keyed hashes and masks.', 13.5, 600, TEXT3)

add('</svg>')
with open(OUT, 'w') as f:
    f.write('\n'.join(out))
print('wrote', OUT)
