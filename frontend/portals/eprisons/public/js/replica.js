/* Local demonstration replica - client behaviour.
   No request from this file ever leaves the local server. */
(function () {
  'use strict';

  // --- responsive navigation ---------------------------------------------
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // --- dropdown menus -----------------------------------------------------
  Array.prototype.forEach.call(document.querySelectorAll('.has-children'), function (item) {
    var btn = item.querySelector('.primary-nav__link');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', function (e) {
    Array.prototype.forEach.call(document.querySelectorAll('.has-children.open'), function (item) {
      if (!item.contains(e.target)) {
        item.classList.remove('open');
        var b = item.querySelector('.primary-nav__link');
        if (b) b.setAttribute('aria-expanded', 'false');
      }
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    Array.prototype.forEach.call(document.querySelectorAll('.has-children.open'), function (item) {
      item.classList.remove('open');
    });
  });

  // --- dependent State -> Jail dropdown -----------------------------------
  // The original cascades these through an ASP.NET postback
  // (__doPostBack on ddlState). The replica does the same thing with a local
  // fetch, so the behaviour matches without the WebForms machinery.
  Array.prototype.forEach.call(document.querySelectorAll('[data-cascade-source]'), function (stateSel) {
    var targetId = stateSel.getAttribute('data-cascade-target');
    var jailSel = document.getElementById(targetId);
    if (!jailSel) return;

    var preselect = jailSel.getAttribute('data-selected') || '';

    function load(stateId, keep) {
      if (!stateId) {
        jailSel.innerHTML = '<option value="">SELECT</option>';
        jailSel.disabled = true;
        return;
      }
      jailSel.disabled = true;
      jailSel.innerHTML = '<option value="">Loading…</option>';
      fetch('/api/jails?state_id=' + encodeURIComponent(stateId), {
        headers: { 'Accept': 'application/json' }
      })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (data) {
          var html = '<option value="">SELECT</option>';
          (data.jails || []).forEach(function (j) {
            var sel = keep && String(keep) === String(j.id) ? ' selected' : '';
            html += '<option value="' + j.id + '"' + sel + '>' +
              String(j.name).replace(/[<>&]/g, '') + '</option>';
          });
          jailSel.innerHTML = html;
          jailSel.disabled = false;
        })
        .catch(function () {
          jailSel.innerHTML = '<option value="">Could not load the jail list</option>';
          jailSel.disabled = false;
        });
    }

    stateSel.addEventListener('change', function () { load(stateSel.value, null); });
    if (stateSel.value) load(stateSel.value, preselect);
    else { jailSel.disabled = true; }
  });

  // --- conditional ID number ----------------------------------------------
  // The live form's ID Proof list contains "NOT AVAILABLE", so the ID number
  // cannot always be required.
  var idProof = document.querySelector('[data-idproof]');
  var idNumber = document.getElementById('id_number');
  if (idProof && idNumber) {
    var hint = document.getElementById('id_number_hint');
    function syncIdNumber() {
      var opt = idProof.options[idProof.selectedIndex];
      var requires = opt && opt.getAttribute('data-requires-number') === '1';
      idNumber.disabled = !idProof.value;
      if (!requires) {
        idNumber.removeAttribute('required');
        if (hint) hint.textContent = opt && idProof.value
          ? 'Not required for the selected identity proof.'
          : 'Choose an identity proof first.';
      } else {
        idNumber.setAttribute('required', 'required');
        if (hint) hint.textContent = 'Required for the selected identity proof. Maximum 20 characters.';
      }
    }
    idProof.addEventListener('change', syncIdNumber);
    syncIdNumber();
  }

  // --- additional visitor names ------------------------------------------
  var addCount = document.getElementById('additional_visitor_count');
  var addNames = document.getElementById('additional_visitor_names');
  if (addCount && addNames) {
    function syncAdd() {
      var n = Number(addCount.value || 0);
      addNames.disabled = !n;
      addNames.placeholder = 'Enter additional visitors name with comma(,) separated';   // the original's watermark
    }
    addCount.addEventListener('change', syncAdd);
    addCount.addEventListener('input', syncAdd);
    syncAdd();
  }

  // --- live character counters -------------------------------------------
  Array.prototype.forEach.call(document.querySelectorAll('[data-counter]'), function (input) {
    var max = Number(input.getAttribute('maxlength'));
    if (!max) return;
    var out = document.getElementById(input.id + '_count');
    if (!out) return;
    function upd() { out.textContent = input.value.length + ' / ' + max; }
    input.addEventListener('input', upd);
    upd();
  });
})();
