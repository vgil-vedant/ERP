/* ==========================================================================
   WorkflowProgressCard: a reusable horizontal stepper.

     const el = WorkflowProgressCard.create({
       eyebrow: 'e-Forensics',               // optional small heading
       title: 'Forensic examination',
       subtitle: 'RFSL-PUN/DNA/2025/0412',    // optional
       steps: [                               // any number of steps
         { title: 'Dispatched', description: '...', state: 'completed', label: 'Completed', date: '2025-10-02' },
         { title: 'Examination', state: 'active' },
         { title: 'Report ready' },
       ],
       current: 1,                            // optional: derive states from one index
       statusLabel: 'Examination: In Progress',
       flat: false, compact: false,           // flat drops the card chrome
       showDetail: true,                      // footer explaining the step in focus
     });
     container.appendChild(el);

   A step's state is one of completed, active, pending, blocked, failed or
   skipped. Steps without a state take it from `current`: earlier steps are
   completed, that one is active and later ones are pending.

   Keyboard: Tab reaches the current step; Left/Right, Home and End move
   between steps; the footer reads out what the focused step means.
   ========================================================================== */
(function (root) {
  'use strict';

  var LABEL = {
    completed: 'Completed', active: 'In Progress', pending: 'Pending',
    blocked: 'Blocked', failed: 'Failed', skipped: 'Not applicable',
  };
  var STATES = Object.keys(LABEL);
  var ICON = {
    completed: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3.5 8.4 2.9 2.9 6.1-6.3"/></svg>',
    blocked: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M8 4v5"/><path d="M8 11.8v.2"/></svg>',
    failed: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="m4.5 4.5 7 7m0-7-7 7"/></svg>',
    skipped: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 8h6"/></svg>',
  };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var uid = 0;

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtDate(v) {
    if (!v) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
    return m ? (Number(m[3]) + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1]) : String(v);
  }
  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  /** Steps with a state each, taken from the step itself or from `current`. */
  function normalise(steps, current) {
    var cur = typeof current === 'number' ? current : -1;
    return (steps || []).map(function (s, i) {
      var st = STATES.indexOf(s.state) >= 0 ? s.state
        : cur < 0 ? 'pending' : i < cur ? 'completed' : i === cur ? 'active' : 'pending';
      return {
        title: s.title || ('Step ' + (i + 1)), description: s.description || '',
        // icon: only a name from the built-in set, so markup never travels in step data
        state: st, label: s.label || LABEL[st], date: s.date || null, icon: ICON[s.icon] ? s.icon : null,
      };
    });
  }

  function overall(steps) {
    for (var i = 0; i < steps.length; i += 1) {
      if (steps[i].state === 'failed') return 'failed';
      if (steps[i].state === 'blocked') return 'blocked';
    }
    for (var j = 0; j < steps.length; j += 1) if (steps[j].state === 'active') return 'active';
    var open = steps.some(function (s) { return s.state === 'pending'; });
    return open ? 'active' : 'completed';
  }

  /** The class of the connector into step i: the transition into that step. */
  function segment(steps, i) {
    var s = steps[i].state;
    if (s === 'completed') return 'seg-done';
    if (s === 'active') return 'seg-active';
    if (s === 'blocked') return 'seg-blocked';
    if (s === 'failed') return 'seg-failed';
    if (s === 'skipped') return 'seg-skip';
    return 'seg-idle';
  }

  function nodeHTML(s, i) {
    if (s.icon) return ICON[s.icon];
    if (ICON[s.state]) return ICON[s.state];
    if (s.state === 'active') return '';
    return '<span aria-hidden="true">' + (i + 1) + '</span>';
  }

  function create(opts) {
    opts = opts || {};
    var steps = normalise(opts.steps, opts.current);
    var n = steps.length;
    var id = 'wpc' + (++uid);
    var tone = overall(steps);
    var focusIdx = steps.findIndex(function (s) { return s.state === 'active' || s.state === 'blocked' || s.state === 'failed'; });
    if (focusIdx < 0) { focusIdx = -1; for (var k = n - 1; k >= 0; k -= 1) { if (steps[k].state === 'completed') { focusIdx = k; break; } } }
    if (focusIdx < 0) focusIdx = 0;
    var done = steps.filter(function (s) { return s.state === 'completed'; }).length;
    var counted = steps.filter(function (s) { return s.state !== 'skipped'; }).length;

    var el = document.createElement('section');
    el.className = 'wpc' + (opts.flat ? ' wpc--flat' : '') + (opts.compact ? ' wpc--compact' : '') + (opts.className ? ' ' + String(opts.className).replace(/[^\w -]/g, '') : '');
    el.setAttribute('aria-labelledby', id + '-t');

    var head = '';
    if (opts.title || opts.eyebrow || opts.statusLabel) {
      head = '<div class="wpc-head"><div class="wpc-head-main">'
        + (opts.eyebrow ? '<div class="wpc-eyebrow">' + esc(opts.eyebrow) + '</div>' : '')
        + '<h3 class="wpc-title" id="' + id + '-t">' + esc(opts.title || 'Progress') + '</h3>'
        + (opts.subtitle ? '<div class="wpc-sub">' + esc(opts.subtitle) + '</div>' : '')
        + '</div><div class="wpc-head-side">'
        + (opts.statusLabel ? '<span class="wpc-badge wpc-badge--' + tone + '">' + esc(opts.statusLabel) + '</span>' : '')
        + (opts.hideCount ? '' : '<span class="wpc-count">' + done + ' of ' + counted + ' complete' + (steps[focusIdx] && steps[focusIdx].state !== 'completed' ? ' · now: ' + esc(steps[focusIdx].title) : '') + '</span>')
        + '</div></div>';
    } else {
      head = '<h3 class="wpc-title" id="' + id + '-t" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Progress</h3>';
    }

    var showDetail = opts.showDetail !== false && steps.some(function (s) { return s.description; });
    var items = steps.map(function (s, i) {
      var label = 'Step ' + (i + 1) + ' of ' + n + ': ' + s.title + '. ' + s.label + (s.date ? ', ' + fmtDate(s.date) : '') + '.';
      // seg-* colours the connector into this step (horizontal); out-* the one leaving it (vertical, on phones)
      return '<li class="wpc-step is-' + s.state + (i > 0 ? ' ' + segment(steps, i) : '') + (i < n - 1 ? ' out-' + segment(steps, i + 1).slice(4) : '') + '"'
        + ' data-i="' + i + '" tabindex="' + (i === focusIdx ? '0' : '-1') + '"'
        + (i === focusIdx && s.state !== 'completed' ? ' aria-current="step"' : '')
        + ' aria-label="' + esc(label) + '"' + (!showDetail && s.description ? ' title="' + esc(s.description) + '"' : '') + '>'
        + '<span class="wpc-node">' + nodeHTML(s, i) + '</span>'
        + '<span class="wpc-id" aria-hidden="true">Step ' + pad2(i + 1) + '</span>'
        + '<span class="wpc-step-title" aria-hidden="true">' + esc(s.title) + '</span>'
        + '<span class="wpc-status" aria-hidden="true">' + esc(s.label) + '</span>'
        + (s.date ? '<span class="wpc-date" aria-hidden="true">' + esc(fmtDate(s.date)) + '</span>' : '')
        + (i === focusIdx && (s.state === 'active' || s.state === 'blocked' || s.state === 'failed') ? '<span class="wpc-now" aria-hidden="true">' + (s.state === 'active' ? 'Current step' : s.state === 'blocked' ? 'Stuck here' : 'Stopped here') + '</span>' : '')
        + '</li>';
    }).join('');

    el.innerHTML = head
      + '<div class="wpc-scroll" role="group" aria-label="' + esc((opts.title || 'Progress') + ', ' + n + ' steps') + '">'
      + '<ol class="wpc-track" style="--wpc-n:' + n + '">' + items + '</ol></div>'
      // not live: the focused step's own label is what a screen reader reads; this footer is for the eye
      + (showDetail ? '<div class="wpc-detail" aria-hidden="true"></div>' : '');

    var list = el.querySelectorAll('.wpc-step');
    var detail = el.querySelector('.wpc-detail');
    var scroller = el.querySelector('.wpc-scroll');

    function describe(i) {
      if (!detail) return;
      var s = steps[i];
      detail.innerHTML = '<b>' + esc(s.title) + ' · ' + esc(s.label) + '</b><span>' + esc(s.description || '') + '</span>';
    }
    function focusStep(i) {
      if (i < 0 || i >= n) return;
      for (var j = 0; j < list.length; j += 1) list[j].setAttribute('tabindex', j === i ? '0' : '-1');
      list[i].focus({ preventScroll: true });
      reveal(i, true);
      describe(i);
    }
    /** Bring a step into the scroller's view without scrolling the page. */
    function reveal(i, smooth) {
      var li = list[i];
      if (!li || scroller.scrollWidth <= scroller.clientWidth + 1) return;
      var target = li.offsetLeft - (scroller.clientWidth - li.offsetWidth) / 2;
      var max = scroller.scrollWidth - scroller.clientWidth;
      var left = Math.max(0, Math.min(max, target));
      if (smooth && typeof scroller.scrollTo === 'function') scroller.scrollTo({ left: left, behavior: 'smooth' });
      else scroller.scrollLeft = left;
    }

    el.addEventListener('keydown', function (e) {
      var li = e.target.closest && e.target.closest('.wpc-step');
      if (!li) return;
      var i = Number(li.getAttribute('data-i'));
      var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: n - 1 }[e.key];
      if (next == null) return;
      e.preventDefault();
      focusStep(Math.max(0, Math.min(n - 1, next)));
    });
    for (var j = 0; j < list.length; j += 1) {
      (function (i) {
        list[i].addEventListener('mouseenter', function () { describe(i); });
        list[i].addEventListener('focus', function () { describe(i); });
      })(j);
    }
    el.addEventListener('mouseleave', function () {
      if (!el.contains(document.activeElement)) describe(focusIdx);
    });
    el.addEventListener('focusout', function (e) {
      if (!el.contains(e.relatedTarget)) describe(focusIdx);
    });

    if (n) describe(focusIdx);
    // once laid out, centre the current step if the track is wider than the card
    var raf = root.requestAnimationFrame || function (f) { return setTimeout(f, 16); };
    raf(function () { reveal(focusIdx, false); });
    return el;
  }

  root.WorkflowProgressCard = { create: create, normalise: normalise, LABEL: LABEL };
})(typeof window !== 'undefined' ? window : this);
