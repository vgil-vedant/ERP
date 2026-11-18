/* ==========================================================================
   Person Lookup: one identifier in, everything UIDAI, CCTNS, e-Forensics,
   eCourts and ePrisons hold about the person out.

     PersonLookup.mount(container, {
       api: '/api/lookup',    // where the ERP lookup API is reached
       urlState: true,        // keep ?q= / ?ref= in the address bar (back and forward work)
       loginUrl: '/login',    // where to send the user when the session has expired
     });

   Needs workflow-progress.js. Everything shown comes from the API; nothing
   is invented in the browser. Every value is escaped before it is drawn.
   ========================================================================== */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------- basics
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var REQUEST_TIMEOUT_MS = 20000;

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtDate(v) {
    if (!v) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
    return m ? Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1] : String(v);
  }
  function fmtStamp(v) {
    if (!v) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(v));
    return m ? fmtDate(v) + ', ' + m[4] + ':' + m[5] : fmtDate(v);
  }
  function fmtClock(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }
  function fmtLocal(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  }
  function slug(v) { return String(v || '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase(); }
  function initials(name) {
    return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join('');
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function cap(s) { s = String(s || '').replace(/_/g, ' '); return s.charAt(0).toUpperCase() + s.slice(1); }
  /** An identifier label for use mid-sentence: proper nouns and acronyms keep their capitals. */
  function lower(label) { return String(label || '').replace(/^(Mobile|Name|Prisoner|Forensic|Police|Number)\b/, function (m) { return m.toLowerCase(); }); }
  function gender(g) { return { M: 'Male', F: 'Female', T: 'Transgender' }[g] || g || ''; }

  // ------------------------------------------------------------------ icons
  var I = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    uidai: '<path d="M12 4a8 8 0 0 1 8 8v2"/><path d="M4 12a8 8 0 0 1 8-8"/><path d="M8 12a4 4 0 0 1 8 0v3a9 9 0 0 0 .6 3"/><path d="M7 20a13 13 0 0 1-.6-4v-4"/><path d="M11 12v5a7 7 0 0 0 .5 2.5"/>',
    cctns: '<path d="M12 3 4 6v6c0 4.4 3.4 8.2 8 9.5 4.6-1.3 8-5.1 8-9.5V6l-8-3Z"/><path d="M12 8v8M8.5 11h7"/>',
    eforensics: '<path d="M9 3h6M10 3v6l-5.5 9.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3"/><path d="M7.5 15h9"/>',
    ecourts: '<path d="M12 3v3M5 20h14M6 20V10m12 10V10M3 10h18"/><path d="M12 6 3 10h18L12 6Z"/><path d="M9 20v-5m6 5v-5"/>',
    eprisons: '<path d="M4 21V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15"/><path d="M8 8v13M12 8v13M16 8v13M3 21h18"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    users: '<path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"/><circle cx="9" cy="7.5" r="3.5"/><path d="M17 11a3 3 0 1 0 0-6"/><path d="M22 20v-1.5a4 4 0 0 0-3-3.8"/>',
    alert: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>',
    shield: '<path d="M12 3 5 6v5c0 4.4 3 8.2 7 10 4-1.8 7-5.6 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    retry: '<path d="M4 4v6h6"/><path d="M20 12a8 8 0 0 0-14.9-4L4 10m16 10v-6h-6"/><path d="M4 12a8 8 0 0 0 14.9 4l1.1-2"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    nothing: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2M8.5 11h5"/>',
    plug: '<path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0V8Z"/><path d="M12 17v5"/>',
    map: '<path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  };
  function svg(name, cls) {
    return '<svg class="' + (cls || 'pl-ic') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[name] || I.info) + '</svg>';
  }

  var SYSTEMS = {
    uidai: { name: 'UIDAI / Aadhaar', short: 'UIDAI' },
    cctns: { name: 'CCTNS', short: 'CCTNS' },
    eforensics: { name: 'e-Forensics', short: 'e-Forensics' },
    ecourts: { name: 'eCourts', short: 'eCourts' },
    eprisons: { name: 'ePrisons', short: 'ePrisons' },
  };
  var ORDER = ['uidai', 'cctns', 'eforensics', 'ecourts', 'eprisons'];

  // ------------------------------------------- what the user is typing (preview only)
  // The server decides; this only labels the input while typing.
  var VD = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
  var VP = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
  function verhoeff(num) {
    var c = 0, a = num.split('').reverse();
    for (var i = 0; i < a.length; i += 1) c = VD[c][VP[i % 8][Number(a[i])]];
    return c === 0;
  }
  function preview(raw) {
    var t = String(raw || '').trim();
    if (!t) return null;
    var c = t.replace(/[\s-]/g, '').toUpperCase();
    if (/^\+91[6-9]\d{9}$/.test(c)) return { label: 'Mobile number', ok: true };
    if (/^\d+$/.test(c)) {
      if (c.length < 10) return { label: 'Number', ok: null };
      if (c.length === 10) return { label: 'Mobile number', ok: /^[6-9]/.test(c) };
      if (c.length === 11) return /^0[6-9]/.test(c) ? { label: 'Mobile number', ok: true } : { label: 'Aadhaar number', ok: null };
      if (c.length === 12) {
        if (/^[2-9]/.test(c) && verhoeff(c)) return { label: 'Aadhaar number', ok: true };
        if (/^91[6-9]/.test(c)) return { label: 'Mobile number', ok: true };
        return { label: 'Aadhaar number', ok: false };
      }
      if (c.length === 14 || c.length === 28) return { label: 'Enrolment ID', ok: true };
      if (c.length === 16) return { label: 'Virtual ID', ok: false };
      return { label: 'Number', ok: c.length < 28 ? null : false };
    }
    if (/^[A-Z]{4}\d{12}$/.test(c)) return { label: 'CNR number', ok: true };
    if (/^(RFSL|DFSL)/.test(c)) return { label: 'Forensic case no.', ok: /^(RFSL|DFSL)[A-Z]{3}\/[A-Z]{2,4}\/\d{4}\/\d{4}$/.test(c) ? true : null };
    if (/^[A-Z]{3}\/(UT|CT)\//.test(c)) return { label: 'Prisoner number', ok: /^[A-Z]{3}\/(UT|CT)\/\d{4}\/\d{5}$/.test(c) ? true : null };
    if (/^MUL\d/.test(c)) return { label: 'e-Mulakat reg. no.', ok: /^MUL\d{4}MH\d{7}$/.test(c) ? true : null };
    if (/^PCC\//.test(c)) return { label: 'Certificate no.', ok: /^PCC\/MH\/\d{4}\/\d{6}$/.test(c) ? true : null };
    if (/^(FIR(NO\.?)?:?)?\d{1,5}\/\d{0,4}$/.test(c)) return { label: 'FIR number', ok: /\/\d{4}$/.test(c) ? true : null };
    if (/^[A-Za-z][A-Za-z .'-]*$/.test(t)) return { label: 'Name', ok: t.replace(/[^A-Za-z]/g, '').length >= 3 ? true : null };
    return { label: 'Unrecognised', ok: false };
  }

  // ------------------------------------------------------------- renderers
  // How each department's records were tied to this person: Aadhaar first (see the ERP's ingest).
  var BASIS = {
    aadhaar: ['Aadhaar', 'ok'], repair: ['Aadhaar (repaired)', 'ok'], eid: ['Enrolment ID', 'info'],
    mobile_name: ['Mobile + name, no Aadhaar', 'warn'], 'new': ['No Aadhaar given', 'warn'], earlier: ['Linked earlier', 'neutral'],
  };
  function matchedBy(list) {
    if (!list || !list.length) return '';
    return '<div class="pl-id-match"><span class="pl-muted">Matched by</span>' + list.map(function (m) {
      var b = BASIS[m.basis] || [m.basis, 'neutral'];
      return chip(((SYSTEMS[m.system] || {}).short || m.system) + ' · ' + b[0] + (m.count > 1 ? ' ×' + m.count : ''), b[1]);
    }).join('') + '</div>';
  }
  function chip(text, tone, extra) {
    return '<span class="pl-chip pl-chip--' + (tone || 'neutral') + '"' + (extra || '') + '>' + esc(text) + '</span>';
  }
  function statusTone(state) {
    return { completed: 'ok', active: 'info', pending: 'neutral', blocked: 'warn', failed: 'danger', skipped: 'neutral' }[state] || 'neutral';
  }
  function personLink(name, ref, current) {
    if (!name) return '';
    if (!ref || ref === current) return esc(name);
    return '<button type="button" class="pl-link" data-open-ref="' + esc(ref) + '" title="Open the profile of ' + esc(name) + '">' + esc(name) + '</button>';
  }
  function jumpLink(text, ref) {
    if (!ref) return esc(text);
    return '<button type="button" class="pl-link pl-mono" data-jump="' + esc('pl-rec-' + slug(ref)) + '">' + esc(text) + '</button>';
  }
  function sectionsHTML(list) {
    if (!list || !list.length) return '';
    return '<span class="pl-chips">' + list.map(function (s) { return chip(s.section + ' ' + s.act, 'outline'); }).join('') + '</span>';
  }
  /** A definition grid. Rows whose value is empty are left out. */
  function kv(rows) {
    var items = rows.filter(function (r) { return r && r[1] != null && r[1] !== '' && r[1] !== false; }).map(function (r) {
      return '<div class="pl-kv-item' + (r[2] ? ' pl-kv-item--' + r[2] : '') + '"><dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd></div>';
    });
    return items.length ? '<dl class="pl-kv">' + items.join('') + '</dl>' : '';
  }
  function txt(v) { return v == null || v === '' ? null : esc(v); }
  function mono(v) { return v == null || v === '' ? null : '<span class="pl-mono">' + esc(v) + '</span>'; }
  function table(caption, count, head, rows, open) {
    if (!rows.length) return '';
    return '<details class="pl-more"' + (open ? ' open' : '') + '><summary><span>' + esc(caption) + '</span><span class="pl-more-n">' + count + '</span></summary>'
      + '<div class="pl-table-wrap"><table class="pl-table"><thead><tr>' + head.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>'
      + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + (c == null || c === '' ? '<span class="pl-muted">—</span>' : c) + '</td>'; }).join('') + '</tr>'; }).join('')
      + '</tbody></table></div></details>';
  }
  function stepper(rec) {
    if (!rec.progress || !root.WorkflowProgressCard) return '';
    return '<div class="pl-stepper" data-progress="' + esc(JSON.stringify(rec.progress)) + '"></div>';
  }
  function recordShell(rec, title, sub, body, chips) {
    return '<article class="pl-rec" id="pl-rec-' + esc(slug(rec.ref)) + '" tabindex="-1">'
      + '<header class="pl-rec-head"><div class="pl-rec-main"><h4 class="pl-rec-title">' + esc(title) + '</h4>'
      + (sub ? '<div class="pl-rec-sub">' + sub + '</div>' : '') + '</div>'
      + '<div class="pl-rec-chips">' + (chips || '') + '</div></header>'
      + body + '</article>';
  }
  function progressChip(rec) {
    var p = rec.progress;
    if (!p) return '';
    var st = p.current >= 0 ? p.steps[p.current].state : 'completed';
    return chip(p.statusLabel, statusTone(st));
  }
  function roleChip(role) {
    var map = { accused: ['Accused', 'danger'], complainant: ['Complainant', 'info'], victim: ['Victim', 'info'], inmate: ['Inmate', 'neutral'], visitor: ['Visitor', 'neutral'], subject: ['Subject', 'neutral'], resident: ['Resident', 'neutral'], applicant: ['Applicant', 'neutral'], plaintiff: ['Plaintiff', 'neutral'], respondent: ['Respondent', 'neutral'] };
    var m = map[role];
    return m ? chip(m[0], m[1]) : '';
  }
  function address(a) {
    if (!a) return '';
    return [a.house, a.street, a.lm, a.loc, a.vtc, a.subdist !== a.vtc ? a.subdist : null, a.dist !== a.vtc ? a.dist : null, a.state, a.pc ? 'PIN ' + a.pc : null]
      .filter(Boolean).map(esc).join(', ');
  }

  var RECORD = {
    aadhaar_identity: function (r, ctx) {
      var d = r.data, e = d.enrolment, v = d.verification;
      var body = kv([
        ['Aadhaar number', mono(d.aadhaar_masked)],
        ['Name', txt(d.poi.name)],
        ['Gender', txt(gender(d.poi.gender))],
        ['Date of birth', d.poi.dob ? esc(fmtDate(d.poi.dob)) + ' <span class="pl-muted">(' + esc(d.poi.dob_basis) + ')</span>' : null],
        ['Care of', txt(d.poa.co)],
        ['Address', address(d.poa), 'wide'],
        ['Post office', txt(d.poa.po)],
        ['Resident status', txt(d.resident_status)],
        ['Aadhaar status', d.aadhaar_status ? chip(d.aadhaar_status, 'ok') : null],
        ['Mobile linked', d.contact.mobile_linked ? mono(d.contact.mobile_masked) : 'No'],
        ['E-mail linked', d.contact.email_linked ? 'Yes (held as a hash)' : 'No'],
        ['Last updated', txt(fmtDate(d.last_updated_on))],
      ]);
      var enrol = kv([
        ['Enrolment ID', mono(e.eid_masked)],
        ['Enrolled on', txt(fmtDate(e.enrolled_on))],
        ['Enrolment centre', txt(e.centre)],
        ['Basis', txt(e.basis)],
        ['Proof of identity', txt(e.documents.poi)],
        ['Proof of address', txt(e.documents.poa)],
        ['Proof of date of birth', txt(e.documents.pdb)],
        ['Biometrics', esc('Photo, fingerprints and irises ' + (d.biometrics.photo === 'Captured' ? 'captured' : 'not captured')) + ' <span class="pl-muted">(last update ' + esc(fmtDate(d.biometrics.last_update)) + ')</span>'],
      ]);
      var ver = kv([
        ['Channel', txt(v.channel)],
        ['Performed at', txt(fmtStamp(v.performed_at))],
        ['Signature', v.signature_valid ? chip('Valid · ' + v.signature_algorithm, 'ok') : chip('Not valid', 'danger')],
        ['Proof of presence', txt(v.proof_of_presence)],
        ['Aadhaar number received', v.aadhaar_number_received ? 'Yes' : 'No (masked reference only)'],
        ['Delete after', txt(fmtDate(v.retention && v.retention.delete_after))],
        ['UID token', mono(d.uid_token), 'wide'],
      ]);
      return recordShell(r, 'Aadhaar identity', mono(d.aadhaar_masked), body
        + '<h5 class="pl-sub">Enrolment</h5>' + enrol
        + '<h5 class="pl-sub">Verification by the ERP</h5>' + ver,
        chip('Verified', 'ok'));
    },
    aadhaar_enrolment: function (r) {
      var d = r.data, a = d.applicant || {};
      return recordShell(r, 'Aadhaar enrolment', 'EID ' + mono(r.ref.slice(0, 4) + ' XXXX XXXX ' + r.ref.slice(-2)),
        stepper(r) + kv([
          ['Aadhaar number issued', d.aadhaar_masked ? mono(d.aadhaar_masked) : null],
          ['Resident status', txt(d.resident_status)],
          ['Basis of enrolment', txt(d.basis)],
          ['Name', txt(a.name)],
          ['Gender', txt(gender(a.gender))],
          ['Date of birth', a.dob ? esc(fmtDate(a.dob)) + (a.dob_basis ? ' <span class="pl-muted">(' + esc(a.dob_basis) + ')</span>' : '') : null],
          ['Care of', txt(a.care_of)],
          ['Address', address(d.address), 'wide'],
          ['Proof of identity', d.documents ? txt(d.documents.poi) : null],
          ['Proof of address', d.documents ? txt(d.documents.poa) : null],
          ['Proof of date of birth', d.documents ? txt(d.documents.pdb) : null],
          ['Head of Family', d.hof ? esc(d.hof.name + ' (' + d.hof.relation + ')') + ' ' + mono(d.hof.aadhaar_masked) : null],
          ['Enrolment centre', txt(d.centre)],
          ['Submitted', txt(fmtStamp(d.submitted_at))],
          ['Deficiency', d.deficiency ? '<span class="pl-warn-text">' + esc(d.deficiency) + '</span>' : null, 'wide'],
          ['Reason for rejection', d.rejection_reason ? '<span class="pl-warn-text">' + esc(d.rejection_reason) + '</span>' : null, 'wide'],
        ]), progressChip(r));
    },
    aadhaar_update: function (r) {
      var d = r.data;
      var req = d.requested || {};
      var asked = Object.keys(req).map(function (k) {
        var v = req[k];
        var shown = k === 'mobile' ? 'XXXXXX' + String(v).slice(-4) : k === 'address' ? [v.house, v.loc, v.vtc, v.pc].filter(Boolean).join(', ') : k === 'dob' ? fmtDate(v) : k === 'gender' ? gender(v) : v;
        return esc(cap(k === 'dob' ? 'date of birth' : k)) + ': ' + esc(shown);
      }).join('<br>');
      return recordShell(r, 'Aadhaar update request', 'URN ' + mono(d.urn),
        stepper(r) + kv([
          ['Information to update', txt(d.update_items.join(', '))],
          ['Channel', txt(d.channel)],
          ['Submitted', txt(fmtStamp(d.submitted_at))],
          ['Documents', txt(d.documents.join(', '))],
          ['Fee', txt(d.fee)],
          ['Requested changes', asked || null, 'wide'],
          ['Deficiency', d.deficiency ? '<span class="pl-warn-text">' + esc(d.deficiency) + '</span>' : null, 'wide'],
          ['Reason for rejection', d.rejection_reason ? '<span class="pl-warn-text">' + esc(d.rejection_reason) + '</span>' : null, 'wide'],
        ]), progressChip(r));
    },
    fir: function (r, ctx) {
      var d = r.data;
      var accused = (d.accused || []).map(function (a) { return personLink(a.name, a.ref, ctx.ref) + (a.arrested_on ? ' <span class="pl-muted">(arrested ' + esc(fmtDate(a.arrested_on)) + ')</span>' : ''); }).join('<br>');
      var compl = (d.complainants || []).map(function (c) { return personLink(c.name, c.ref, ctx.ref) + ' <span class="pl-muted">(' + esc(c.role) + ')</span>'; }).join('<br>');
      var links = [];
      if (d.links && d.links.forensic) links.push('Forensic case ' + jumpLink(d.links.forensic, ctx.has(d.links.forensic)));
      if (d.links && d.links.cnr) links.push('CNR ' + jumpLink(d.links.cnr, ctx.has(d.links.cnr)));
      if (d.links && d.links.prisoner_no && ctx.role(r) === 'accused') links.push('Prisoner no. ' + jumpLink(d.links.prisoner_no, ctx.has(d.links.prisoner_no)));
      return recordShell(r, 'FIR ' + d.fir_no, esc(d.police_station + ', ' + d.district),
        kv([
          ['FIR number', mono(d.fir_no)],
          ['Police station', txt(d.police_station)],
          ['Registered on', txt(fmtDate(d.registered_on))],
          ['Offence', txt(d.offence)],
          ['Sections of law', sectionsHTML(d.sections), 'wide'],
          ['Investigating officer', txt(d.investigating_officer.rank_name + ' ' + d.investigating_officer.name)],
          ['Accused', accused || null],
          ['Complainant', compl || '<span class="pl-muted">Not in this dataset</span>'],
          ['Relation', txt(d.relation)],
          ['Linked records', links.join('<br>') || null, 'wide'],
        ]), roleChip(r.role));
    },
    verification_request: function (r) {
      var d = r.data, o = d.outcome;
      var subject = d.subject && d.subject.type === 'vehicle'
        ? 'Vehicle: registration ' + mono(d.subject.registration_number) + ', chassis ' + mono(d.subject.chassis_number) + ', engine ' + mono(d.subject.engine_number)
        : 'This person';
      return recordShell(r, d.service, 'Request ' + mono(d.request_id),
        stepper(r) + kv([
          ['Purpose', txt(d.purpose)],
          ['Requested by', txt(cap(d.requester_role))],
          ['Lawful basis', txt(d.lawful_basis)],
          ['Consent', d.consent ? esc('Recorded ' + fmtStamp(d.consent.given_at) + ' by ' + d.consent.method) : '<span class="pl-warn-text">Not recorded</span>'],
          ['Subject', subject, 'wide'],
          ['Certificate number', mono(d.certificate_no)],
          ['Outcome', o ? chip(o.text, o.status === 'no_record_found' ? 'ok' : 'warn') : '<span class="pl-muted">Awaiting the official check</span>', 'wide'],
          ['Checked on', o ? txt(fmtStamp(o.performed_at)) : null],
          ['Channel', o ? txt(o.channel + ' · ' + o.method) : null],
          ['Artefact', o ? txt(o.artefact) : null],
          ['Service available', d.service_available ? 'Yes' : '<span class="pl-warn-text">No</span>'],
          ['Note', txt(d.deferred_reason || d.blocked_reason), 'wide'],
        ]), progressChip(r));
    },
    forensic_submission: function (r) {
      var d = r.data, c = d.case;
      var exhibits = (d.exhibits || []).map(function (x) {
        return [esc(x.serial), esc(x.description), esc(x.quantity.value + ' ' + x.quantity.unit), txt(x.preservative), esc(x.source), esc(x.collected_by) + '<br><span class="pl-muted">' + esc(fmtStamp(x.collected_at)) + '</span>'];
      });
      var chain = (d.custody_events || []).map(function (x) {
        return [esc(x.seq), esc(x.type), esc(fmtStamp(x.at)), txt(x.from), txt(x.to), esc(x.seal_state) + (x.receipt_no ? '<br><span class="pl-muted">Receipt ' + esc(x.receipt_no) + '</span>' : '')];
      });
      return recordShell(r, 'Forensic examination', mono(d.lab_case_no),
        stepper(r) + kv([
          ['Laboratory', txt(d.laboratory), 'wide'],
          ['Division', txt(d.division)],
          ['Receipt', d.receipt.number ? mono(d.receipt.number) + ' <span class="pl-muted">' + esc(fmtStamp(d.receipt.issued_at)) + '</span>' : '<span class="pl-muted">Not yet deposited</span>'],
          ['Subject category', txt(d.subject_category)],
          ['Police station', txt(c.police_station)],
          ['Case / FIR number', mono(c.case_number)],
          ['Case date', txt(fmtDate(c.case_date))],
          ['Sections of law', sectionsHTML(c.sections), 'wide'],
          ['Medico-legal case no.', mono(c.mlc_number)],
          ['Post-mortem no.', mono(c.post_mortem_number)],
          ['Hospital', txt(c.hospital)],
          ['Forwarding memo', mono(d.memo_number)],
          ['Investigating officer', txt(d.investigating_officer.rank_name + ' ' + d.investigating_officer.name)],
          ['Forwarding authority', esc(d.forwarding_authority.rank_name + ' ' + d.forwarding_authority.name) + (d.forwarding_authority.rank_rule_satisfied ? ' ' + chip('Rank rule met', 'ok') : '')],
          ['Seal', esc(d.seal.type + ' ' + d.seal.identifier) + '<br><span class="pl-muted">Specimen supplied, attested by the ' + esc(d.seal.attested_by) + (d.seal.matches_specimen ? '; matches the specimen' : '') + '</span>', 'wide'],
          ['Transport', txt(d.transport)],
          ['Storage device supplied', d.storage_device_supplied ? 'Yes, of equal or greater capacity' : null],
          ['Questions for the laboratory', '<ul class="pl-list">' + (d.questions || []).map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ul>', 'wide'],
          ['Report', d.report ? esc('Ready ' + fmtDate(d.report.ready_on) + (d.report.dispatched_on ? '; dispatched ' + fmtDate(d.report.dispatched_on) : '; awaiting collection')) + '<br><span class="pl-muted">' + esc(d.report.note) + '</span>' : null, 'wide'],
          ['Deficiency', d.deficiency ? '<span class="pl-warn-text">' + esc(d.deficiency) + '</span>' : null, 'wide'],
        ])
        + table('Exhibits', exhibits.length, ['No.', 'Description', 'Quantity', 'Preservative', 'Source', 'Collected'], exhibits)
        + table('Chain of custody', chain.length, ['#', 'Event', 'When', 'From', 'To', 'Seal'], chain),
        roleChip(r.role) + progressChip(r));
    },
    court_case: function (r, ctx) {
      var d = r.data, p = d.parties;
      var hearings = (d.hearings || []).map(function (h) { return [esc(fmtDate(h.date)), esc(h.purpose), esc(h.business), esc(h.mode)]; });
      var orders = (d.orders || []).map(function (o) { return [esc(fmtDate(o.date)), chip(o.type === 'final' ? 'Final' : 'Interim', o.type === 'final' ? 'info' : 'neutral'), esc(o.title)]; });
      var nh = d.next_hearing;
      var witnesses = (p.witnesses || []).map(function (w) { return personLink(w.name, w.ref, ctx.ref) + ' <span class="pl-muted">(' + esc(w.role) + ')</span>'; }).join('<br>');
      return recordShell(r, d.case_type + ' ' + String(d.case_no).split(' ').pop(), 'CNR ' + mono(d.cnr),
        stepper(r)
        + (nh ? '<div class="pl-callout pl-callout--info">' + svg('clock') + '<div><b>Next hearing ' + esc(fmtDate(nh.date)) + '</b><span>' + esc(nh.purpose) + ' · ' + esc(nh.mode) + '</span></div></div>' : '')
        + kv([
          ['CNR', mono(d.cnr)],
          ['Case', txt(d.case_no)],
          ['Filing number', mono(d.filing_no)],
          ['Case state', chip(d.case_state, d.case_state === 'Disposed' ? 'ok' : 'info')],
          ['Court', txt(d.court), 'wide'],
          ['Court complex', txt(d.court_complex + ', ' + d.district)],
          ['Nature', txt(d.nature)],
          ['Petitioner', personLink(p.petitioner, p.petitioner_ref, ctx.ref) || null],
          ['Respondent', personLink(p.respondent, p.respondent_ref, ctx.ref) || null],
          ['This person', txt(d.party_role)],
          ['Witnesses', witnesses || null],
          ['Acts and sections', sectionsHTML(d.acts), 'wide'],
          ['Police station / FIR', d.police_station ? esc(d.police_station + ', FIR ' + d.fir_no) : null],
          ['Prosecutor', txt(d.prosecutor)],
          ['Advocate', d.defence_advocate ? esc(d.defence_advocate.name) + ' <span class="pl-muted pl-mono">' + esc(d.defence_advocate.bar) + '</span>' : null],
          ['Filed on', txt(fmtDate(d.filed_on))],
          ['Registered on', txt(fmtDate(d.registered_on))],
          ['Disposed on', txt(fmtDate(d.disposed_on))],
          ['Judgment', txt(d.judgment), 'wide'],
          ['Appeal', d.appeal ? esc(d.appeal.number + ', ' + d.appeal.court + ' (filed ' + fmtDate(d.appeal.filed_on) + '): ' + d.appeal.status) : null, 'wide'],
        ])
        + table('Hearing history', hearings.length, ['Date', 'Purpose', 'Business', 'Mode'], hearings)
        + table('Orders', orders.length, ['Date', 'Type', 'Order'], orders),
        roleChip(r.role) + progressChip(r));
    },
    custody: function (r, ctx) {
      var d = r.data;
      var visits = (d.visits_received || []).map(function (v) {
        return [esc(fmtDate(v.date)), personLink(v.visitor, v.visitor_ref, ctx.ref), esc(v.relation), esc(v.mode), chip(cap(v.status), { visited: 'ok', approved: 'info', registered: 'neutral', rejected: 'danger' }[v.status]), '<span class="pl-mono">' + esc(v.reg_no) + '</span>'];
      });
      var np = d.next_production;
      return recordShell(r, 'Custody record', 'Prisoner no. ' + mono(d.prisoner_no),
        stepper(r)
        + (np ? '<div class="pl-callout pl-callout--info">' + svg('clock') + '<div><b>Next court production ' + esc(fmtDate(np.date)) + '</b><span>' + esc(np.purpose) + ' · ' + esc(np.mode) + '</span></div></div>' : '')
        + kv([
          ['Prison', txt(d.prison), 'wide'],
          ['Category', d.in_custody ? chip(d.category, 'danger') : chip(d.category, 'neutral')],
          ['Prisoner number', mono(d.prisoner_no)],
          ['Earlier numbers', d.earlier_numbers && d.earlier_numbers.length ? mono(d.earlier_numbers.join(', ')) : null],
          ['Admitted on', txt(fmtDate(d.admitted_on))],
          ['Warrant', txt(d.warrant)],
          ['FIR', jumpLink(d.fir.police_station + ', FIR ' + d.fir.fir_no, null)],
          ['CNR', jumpLink(d.cnr, ctx.has(d.cnr))],
          ['Court', txt(d.court), 'wide'],
          ['Sections of law', sectionsHTML(d.sections), 'wide'],
          ['Sentence', txt(d.sentence)],
          ['Expected release', txt(fmtDate(d.expected_release))],
          ['Released on', d.released_on ? esc(fmtDate(d.released_on)) + ' <span class="pl-muted">(' + esc(d.release_reason) + ')</span>' : null],
          ['Inmate as recorded', esc(d.inmate.name + ', ' + d.inmate.gender + ', ' + d.inmate.age + ' years') + '<br><span class="pl-muted">Father: ' + esc(d.inmate.father_name) + '</span>'],
          ['Aadhaar linked', d.aadhaar_linked ? chip('Linked', 'ok') : chip('Not linked', 'warn')],
          ['Furlough and parole', d.furlough && d.furlough.length ? d.furlough.map(function (f) { return esc(f.kind + ' of ' + f.days + ' days from ' + fmtDate(f.from) + '; returned ' + f.returned.toLowerCase()); }).join('<br>') : null, 'wide'],
        ])
        + table('Visits received (e-Mulakat)', visits.length, ['Visit date', 'Visitor', 'Relation', 'Mode', 'Status', 'Registration'], visits),
        roleChip('inmate') + progressChip(r));
    },
    visit_request: function (r, ctx) {
      var d = r.data;
      return recordShell(r, 'e-Mulakat visit', 'Registration ' + mono(d.registration_no),
        stepper(r) + kv([
          ['Visit date', txt(fmtDate(d.visit_date))],
          ['Mode', txt(d.visit_mode)],
          ['Slot', txt(d.slot)],
          ['Prison', txt(d.prison), 'wide'],
          ['Prisoner', personLink(d.prisoner.name, d.prisoner.ref, ctx.ref) + ' <span class="pl-muted">(' + esc(d.prisoner.gender + ', ' + d.prisoner.age) + '; father ' + esc(d.prisoner.father_name) + ')</span>', 'wide'],
          ['Relationship', txt(d.relationship)],
          ['Identity proof', d.identity_proof.number_masked ? esc(d.identity_proof.type) + ' ' + mono(d.identity_proof.number_masked) : txt(d.identity_proof.type)],
          ['Additional visitors', txt(String(d.additional_visitors))],
          ['Visitor address', txt(d.visitor.address), 'wide'],
          ['Reason', d.rejection_reason ? '<span class="pl-warn-text">' + esc(d.rejection_reason) + '</span>' : null, 'wide'],
        ]), progressChip(r));
    },
    grievance: function (r, ctx) {
      var d = r.data;
      return recordShell(r, 'Prison grievance', 'Request ' + mono(r.ref),
        stepper(r) + kv([
          ['Category', txt(d.category), 'wide'],
          ['Message', '<blockquote class="pl-quote">' + esc(d.message) + '</blockquote>', 'wide'],
          ['Prison', txt(d.prison)],
          ['Prisoner', personLink(d.prisoner.name, d.prisoner.ref, ctx.ref)],
          ['Relation with inmate', txt(d.relation)],
          ['Action taken', txt(d.action), 'wide'],
        ]), progressChip(r));
    },
  };

  // ---------------------------------------------------------------- the app
  function mount(container, opts) {
    /* the full Aadhaar number, for the admin, for REVEAL_MS; then masked again */
    function toggleAadhaar(btn) {
      var wrap = btn.closest('.pl-aadhaar');
      var c = wrap && wrap.querySelector('[data-aadhaar-chip]');
      if (!c) return;
      var mask = function () {
        clearTimeout(revealTimer); revealTimer = null;
        c.textContent = 'Aadhaar ' + c.getAttribute('data-masked');
        c.classList.remove('is-revealed');
        btn.classList.remove('is-on'); btn.textContent = 'i';
        btn.title = 'Show the full Aadhaar number (admin only, recorded in the audit log)';
      };
      if (btn.classList.contains('is-on')) { mask(); return; }
      if (btn.disabled) return;
      btn.disabled = true;
      fetch(api + '/person/' + encodeURIComponent(btn.getAttribute('data-reveal-aadhaar')) + '/aadhaar', {
        method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json' },
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (b) {
          if (res.status === 401 || res.status === 403) throw new Error('Sign in again to see the Aadhaar number.');
          if (!res.ok || !b.aadhaar) throw new Error(b.error || 'The Aadhaar number could not be read.');
          return b;
        });
      }).then(function (b) {
        btn.disabled = false;
        if (!c.isConnected) return;
        c.textContent = 'Aadhaar ' + b.aadhaar;
        c.classList.add('is-revealed');
        btn.classList.add('is-on'); btn.textContent = '\u00d7';
        btn.title = 'Hide the Aadhaar number (hides itself after ' + (REVEAL_MS / 1000) + ' seconds)';
        clearTimeout(revealTimer);
        revealTimer = setTimeout(mask, REVEAL_MS);
      }, function (err) {
        btn.disabled = false;
        btn.title = err.message;
        window.alert(err.message);
      });
    }

    opts = opts || {};
    var api = (opts.api || '/api/lookup').replace(/\/$/, '');
    var urlState = opts.urlState !== false;
    var loginUrl = opts.loginUrl || null;
    // The hub (admin) can show the full Aadhaar number for a moment; every reveal is audited. The ERP console cannot.
    var revealAadhaar = !!opts.revealAadhaar;
    var REVEAL_MS = 30000;
    var revealTimer = null;
    var inflight = null;
    var current = null;   // { kind:'q'|'ref', value }

    container.innerHTML = ''
      + '<div class="pl">'
      + '<div class="page-head pl-page-head"><div><h1 class="page-title">Person Lookup</h1>'
      + '<p class="page-desc">Search one identifier and see what UIDAI, CCTNS, e-Forensics, eCourts and ePrisons hold about the person, side by side.</p></div>'
      + '<div class="page-actions pl-actions"><button type="button" class="btn pl-print" data-print hidden>' + svg('print') + 'Print profile</button></div></div>'
      + '<section class="pl-card pl-search" aria-label="Search">'
      + '<form class="pl-form" novalidate role="search" autocomplete="off">'
      + '<label class="pl-label" for="pl-q">Identifier</label>'
      + '<div class="pl-row"><div class="pl-field">' + svg('search', 'pl-field-ic')
      + '<input id="pl-q" class="pl-input" type="search" inputmode="text" maxlength="80" spellcheck="false" autocapitalize="off" placeholder="Aadhaar number, mobile, CNR, FIR no., prisoner no. or name" aria-describedby="pl-hint pl-err">'
      + '<span class="pl-detect" aria-live="polite"></span>'
      + '<button type="button" class="pl-clear" aria-label="Clear the search" hidden>' + svg('close') + '</button></div>'
      + '<button type="submit" class="btn btn-primary pl-go"><span class="pl-spin" aria-hidden="true"></span><span class="pl-go-t">Search</span></button></div>'
      + '<p class="pl-err" id="pl-err" role="alert" hidden></p>'
      + '<p class="pl-hint" id="pl-hint">Accepted: Aadhaar number · enrolment ID · mobile number · CNR · FIR number/year · prisoner number · forensic case number · e-Mulakat registration · name</p>'
      + '</form>'
      + '</section>'
      + '<p class="pl-sr" role="status" aria-live="polite"></p>'
      + '<div class="pl-result" aria-busy="false"></div>'
      + '</div>';

    var $ = function (s) { return container.querySelector(s); };
    var form = $('.pl-form'), input = $('#pl-q'), detect = $('.pl-detect'), clearBtn = $('.pl-clear');
    var err = $('#pl-err'), go = $('.pl-go'), result = $('.pl-result'), printBtn = $('.pl-print');
    var live = $('.pl-sr[role="status"]');
    /** One short sentence for screen readers; the result area itself is not live. */
    function announce(text) { live.textContent = ''; setTimeout(function () { live.textContent = text; }, 30); }

    // ---------------- network
    /**
     * GET a JSON document from the lookup API. A foreground request (a search
     * or a profile) cancels the one before it, so a slow answer can never
     * overwrite a newer one; background requests (the source list, the demo
     * identities) run on their own.
     */
    function request(path, background) {
      if (!background && inflight) inflight.abort();
      var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      if (!background) inflight = ctl;
      var timedOut = false;
      var timer = setTimeout(function () { timedOut = true; if (ctl) ctl.abort(); }, REQUEST_TIMEOUT_MS);
      return fetch(api + path, { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: ctl ? ctl.signal : undefined })
        .then(function (res) {
          return res.text().then(function (text) {
            var body = null;
            try { body = text ? JSON.parse(text) : null; } catch (e) { body = null; }
            if (res.status === 401 || res.status === 403) throw { kind: 'auth' };
            if (!res.ok) throw { kind: 'http', status: res.status, message: body && body.error };
            if (!body) throw { kind: 'bad' };
            return body;
          });
        })
        // one place decides what went wrong, whether it failed before or during the download
        .catch(function (e) {
          if (e && e.kind) throw e;
          if (ctl && ctl.signal.aborted) throw { kind: timedOut ? 'timeout' : 'aborted' };
          throw { kind: 'network' };
        })
        .then(function (body) { clearTimeout(timer); if (inflight === ctl) inflight = null; return body; },
          function (e) { clearTimeout(timer); if (inflight === ctl) inflight = null; throw e; });
    }

    /** A page that could not be drawn is reported to the console and shown as an error, never left blank. */
    function reportRenderError(e) {
      if (root.console && root.console.error) root.console.error('[person-lookup] could not draw the answer:', e);
    }

    function failure(e, retry) {
      if (e && e.kind === 'aborted') return;
      busy(false);
      var t = {
        auth: ['Your session has ended', 'Sign in again to keep searching.'],
        timeout: ['The search took too long', 'The ERP did not answer within ' + (REQUEST_TIMEOUT_MS / 1000) + ' seconds. Try again.'],
        network: ['The ERP could not be reached', 'Check the connection to the ERP service and try again.'],
        bad: ['The ERP sent an unreadable answer', 'Try again. If it happens again, tell the system administrator.'],
        http: ['The search could not be completed', (e && e.message) || ('The ERP answered with HTTP ' + (e && e.status) + '. Try again.')],
      }[(e && e.kind) || 'network'] || ['Something went wrong', 'Try again.'];
      var action = e && e.kind === 'auth' && loginUrl
        ? '<a class="btn btn-primary" href="' + esc(loginUrl) + '">Sign in</a>'
        : '<button type="button" class="btn" data-retry>' + svg('retry') + 'Try again</button>';
      result.innerHTML = stateCard('alert', 'danger', t[0], esc(t[1]), action);
      announce(t[0] + '. ' + t[1]);
      result._retry = retry;
      printBtn.hidden = true;
    }

    function busy(on, text) {
      result.setAttribute('aria-busy', on ? 'true' : 'false');
      go.disabled = !!on;
      go.classList.toggle('is-busy', !!on);
      if (on) {
        result.innerHTML = '<div class="pl-card pl-loading" role="status">'
          + '<div class="pl-loading-head"><span class="pl-spin pl-spin--lg" aria-hidden="true"></span><div><b>' + esc(text || 'Searching') + '</b>'
          + '<span>Asking UIDAI, CCTNS, e-Forensics, eCourts and ePrisons…</span></div></div>'
          + '<div class="pl-skel"><i style="width:38%"></i><i style="width:64%"></i><i style="width:52%"></i></div>'
          + '<div class="pl-skel-grid">' + ORDER.map(function () { return '<i></i>'; }).join('') + '</div></div>';
      }
    }

    function stateCard(icon, tone, title, text, actions) {
      return '<div class="pl-card pl-state pl-state--' + tone + '">'
        + '<div class="pl-state-ic">' + svg(icon) + '</div>'
        + '<h2 class="pl-state-title">' + esc(title) + '</h2>'
        + '<p class="pl-state-text">' + text + '</p>'
        + (actions ? '<div class="pl-state-actions">' + actions + '</div>' : '') + '</div>';
    }

    // ---------------- url state
    function writeUrl(kind, value, replace) {
      if (!urlState || !root.history || !root.history.pushState) return;
      var url = new URL(root.location.href);
      url.searchParams.delete('q'); url.searchParams.delete('ref');
      if (kind && value) url.searchParams.set(kind, value);
      var next = url.pathname + (url.search || '') + url.hash;
      if (next === root.location.pathname + root.location.search + root.location.hash) return;
      root.history[replace ? 'replaceState' : 'pushState']({ pl: true }, '', next);
    }
    function readUrl() {
      if (!urlState) return null;
      var sp = new URLSearchParams(root.location.search);
      if (sp.get('ref')) return { kind: 'ref', value: sp.get('ref') };
      if (sp.get('q')) return { kind: 'q', value: sp.get('q') };
      return null;
    }

    // ---------------- actions
    function showError(msg) {
      err.textContent = msg || '';
      err.hidden = !msg;
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      input.parentNode.classList.toggle('is-invalid', !!msg);
    }

    function runSearch(text, fromHistory) {
      var q = String(text || '').trim();
      if (!q) { showError('Enter an identifier to search.'); input.focus(); return; }
      if (q.length > 80) { showError('That is too long to be an identifier.'); return; }
      showError('');
      // kept as live nodes (with their listeners) in case the identifier turns out to be invalid
      var previous = Array.prototype.slice.call(result.childNodes);
      var previousCurrent = current;
      var previousPrint = printBtn.hidden;
      current = { kind: 'q', value: q };
      if (!fromHistory) writeUrl('q', q);
      busy(true, 'Searching for ' + q);
      request('?q=' + encodeURIComponent(q)).then(function (body) {
        busy(false);
        if (body.status === 'invalid') {
          // The message sits under the field and what was shown before stays. If that was
          // a search still loading (now cancelled) or nothing at all, go back to the start.
          var stale = !previous.length || previous.some(function (n) { return n.nodeType === 1 && n.classList.contains('pl-loading'); });
          if (stale) {
            current = null;
            if (!fromHistory) writeUrl(null, null, true);
            renderIdle();
          } else {
            result.innerHTML = '';
            previous.forEach(function (n) { result.appendChild(n); });
            printBtn.hidden = previousPrint;
            current = previousCurrent;
            if (!fromHistory) writeUrl(previousCurrent ? previousCurrent.kind : null, previousCurrent ? previousCurrent.value : null, true);
          }
          showError(body.error);
          input.focus();
          return;
        }
        if (body.status === 'not_found') return renderNotFound(body.query);
        if (body.status === 'multiple') return renderCandidates(body.query, body.candidates);
        if (body.status === 'found') {
          writeUrl('ref', body.profile.subject.ref, true);
          current = { kind: 'ref', value: body.profile.subject.ref };
          return renderProfile(body.profile, body.query);
        }
        failure({ kind: 'bad' });
      }).catch(function (e) {
        if (!e || !e.kind) { reportRenderError(e); e = { kind: 'bad' }; }
        failure(e, function () { runSearch(q, true); });
      });
    }

    function openRef(ref, fromHistory) {
      current = { kind: 'ref', value: ref };
      if (!fromHistory) writeUrl('ref', ref);
      showError('');
      busy(true, 'Opening ' + ref);
      request('/person/' + encodeURIComponent(ref)).then(function (body) {
        busy(false);
        renderProfile(body, null);
      }).catch(function (e) {
        if (!e || !e.kind) { reportRenderError(e); e = { kind: 'bad' }; }
        if (e && e.kind === 'http' && e.status === 404) {
          busy(false);
          result.innerHTML = stateCard('nothing', 'neutral', 'No such person', 'No person has the reference <span class="pl-mono">' + esc(ref) + '</span>.', '');
          printBtn.hidden = true;
          return;
        }
        failure(e, function () { openRef(ref, true); });
      });
    }

    // ---------------- idle and empty states
    // ---------------- live: records arriving from the departments
    var TYPE_LABEL = {
      fir: 'an FIR', verification_request: 'a police verification', forensic_submission: 'a forensic case', court_case: 'a court case',
      custody: 'a custody record', visit_request: 'an e-Mulakat visit', grievance: 'a grievance', aadhaar_identity: 'an Aadhaar identity',
      aadhaar_update: 'an Aadhaar update request', aadhaar_enrolment: 'an Aadhaar enrolment',
    };
    var liveFeed = [];
    var liveSource = null;
    function startLive() {
      if (liveSource || !root.EventSource) return;
      try {
        liveSource = new root.EventSource(api + '/stream');
        liveSource.addEventListener('record', function (e) {
          var ev;
          try { ev = JSON.parse(e.data); } catch (x) { return; }
          onLive(ev);
        });
      } catch (x) { liveSource = null; }
    }
    // The changes of one person as a vertical stepper, oldest first: finished steps are ticked and joined by a green line,
    // the newest is the current step.
    function liveStep(ev, i, total) {
      var now = i === total - 1;
      var when = ev.receivedAt ? fmtLocal(ev.receivedAt) : '';
      return '<li class="pl-step ' + (now ? 'is-now' : 'is-done') + '"' + (now ? ' aria-current="step"' : '') + '>'
        + '<span class="pl-step-node" aria-hidden="true">' + (now ? '' : '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 8.4 2.9 2.9 6.1-6.3"/></svg>') + '</span>'
        + '<div class="pl-step-body"><b>' + (ev.change === 'updated' ? 'Updated ' : 'Recorded ') + esc(TYPE_LABEL[ev.type] || ev.type) + '</b>'
        + (ev.status ? ' <span class="pl-muted">(' + esc(cap(ev.status)) + ')</span>' : '') + '<span class="pl-muted pl-mono">' + esc(ev.ref) + '</span></div>'
        + '<span class="pl-step-meta"><time class="pl-muted">' + esc(when) + '</time>' + (now ? '<span class="pl-step-tag">Latest</span>' : '') + '</span></li>';
    }
    // The changes are told apart by the website they came from: one section per department, each in its own colour with its own icon.
    function liveDepts(events) {
      var by = {};
      events.forEach(function (ev) { (by[ev.source] = by[ev.source] || []).push(ev); });
      var codes = ORDER.filter(function (c) { return by[c]; }).concat(Object.keys(by).filter(function (c) { return ORDER.indexOf(c) < 0; }));
      return codes.map(function (c) {
        var list = by[c].slice().reverse();
        var sys = SYSTEMS[c] || { name: c, short: c };
        return '<section class="pl-dept pl-sys--' + esc(c) + '" aria-label="' + esc(sys.name + ', ' + plural(list.length, 'change')) + '">'
          + '<header class="pl-dept-head"><span class="pl-sys-ic pl-sys-ic--lg pl-sys--' + esc(c) + '" aria-hidden="true">' + svg(c) + '</span>'
          + '<div><b>' + esc(sys.name) + '</b><span class="pl-muted">' + esc(plural(list.length, 'change')) + ' · latest ' + esc(list[list.length - 1].receivedAt ? fmtLocal(list[list.length - 1].receivedAt) : '') + '</span></div></header>'
          + '<ol class="pl-steps">' + list.map(function (ev, i) { return liveStep(ev, i, list.length); }).join('') + '</ol></section>';
      }).join('');
    }
    // One row per person: a person with several changes is still one person, so their changes are folded under one row
    // that opens to show each of them.
    var liveOpen = {};
    // the live changes live inside the people list now (one card, not two)
    function drawLive(fresh) { drawPeople(fresh); }
    function onLive(ev) {
      liveFeed.unshift(ev);
      liveFeed = liveFeed.slice(0, 200);
      drawLive(true);
      if (result.querySelector('[data-people]') && !peopleState.all) loadPeople();
      // the person on screen has a new or changed record
      if (current && current.kind === 'ref' && (ev.subjects || []).some(function (p) { return p.ref === current.value; })) {
        var prof = result.querySelector('.pl-profile');
        if (!prof) return;
        var old = prof.querySelector('.pl-live-banner');
        if (old) old.remove();
        prof.insertAdjacentHTML('afterbegin', '<div class="pl-alert pl-alert--info pl-live-banner" role="status">' + svg('info') + '<div><b>New from ' + esc((SYSTEMS[ev.source] || {}).short || ev.source) + '</b>'
          + '<span>' + esc(cap(TYPE_LABEL[ev.type] || ev.type)) + ' ' + esc(ev.ref) + (ev.change === 'updated' ? ' has just been updated.' : ' has just arrived for this person.') + '</span></div>'
          + '<button type="button" class="btn btn-sm" data-reload>' + svg('retry') + 'Show it</button></div>');
        announce('New record from ' + ((SYSTEMS[ev.source] || {}).short || ev.source) + ' for this person.');
      }
    }

    // ---------------- the people the ERP holds: a real count, the first 50 shown, the rest loaded on request
    var PEOPLE_FIRST = 50;
    var peopleState = { list: [], total: 0, all: false };
    function eventsOf(ref) { return liveFeed.filter(function (ev) { return (ev.subjects || []).some(function (p) { return p.ref === ref; }); }); }
    function drawPeople(fresh) {
      var box = result.querySelector('[data-people]');
      if (!box) return;
      var badge = result.querySelector('[data-people-n]');
      if (badge) badge.textContent = peopleState.total;
      if (!peopleState.list.length) { box.innerHTML = '<p class="pl-muted pl-pad">No person is on file yet. People appear here as the departments send their records.</p>'; return; }
      var newest = liveFeed.length ? ((liveFeed[0].subjects || [])[0] || {}).ref : null;
      var rows = peopleState.list.map(function (p) {
        var ev = eventsOf(p.ref), open = !!liveOpen[p.ref] && ev.length > 0;
        var chips = (p.systems || []).map(function (c) { return '<span class="pl-sys-ic pl-sys--' + esc(c) + '" title="' + esc((SYSTEMS[c] || {}).name || c) + '">' + svg(c) + '</span>'; }).join('');
        var meta = [p.district, plural(p.records, 'record')].filter(Boolean).map(esc).join(' · ') + (ev.length ? ' · ' + esc(plural(ev.length, 'recent change')) : '');
        return '<li class="pl-lg' + (open ? ' is-open' : '') + (fresh && p.ref === newest ? ' is-new' : '') + '">'
          + '<div class="pl-lg-head"><span class="pl-avatar pl-avatar--sm" aria-hidden="true">' + esc(initials(p.name)) + '</span>'
          + '<div><button type="button" class="pl-link" data-open-ref="' + esc(p.ref) + '">' + esc(p.name) + '</button><span class="pl-muted">' + meta + '</span></div>'
          + '<span class="pl-person-sys">' + chips + '</span>'
          + (ev.length ? '<button type="button" class="pl-lg-toggle" data-live-toggle="' + esc(p.ref) + '" aria-expanded="' + open + '" aria-label="' + (open ? 'Hide' : 'Show') + ' the recent changes for ' + esc(p.name) + '">' + svg('arrow', 'pl-ic pl-lg-chev') + '</button>' : '<span></span>')
          + '</div>'
          + (open ? '<div class="pl-lg-items">' + liveDepts(ev) + '</div>' : '') + '</li>';
      }).join('');
      var rest = peopleState.total - peopleState.list.length;
      box.innerHTML = '<ol class="pl-live pl-people">' + rows + '</ol>'
        + (rest > 0 ? '<div class="pl-people-more"><span class="pl-muted">Showing ' + peopleState.list.length + ' of ' + peopleState.total + ' people</span><button type="button" class="btn btn-sm" data-people-more>Show all ' + peopleState.total + ' people</button></div>' : '');
    }
    function loadPeople() {
      request('/people?limit=' + PEOPLE_FIRST + '&offset=0', true).then(function (b) {
        peopleState.list = b.people || []; peopleState.total = Number(b.total) || 0; peopleState.all = false;
        drawPeople();
      }, function () { var box = result.querySelector('[data-people]'); if (box) box.innerHTML = '<p class="pl-muted pl-pad">The list of people could not be loaded. Searching still works.</p>'; });
    }
    function loadMorePeople() {
      var btn = result.querySelector('[data-people-more]');
      if (btn) { btn.disabled = true; btn.textContent = 'Loading…'; }
      (function next() {
        if (peopleState.list.length >= peopleState.total) { peopleState.all = true; drawPeople(); return; }
        request('/people?limit=500&offset=' + peopleState.list.length, true).then(function (b) {
          var more = b.people || [];
          if (!more.length) { peopleState.total = peopleState.list.length; drawPeople(); return; }
          peopleState.list = peopleState.list.concat(more); peopleState.total = Number(b.total) || peopleState.total;
          next();
        }, function () { drawPeople(); });
      })();
    }

    function renderIdle() {
      printBtn.hidden = true;
      result.innerHTML = '<div class="pl-card pl-idle"><div class="pl-idle-head">' + svg('users') + '<div><h2>People in the ERP <span class="pl-more-n" data-people-n>…</span></h2>'
        + '<p>People the departments have sent records for. Open one to see their changes.</p></div></div>'
        + '<div data-people><p class="pl-muted pl-pad">Loading…</p></div></div>'
        + '<div class="pl-card pl-idle"><div class="pl-idle-head">' + svg('plug') + '<div><h2>Connected systems</h2>'
        + '<p>A search asks all five at once; one that does not answer is shown as unavailable.</p></div></div>'
        + '<div class="pl-sources" data-sources>' + ORDER.map(function (c) {
          return '<div class="pl-source"><div class="pl-source-top"><span class="pl-sys-ic pl-sys-ic--lg pl-sys--' + c + '">' + svg(c) + '</span><div class="pl-source-txt"><b>' + esc(SYSTEMS[c].name) + '</b><p class="pl-source-holds pl-muted">…</p></div></div></div>';
        }).join('') + '</div></div>';
      loadPeople();
      request('/sources', true).then(function (b) {
        var box = result.querySelector('[data-sources]');
        if (!box) return;
        box.innerHTML = b.sources.map(function (s) {
          var n = Number(s.records) || 0;
          return '<div class="pl-source"><div class="pl-source-top"><span class="pl-sys-ic pl-sys-ic--lg pl-sys--' + esc(s.code) + '">' + svg(s.code) + '</span>'
            + '<div class="pl-source-txt"><b>' + esc(s.name) + '</b><p class="pl-source-holds">' + esc(s.holds) + '</p>'
            + '<span class="pl-muted pl-host" title="' + esc(s.hostname) + '">' + esc(s.hostname) + '</span></div></div>'
            + '<div class="pl-source-foot"><span class="pl-src-count' + (n ? '' : ' is-zero') + '"><b>' + n + '</b> ERP ' + (n === 1 ? 'record' : 'records') + (n && s.people != null ? '<small>for ' + plural(Number(s.people), 'person', 'people') + '</small>' : '') + '</span>'
            + '<span class="pl-src-last"><span>Last received</span><b>' + (s.lastReceivedAt ? esc(fmtLocal(s.lastReceivedAt)) : 'Nothing yet') + '</b></span></div></div>';
        }).join('');
      }, function () {
        var box = result.querySelector('[data-sources]');
        if (box) box.insertAdjacentHTML('afterend', '<p class="pl-muted pl-pad">The list of connected systems could not be loaded. Searching still works.</p>');
      });
      if (!liveFeed.length) {
        request('/recent?limit=50', true).then(function (b) {
          if (liveFeed.length) return;
          liveFeed = (b.recent || []).slice(0, 50).map(function (x) { return { source: x.source, type: x.type, ref: x.ref, receivedAt: x.receivedAt, subjects: x.subjects, change: x.change }; });
          drawLive();
        }, function () { drawLive(); });
      } else drawLive();
    }

    function renderNotFound(query) {
      printBtn.hidden = true;
      var what = query && query.display ? esc(lower(query.label)) + ' <b class="pl-mono">' + esc(query.display) + '</b>' : 'this identifier';
      announce('No person found.');
      result.innerHTML = stateCard('nothing', 'neutral', 'No person found',
        'None of the five systems holds a record for ' + what + '.<br>Check the identifier, or search with another one the person is known by.',
        '<button type="button" class="btn" data-focus-search>' + svg('search') + 'Search again</button>');
    }

    function renderCandidates(query, list) {
      printBtn.hidden = true;
      var rows = list.map(function (c) {
        var counts = ORDER.map(function (code) {
          var n = (c.counts || {})[code] || 0;
          return '<span class="pl-mini' + (n ? ' is-on' : '') + '" title="' + esc(SYSTEMS[code].name + ': ' + plural(n, 'record')) + '">' + esc(SYSTEMS[code].short) + (n ? ' ' + n : '') + '</span>';
        }).join('');
        // the whole row opens the person for a mouse; the name is the real button for keyboards and screen readers
        return '<tr data-open-ref="' + esc(c.ref) + '">'
          + '<td><div class="pl-cand"><span class="pl-avatar pl-avatar--sm" aria-hidden="true">' + esc(initials(c.name)) + '</span><div>'
          + '<button type="button" class="pl-cand-name" data-open-ref="' + esc(c.ref) + '" aria-label="Open the profile of ' + esc(c.name + ', ' + c.ref) + '">' + esc(c.name) + '</button>'
          + '<span class="pl-muted pl-mono">' + esc(c.ref) + '</span></div></div></td>'
          + '<td>' + esc(gender(c.gender)) + (c.birthYear ? ', born ' + esc(c.birthYear) : '') + '</td>'
          + '<td>' + esc(c.district || '') + '</td>'
          + '<td>' + (c.aadhaar ? '<span class="pl-mono">' + esc(c.aadhaar) + '</span>' : '<span class="pl-muted">Not linked</span>') + '</td>'
          + '<td><div class="pl-minis">' + counts + '</div></td>'
          + '<td class="pl-td-go"><span class="btn btn-sm" aria-hidden="true">Open' + svg('arrow') + '</span></td></tr>';
      }).join('');
      announce(plural(list.length, 'person', 'people') + ' match. Choose one to open.');
      result.innerHTML = '<section class="pl-card"><header class="pl-card-head"><div><h2 class="pl-h2">' + plural(list.length, 'person', 'people') + ' match</h2>'
        + '<p class="pl-muted">' + esc(query.label) + ' <b class="pl-mono">' + esc(query.display) + '</b>. Choose the person to open.</p></div></header>'
        + '<div class="pl-table-wrap"><table class="pl-table pl-table--pick"><thead><tr><th scope="col">Person</th><th scope="col">Gender, birth year</th><th scope="col">District</th><th scope="col">Aadhaar</th><th scope="col">Records</th><th scope="col"><span class="pl-sr">Open</span></th></tr></thead><tbody>'
        + rows + '</tbody></table></div></section>';
    }

    // ---------------- the profile
    function renderProfile(p, query) {
      // any number a record carries (its reference, CNR, laboratory or prisoner number) leads to that record
      var refs = {};
      p.sources.forEach(function (s) {
        s.records.forEach(function (r) {
          refs[r.ref] = r.ref;
          var d = r.data || {};
          [d.cnr, d.lab_case_no, d.prisoner_no, d.registration_no].concat(d.earlier_numbers || []).forEach(function (x) { if (x && !refs[x]) refs[x] = r.ref; });
        });
      });
      var ctx = {
        ref: p.subject.ref,
        has: function (ref) { return ref && refs[ref] ? refs[ref] : null; },
        role: function (r) { return r.role; },
      };
      var s = p.subject;
      var srcBy = {};
      p.sources.forEach(function (x) { srcBy[x.code] = x; });

      var coverage = ORDER.map(function (code) {
        var src = srcBy[code] || { status: 'error', count: 0 };
        var label = src.status === 'found' ? plural(src.count, 'record') : src.status === 'none' ? 'No records' : 'Unavailable';
        return '<button type="button" class="pl-cov pl-cov--' + src.status + '" data-jump="pl-src-' + code + '">'
          + '<span class="pl-sys-ic pl-sys--' + code + '">' + svg(code) + '</span><span class="pl-cov-t"><b>' + esc(SYSTEMS[code].short) + '</b><span>' + esc(label) + '</span></span></button>';
      }).join('');

      var ids = (s.identifiers || []).map(function (i) {
        return '<li><span class="pl-muted">' + esc(i.label) + '</span><span class="pl-mono">' + esc(i.value) + '</span></li>';
      }).join('');

      var meta = [gender(s.gender), s.age != null ? s.age + ' years' : null, s.dob ? 'born ' + fmtDate(s.dob) + (s.dobBasis ? ' (' + s.dobBasis + ')' : '') : null, s.district].filter(Boolean).map(esc).join(' · ');

      var head = '<section class="pl-card pl-id">'
        + '<div class="pl-id-main"><span class="pl-avatar" aria-hidden="true">' + esc(initials(s.name)) + '</span>'
        + '<div class="pl-id-text"><div class="pl-eyebrow">Person ' + esc(s.ref) + (query ? ' · found by ' + esc(lower(query.label)) : '') + '</div>'
        + '<h2 class="pl-id-name">' + esc(s.name) + '</h2><div class="pl-id-meta">' + meta + '</div>'
        + '<div class="pl-id-tags">'
        + (s.aadhaar
          ? '<span class="pl-aadhaar">' + chip('Aadhaar ' + s.aadhaar, 'outline', ' data-aadhaar-chip data-masked="' + esc(s.aadhaar) + '"')
            + (revealAadhaar ? '<button type="button" class="pl-reveal" data-reveal-aadhaar="' + esc(s.ref) + '" title="Show the full Aadhaar number (admin only, recorded in the audit log)" aria-label="Show the full Aadhaar number">i</button>' : '')
            + '</span>'
          : chip('Aadhaar not linked', 'warn'))
        + (s.verified ? '<span class="pl-chip pl-chip--ok">' + svg('shield', 'pl-ic pl-ic--xs') + 'Verified ' + esc(fmtDate(s.verified.performed_at)) + '</span>' : '')
        + '</div>'
        + (s.address ? '<div class="pl-id-addr">' + svg('map', 'pl-ic pl-ic--sm') + '<span>' + address(s.address) + '</span></div>' : '')
        + matchedBy(s.matchedBy)
        + '</div></div>'
        + '<div class="pl-cov-grid" role="group" aria-label="Records per system">' + coverage + '</div>'
        + (ids ? '<details class="pl-more pl-ids"><summary><span>Identifiers held</span><span class="pl-more-n">' + s.identifiers.length + '</span></summary><ul class="pl-id-list">' + ids + '</ul></details>' : '')
        + '</section>';

      var alerts = (p.alerts || []).map(function (a) {
        return '<div class="pl-alert pl-alert--' + esc(a.tone) + '">' + svg(a.tone === 'info' ? 'clock' : 'alert') + '<div><b>' + esc(a.title) + '</b><span>' + esc(a.detail || '') + '</span></div>'
          + '<span class="pl-alert-sys">' + esc((SYSTEMS[a.system] || {}).short || '') + '</span></div>';
      }).join('');

      var journeys = (p.journeys || []).length
        ? '<section class="pl-section pl-card pl-headed" id="pl-journeys"><header class="pl-section-head">' + svg('route') + '<div><h3>Case journey</h3><p>Each FIR followed through the forensic laboratory, the court and the prison, read from the status each system reports.</p></div></header>'
          + '<div class="pl-journeys">' + p.journeys.map(function (j, i) { return '<div class="pl-journey" data-journey="' + i + '"></div>'; }).join('') + '</div></section>'
        : '';

      var sections = ORDER.map(function (code) { return srcBy[code] ? sourceSection(srcBy[code], ctx) : ''; }).join('');

      var tl = p.timeline || [];
      var timeline = '<section class="pl-section pl-card pl-headed" id="pl-timeline"><header class="pl-section-head">' + svg('list') + '<div><h3>Timeline</h3><p>Every dated event from every system, newest first.</p></div></header>'
        + (tl.length ? '<div class="pl-card pl-tl-card"><ol class="pl-tl">' + tl.map(function (e, i) {
          return '<li class="pl-tl-item' + (i >= 12 ? ' is-extra' : '') + '"' + (i >= 12 ? ' hidden' : '') + '><span class="pl-tl-date">' + esc(fmtDate(e.date)) + '</span>'
            + '<span class="pl-tl-dot pl-sys--' + esc(e.system) + '"></span><div class="pl-tl-body"><b>' + esc(e.title) + '</b><span>' + esc(e.detail) + '</span></div>'
            + '<span class="pl-tl-sys">' + esc((SYSTEMS[e.system] || {}).short || e.system) + '</span></li>';
        }).join('') + '</ol>'
          + (tl.length > 12 ? '<button type="button" class="btn btn-sm pl-tl-more" data-tl-more aria-expanded="false">Show all ' + tl.length + ' events</button>' : '')
          + '</div>'
          : '<div class="pl-card">' + emptyBlock('clock', 'No dated events', 'None of the systems recorded a dated event for this person.') + '</div>')
        + '</section>';

      var jump = '<nav class="pl-jump" aria-label="Sections of this profile">'
        + (journeys ? '<button type="button" data-jump="pl-journeys">Case journey</button>' : '')
        + ORDER.map(function (c) { return '<button type="button" data-jump="pl-src-' + c + '">' + esc(SYSTEMS[c].short) + '</button>'; }).join('')
        + '<button type="button" data-jump="pl-timeline">Timeline</button></nav>';

      var unavailable = p.summary && p.summary.unavailable
        ? '<div class="pl-alert pl-alert--warning">' + svg('alert') + '<div><b>' + plural(p.summary.unavailable, 'system') + ' did not answer</b><span>What is shown is incomplete. Try again to ask every system once more.</span></div><button type="button" class="btn btn-sm" data-reload>' + svg('retry') + 'Try again</button></div>'
        : '';

      result.innerHTML = '<div class="pl-profile">' + head + unavailable + (alerts ? '<div class="pl-alerts">' + alerts + '</div>' : '') + jump + journeys + sections + timeline
        + '</div>';

      // steppers
      (p.journeys || []).forEach(function (j, i) {
        var host = result.querySelector('[data-journey="' + i + '"]');
        if (!host || !root.WorkflowProgressCard) return;
        host.appendChild(root.WorkflowProgressCard.create({
          eyebrow: j.policeStation + ' · ' + cap(j.role),
          title: j.title + ': ' + j.offence,
          statusLabel: j.statusLabel,
          steps: j.steps,
        }));
      });
      Array.prototype.forEach.call(result.querySelectorAll('.pl-stepper'), function (host) {
        var prog;
        try { prog = JSON.parse(host.getAttribute('data-progress')); } catch (e) { return; }
        host.removeAttribute('data-progress');
        host.appendChild(root.WorkflowProgressCard.create({
          // the record above already names the workflow and its status
          flat: true, compact: true, steps: prog.steps,
        }));
      });
      printBtn.hidden = false;
      announce('Profile of ' + s.name + ' loaded. ' + plural(p.summary.found, 'system') + ' hold records, ' + plural(p.summary.records, 'record') + ' in all.');
      var top = result.querySelector('.pl-id');
      if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }

    function emptyBlock(icon, title, hint) {
      return '<div class="pl-empty"><span class="pl-empty-ic">' + svg(icon) + '</span><b>' + esc(title) + '</b><span>' + esc(hint) + '</span></div>';
    }

    function sourceSection(src, ctx) {
      var tone = { found: 'ok', none: 'neutral', unavailable: 'warn', error: 'danger' }[src.status] || 'neutral';
      var label = { found: plural(src.count, 'record'), none: 'No records', unavailable: 'Unavailable', error: 'Error' }[src.status];
      var body;
      if (src.status === 'found') {
        body = src.records.map(function (r) {
          var draw = RECORD[r.type];
          try { return draw ? draw(r, ctx) : recordShell(r, r.type, mono(r.ref), '<p class="pl-muted">This kind of record cannot be shown yet.</p>'); }
          catch (e) { return recordShell(r, 'Record ' + r.ref, '', '<p class="pl-warn-text">This record could not be displayed: some of its fields are missing.</p>'); }
        }).join('');
      } else if (src.status === 'none') {
        body = emptyBlock('nothing', src.empty.title, src.empty.hint);
      } else {
        body = '<div class="pl-empty pl-empty--warn"><span class="pl-empty-ic">' + svg('alert') + '</span><b>' + esc(src.name) + (src.status === 'error' ? ' could not be read' : ' is unavailable') + '</b>'
          + '<span>' + esc(src.message || 'The system did not answer.') + '</span><button type="button" class="btn btn-sm" data-reload>' + svg('retry') + 'Try again</button></div>';
      }
      return '<section class="pl-section pl-src pl-card" id="pl-src-' + esc(src.code) + '">'
        + '<header class="pl-src-head"><span class="pl-sys-ic pl-sys-ic--lg pl-sys--' + esc(src.code) + '">' + svg(src.code) + '</span>'
        + '<div class="pl-src-t"><h3>' + esc(src.name) + '</h3><p>' + esc(src.department) + ' · <span class="pl-mono">' + esc(src.hostname) + '</span></p></div>'
        + '<div class="pl-src-side">' + chip(label, tone) + '<span class="pl-muted pl-src-time" title="Answered in ' + esc(src.ms) + ' ms">' + svg('clock', 'pl-ic pl-ic--xs') + esc(fmtClock(src.retrievedAt)) + '</span></div></header>'
        + '<div class="pl-src-body">' + body + '</div>'
        + '</section>';
    }

    // ---------------- events
    form.addEventListener('submit', function (e) { e.preventDefault(); runSearch(input.value); });
    input.addEventListener('input', function () {
      var v = input.value;
      clearBtn.hidden = !v;
      var p = preview(v);
      if (!p) { detect.textContent = ''; detect.className = 'pl-detect'; }
      else {
        detect.textContent = p.label;
        detect.className = 'pl-detect ' + (p.ok === true ? 'is-ok' : p.ok === false ? 'is-bad' : '');
      }
      if (!err.hidden) showError('');
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && input.value) { e.preventDefault(); e.stopPropagation(); input.value = ''; input.dispatchEvent(new Event('input')); }
    });
    clearBtn.addEventListener('click', function () {
      input.value = ''; input.dispatchEvent(new Event('input')); input.focus();
    });
    container.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target : null;
      if (!t) return;
      var sample = t.closest('[data-sample]');
      if (sample) {
        input.value = sample.getAttribute('data-sample');
        input.dispatchEvent(new Event('input'));
        runSearch(input.value);
        return;
      }
      if (t.closest('[data-people-more]')) { loadMorePeople(); return; }
      var tog = t.closest('[data-live-toggle]');
      if (tog) { var gk = tog.getAttribute('data-live-toggle'); liveOpen[gk] = !liveOpen[gk]; drawLive(false); return; }
      var open = t.closest('[data-open-ref]');
      if (open) { openRef(open.getAttribute('data-open-ref')); return; }
      var reveal = t.closest('[data-reveal-aadhaar]');
      if (reveal) { toggleAadhaar(reveal); return; }
      var jump = t.closest('[data-jump]');
      if (jump) {
        var el = container.querySelector('#' + jump.getAttribute('data-jump'));
        if (el) {
          var details = el.closest('details');
          if (details) details.open = true;
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (el.classList.contains('pl-rec')) {
            el.classList.remove('is-flash'); void el.offsetWidth; el.classList.add('is-flash');
          }
          // keyboard and screen-reader users land where they asked to go
          if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
          el.focus({ preventScroll: true });
        }
        return;
      }
      if (t.closest('[data-retry]')) { if (typeof result._retry === 'function') result._retry(); return; }
      if (t.closest('[data-reload]')) { if (current && current.kind === 'ref') openRef(current.value, true); else if (current) runSearch(current.value, true); return; }
      if (t.closest('[data-print]')) { printProfile(); return; }
      if (t.closest('[data-focus-search]')) { input.focus(); input.select(); return; }
      var more = t.closest('[data-tl-more]');
      if (more) {
        var showAll = more.getAttribute('aria-expanded') !== 'true';
        Array.prototype.forEach.call(container.querySelectorAll('.pl-tl-item.is-extra'), function (li) { li.hidden = !showAll; });
        more.setAttribute('aria-expanded', String(showAll));
        more.textContent = showAll ? 'Show fewer events' : 'Show all ' + container.querySelectorAll('.pl-tl-item').length + ' events';
      }
    });

    function printProfile() {
      var closed = Array.prototype.filter.call(result.querySelectorAll('details'), function (d) { return !d.open; });
      var hiddenTl = Array.prototype.filter.call(result.querySelectorAll('.pl-tl-item.is-extra'), function (li) { return li.hidden; });
      closed.forEach(function (d) { d.open = true; });
      hiddenTl.forEach(function (li) { li.hidden = false; });
      var restore = function () {
        closed.forEach(function (d) { d.open = false; });
        hiddenTl.forEach(function (li) { li.hidden = true; });
        root.removeEventListener('afterprint', restore);
      };
      root.addEventListener('afterprint', restore);
      root.print();
    }

    /** Back to the start: an empty search box and the live department panes. */
    function showIdle() {
      current = null;
      input.value = '';
      input.dispatchEvent(new Event('input'));
      showError('');
      printBtn.hidden = true;
      renderIdle();
    }

    /**
     * Draw whatever the address asks for: a person (?ref=), a search (?q=), or
     * - with neither, which is also the case when the page embedding this module
     * has navigated back to it - the idle panes. The back button and the host
     * page both come through here, so one person can never be left on screen
     * after the thing that put them there is gone.
     */
    function applyUrl() {
      var st = readUrl();
      if (!st) return showIdle();
      if (st.kind === 'ref') return openRef(st.value, true);
      input.value = st.value;
      input.dispatchEvent(new Event('input'));
      runSearch(st.value, true);
    }

    if (urlState) root.addEventListener('popstate', applyUrl);

    // ---------------- start
    startLive();
    applyUrl();

    return {
      search: function (q) { input.value = q; input.dispatchEvent(new Event('input')); runSearch(q); },
      open: function (ref) { openRef(ref); },
      focus: function () { input.focus(); },
      reset: showIdle,       // show the idle panes, whatever the address says
      applyUrl: applyUrl,    // match the address (the host page calls this when it returns to the lookup)
    };
  }

  root.PersonLookup = { mount: mount, preview: preview };
})(typeof window !== 'undefined' ? window : this);
