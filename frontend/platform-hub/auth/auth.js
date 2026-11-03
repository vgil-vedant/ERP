/* Sign-in and registration pages. Plain script, no libraries, nothing fetched.
   Loaded in <head> so the saved theme is applied before the first paint. */
(function () {
  'use strict';
  var KEY = 'erp_auth_theme', root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
  var dark = saved ? saved === 'dark'
    : !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.setAttribute('data-theme', dark ? 'dark' : 'light');

  document.addEventListener('DOMContentLoaded', function () {
    // theme toggle
    var tb = document.getElementById('lgTheme');
    if (tb) {
      var sync = function () { tb.setAttribute('aria-pressed', root.getAttribute('data-theme') === 'dark' ? 'true' : 'false'); };
      sync();
      tb.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem(KEY, next); } catch (e) { /* ignore */ }
        sync();
      });
    }

    // show / hide password
    Array.prototype.forEach.call(document.querySelectorAll('[data-toggle-pw]'), function (b) {
      b.addEventListener('click', function () {
        var input = document.getElementById(b.getAttribute('data-toggle-pw'));
        if (!input) return;
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        b.setAttribute('aria-pressed', show ? 'true' : 'false');
        b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      });
    });

    // empty-field messages only after a submit attempt; the server still validates everything
    var form = document.querySelector('form[data-auth]');
    if (form) {
      var setErr = function (input, msg) {
        var wrap = input.closest('.lg-field'), p = document.getElementById(input.id + '-err');
        if (wrap) wrap.classList.toggle('is-bad', !!msg);
        input.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (p) p.textContent = msg || '';
      };
      form.addEventListener('input', function (e) { if (e.target.value) setErr(e.target, ''); });
      form.addEventListener('submit', function (e) {
        var first = null;
        Array.prototype.forEach.call(form.querySelectorAll('input[data-required]'), function (input) {
          var p = document.getElementById(input.id + '-err');
          if (!input.value.trim()) {
            setErr(input, (p && p.getAttribute('data-msg')) || 'This field is required.');
            if (!first) first = input;
          }
        });
        if (first) { e.preventDefault(); first.focus(); return; }
        var btn = form.querySelector('.lg-btn-primary'), lbl = btn && btn.querySelector('.lg-lbl');
        if (btn && lbl) {
          lbl.setAttribute('data-idle', lbl.textContent);
          lbl.textContent = lbl.getAttribute('data-busy') || lbl.textContent;
          setTimeout(function () { btn.classList.add('is-busy'); btn.setAttribute('aria-disabled', 'true'); }, 0);
        }
      });
      window.addEventListener('pageshow', function (e) {   // back button: undo the busy state
        if (!e.persisted) return;
        var btn = form.querySelector('.lg-btn-primary'), lbl = btn && btn.querySelector('.lg-lbl');
        if (btn) { btn.classList.remove('is-busy'); btn.removeAttribute('aria-disabled'); }
        if (lbl && lbl.getAttribute('data-idle')) lbl.textContent = lbl.getAttribute('data-idle');
      });
    }


    // highlights carousel
    var car = document.getElementById('lgCarousel');
    if (car) {
      var slides = car.querySelectorAll('.lg-slide'), dots = car.querySelectorAll('.lg-dots button');
      var i = 0, timer = null;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var show = function (n) {
        i = (n + slides.length) % slides.length;
        Array.prototype.forEach.call(slides, function (s, k) { s.classList.toggle('is-active', k === i); });
        Array.prototype.forEach.call(dots, function (d, k) {
          d.classList.toggle('is-active', k === i); d.setAttribute('aria-selected', k === i ? 'true' : 'false');
        });
      };
      var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
      // with "reduce motion" on, the slides still change (no fade, because CSS removes it) but more slowly; hover or focus pauses them
      var start = function () { if (!timer) timer = setInterval(function () { show(i + 1); }, reduce ? 8000 : 5000); };
      Array.prototype.forEach.call(dots, function (d, k) { d.addEventListener('click', function () { show(k); }); });
      ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) { car.addEventListener(ev, stop, { passive: true }); });
      ['mouseleave', 'focusout', 'touchend'].forEach(function (ev) { car.addEventListener(ev, start, { passive: true }); });
      car.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') show(i + 1); else if (e.key === 'ArrowLeft') show(i - 1);
      });
      var x0 = null;
      car.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      car.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0; x0 = null;
        if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1));
      }, { passive: true });
      start();
    }

    // portal chips: centre them only when they wrap onto a second line
    var pt = document.querySelector('.lg-portals-top'), chips = pt ? pt.querySelectorAll('.portals a') : [];
    if (pt && chips.length > 1) {
      var checkWrap = function () {
        var top = chips[0].offsetTop, wrapped = false;
        for (var k = 1; k < chips.length; k++) { if (chips[k].offsetTop !== top) { wrapped = true; break; } }
        pt.classList.toggle('is-wrapped', wrapped);
      };
      checkWrap();
      window.addEventListener('resize', checkWrap);
      window.addEventListener('load', checkWrap);
    }

    // the red demonstration notice can be dismissed for this page view; it is back on the next load
    Array.prototype.forEach.call(document.querySelectorAll('[data-dismiss-notice]'), function (b) {
      b.addEventListener('click', function () {
        var n = b.closest('.lg-notice, .ac-notice');
        if (n) n.hidden = true;
      });
    });
  });
})();
