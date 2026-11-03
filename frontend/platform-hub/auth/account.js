/* My account page: menu drawer on small screens, and Overview / My submissions switching in place.
   Without this script both sections simply show one under the other. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var shell = document.getElementById('acShell');
    if (!shell) return;
    shell.classList.add('js');

    var views = { overview: document.getElementById('view-overview'), info: document.getElementById('view-info'), submissions: document.getElementById('view-submissions') };
    var items = document.querySelectorAll('.ac-item[data-view], .ac-profile[data-view]'), links = document.querySelectorAll('a[data-view]');
    var head = document.getElementById('acHeading'), sub = document.getElementById('acSub');

    function show(name) {
      if (!views[name]) name = 'overview';
      Object.keys(views).forEach(function (k) { views[k].hidden = k !== name; });
      Array.prototype.forEach.call(items, function (a) {
        var on = a.getAttribute('data-view') === name;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
      var v = views[name];
      if (head) head.textContent = v.getAttribute('data-title') || 'My account';
      if (sub) sub.textContent = v.getAttribute('data-sub') || '';
    }
    Array.prototype.forEach.call(links, function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var name = a.getAttribute('data-view');
        try { history.replaceState(null, '', '#' + name); } catch (x) { /* ignore */ }
        show(name); closeMenu();
      });
    });
    show((location.hash || '').replace('#', ''));
    window.addEventListener('hashchange', function () { show((location.hash || '').replace('#', '')); });

    // drawer
    var menu = document.getElementById('acMenu'), closeBtn = document.getElementById('acClose'), scrim = document.getElementById('acScrim');
    function openMenu() { shell.classList.add('menu-open'); if (menu) menu.setAttribute('aria-expanded', 'true'); }
    function closeMenu() { shell.classList.remove('menu-open'); if (menu) menu.setAttribute('aria-expanded', 'false'); }
    if (menu) menu.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (scrim) scrim.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

    // website switcher: the brand block opens a list of the five websites
    var sw = document.getElementById('acSwitch'), swMenu = document.getElementById('acSwitchMenu');
    if (sw && swMenu) {
      var swItems = swMenu.querySelectorAll('[data-port-link]');
      var setOpen = function (open, focusFirst) {
        swMenu.hidden = !open;
        sw.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open && focusFirst && swItems.length) swItems[0].focus();
      };
      sw.addEventListener('click', function () { setOpen(swMenu.hidden); });
      sw.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true, true); } });
      document.addEventListener('click', function (e) { if (!swMenu.hidden && !swMenu.contains(e.target) && !sw.contains(e.target)) setOpen(false); });
      swMenu.addEventListener('keydown', function (e) {
        var list = Array.prototype.slice.call(swItems), i = list.indexOf(document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length].focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
        else if (e.key === 'Home') { e.preventDefault(); list[0].focus(); }
        else if (e.key === 'End') { e.preventDefault(); list[list.length - 1].focus(); }
        else if (e.key === 'Escape') { setOpen(false); sw.focus(); }
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !swMenu.hidden) { setOpen(false); sw.focus(); } });
      // choosing a website opens that website's own account page, on the same section you were viewing
      Array.prototype.forEach.call(swItems, function (a) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          if (a.classList.contains('is-current')) { setOpen(false); return; }
          window.location.href = a.getAttribute('href') + (location.hash || '');
        });
      });
    }
  });
})();
