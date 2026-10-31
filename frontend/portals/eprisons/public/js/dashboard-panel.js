/* DashBoard: the small square in the title bar hides and shows the filter panel.
   The slide itself is a CSS transition on .dash.is-collapsed; this only flips the class
   and keeps the button's label and aria-expanded in step. */
(function () {
  'use strict';
  var dash = document.querySelector('.dash');
  var btn = document.querySelector('.dash__bar-mark');
  var panel = document.getElementById('dash-filter');
  if (!dash || !btn) return;

  function set(collapsed) {
    dash.classList.toggle('is-collapsed', collapsed);
    var label = collapsed ? 'Show filter panel' : 'Hide filter panel';
    btn.setAttribute('aria-expanded', String(!collapsed));
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    if (panel) panel.setAttribute('aria-hidden', String(collapsed));
  }

  btn.addEventListener('click', function () { set(!dash.classList.contains('is-collapsed')); });
})();
