/* Shared client behaviour for generated local demonstration replicas.
   No request from this file leaves the local server. */
(function () {
  'use strict';

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // "More" menu in the primary navigation: a disclosure that closes on Esc or on a click elsewhere.
  var moreBtn = document.querySelector('.primary-nav__toggle');
  var moreList = document.getElementById('nav-more');
  if (moreBtn && moreList) {
    var setMore = function (open) { moreList.hidden = !open; moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
    moreBtn.addEventListener('click', function () { setMore(moreList.hidden); });
    document.addEventListener('click', function (e) { if (!moreList.hidden && !moreList.contains(e.target) && !moreBtn.contains(e.target)) setMore(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !moreList.hidden) { setMore(false); moreBtn.focus(); } });
  }

  // Text size controls in the utility bar: scale the whole page, remembered in this browser only.
  var sizeButtons = document.querySelectorAll('[data-text-size]');
  if (sizeButtons.length) {
    var KEY = 'ecourts_text_size';
    var apply = function (size) {
      if (size === 'normal') document.documentElement.removeAttribute('data-text');
      else document.documentElement.setAttribute('data-text', size);
      Array.prototype.forEach.call(sizeButtons, function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-text-size') === size ? 'true' : 'false');
      });
    };
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
    if (saved === 'small' || saved === 'large') apply(saved);
    Array.prototype.forEach.call(sizeButtons, function (b) {
      b.addEventListener('click', function () {
        var size = b.getAttribute('data-text-size');
        apply(size);
        try { localStorage.setItem(KEY, size); } catch (e) { /* ignore */ }
      });
    });
  }

  // Hero carousel (home pages): previous / next, dots, pause. It pauses while hovered or focused, and does not start by
  // itself when the visitor prefers reduced motion.
  var hero = document.getElementById('heroViewport');
  if (hero) {
    var slides = hero.querySelectorAll('.hero__slide');
    var dots = hero.querySelectorAll('[data-hero-dot]');
    var pauseBtn = hero.querySelector('[data-hero="pause"]');
    var index = 0, timer = null, userPaused = false, hovering = false;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var show = function (n) {
      index = (n + slides.length) % slides.length;
      Array.prototype.forEach.call(slides, function (s, k) { s.classList.toggle('is-active', k === index); });
      Array.prototype.forEach.call(dots, function (d, k) {
        if (k === index) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    var start = function () {
      if (timer || userPaused || hovering || reduce) return;
      timer = setInterval(function () { show(index + 1); }, 6000);
    };
    var setPaused = function (p) {
      userPaused = p;
      if (pauseBtn) {
        pauseBtn.setAttribute('aria-pressed', p ? 'true' : 'false');
        pauseBtn.setAttribute('aria-label', p ? 'Resume slideshow' : 'Pause slideshow');
      }
      if (p) stop(); else start();
    };
    hero.querySelector('[data-hero="prev"]').addEventListener('click', function () { show(index - 1); });
    hero.querySelector('[data-hero="next"]').addEventListener('click', function () { show(index + 1); });
    Array.prototype.forEach.call(dots, function (d, k) { d.addEventListener('click', function () { show(k); }); });
    if (pauseBtn) pauseBtn.addEventListener('click', function () { setPaused(!userPaused); });
    hero.addEventListener('mouseenter', function () { hovering = true; stop(); });
    hero.addEventListener('mouseleave', function () { hovering = false; start(); });
    hero.addEventListener('focusin', stop);
    hero.addEventListener('focusout', start);
    hero.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(index - 1); else if (e.key === 'ArrowRight') show(index + 1);
    });
    if (reduce) setPaused(true); else start();
  }

  // Dependent dropdowns. The generator marks a select with
  // data-cascade-target when the original reloaded a child list on change.
  Array.prototype.forEach.call(document.querySelectorAll('[data-cascade-source]'), function (src) {
    var target = document.getElementById(src.getAttribute('data-cascade-target'));
    if (!target) return;
    var endpoint = src.getAttribute('data-cascade-endpoint');
    var keep = target.getAttribute('data-selected') || '';

    function load(value, preselect) {
      if (!value) {
        target.innerHTML = '<option value="">SELECT</option>';
        target.disabled = true;
        return;
      }
      target.disabled = true;
      target.innerHTML = '<option value="">Loading…</option>';
      fetch(endpoint + encodeURIComponent(value), { headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (data) {
          var html = '<option value="">SELECT</option>';
          (data.options || []).forEach(function (o) {
            var sel = preselect && String(preselect) === String(o.value) ? ' selected' : '';
            html += '<option value="' + o.value + '"' + sel + '>' +
              String(o.label).replace(/[<>&]/g, '') + '</option>';
          });
          target.innerHTML = html;
          target.disabled = false;
        })
        .catch(function () {
          target.innerHTML = '<option value="">Could not load the list</option>';
          target.disabled = false;
        });
    }
    src.addEventListener('change', function () { load(src.value, null); });
    if (src.value) load(src.value, keep); else target.disabled = true;
  });

  // Live character counters on length-limited fields.
  Array.prototype.forEach.call(document.querySelectorAll('[data-counter]'), function (input) {
    var max = Number(input.getAttribute('maxlength'));
    var out = document.getElementById(input.id + '_count');
    if (!max || !out) return;
    function upd() { out.textContent = input.value.length + ' / ' + max; }
    input.addEventListener('input', upd);
    upd();
  });
})();
