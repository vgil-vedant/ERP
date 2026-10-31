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
