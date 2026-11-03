/* Shared client behaviour for generated local demonstration replicas.
   No request from this file leaves the local server. */
(function () {
  'use strict';

  // Text size in the "More" menu: scales the whole page, remembered in this browser only.
  var sizeButtons = document.querySelectorAll('[data-text-size]');
  if (sizeButtons.length) {
    var KEY = 'uidai_text_size';
    var applySize = function (size) {
      if (size === 'normal') document.documentElement.removeAttribute('data-text');
      else document.documentElement.setAttribute('data-text', size);
      Array.prototype.forEach.call(sizeButtons, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-text-size') === size ? 'true' : 'false'); });
    };
    var savedSize = null;
    try { savedSize = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
    if (savedSize === 'small' || savedSize === 'large') applySize(savedSize);
    Array.prototype.forEach.call(sizeButtons, function (b) {
      b.addEventListener('click', function () {
        var size = b.getAttribute('data-text-size');
        applySize(size);
        try { localStorage.setItem(KEY, size); } catch (e) { /* ignore */ }
      });
    });
  }

  // Header menus (language, More): close on Esc or on a click elsewhere.
  var menus = document.querySelectorAll('details.tb-item');
  if (menus.length) {
    document.addEventListener('click', function (e) {
      Array.prototype.forEach.call(menus, function (d) { if (d.open && !d.contains(e.target)) d.open = false; });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      Array.prototype.forEach.call(menus, function (d) { if (d.open) { d.open = false; var sm = d.querySelector('summary'); if (sm) sm.focus(); } });
    });
  }

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
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
