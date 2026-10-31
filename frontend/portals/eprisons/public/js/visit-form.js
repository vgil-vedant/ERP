/* eMulakat visit form: the "Refresh" button next to the verification question.
   It asks the local server for a new arithmetic question (this replica's stand-in for the
   original's CAPTCHA image), swaps it in, and clears the answer box. Nothing leaves this machine. */
(function () {
  'use strict';
  var btn = document.getElementById('challenge_refresh');
  var q = document.getElementById('challenge_q');
  var expected = document.getElementById('challenge_expected');
  var answer = document.getElementById('challenge_answer');
  if (!btn || !q || !expected) return;

  btn.addEventListener('click', function () {
    btn.disabled = true;
    fetch('/api/challenge', { headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (c) {
        q.textContent = c.question;
        expected.value = c.expected;
        if (answer) { answer.value = ''; answer.focus(); }
      })
      .catch(function () { /* keep the current question if the server did not answer */ })
      .then(function () { btn.disabled = false; });
  });
})();
