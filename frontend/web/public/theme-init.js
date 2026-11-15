/* Applies the saved theme (light by default) before the first paint, so there is no flash. Classic script: the page's CSP allows same-origin scripts only. */
(function () {
  var saved = null;
  try { saved = localStorage.getItem('erp_auth_theme'); } catch (e) { /* storage blocked */ }
  // Light unless the visitor chose dark here. The OS setting is not followed, so every
  // address (LAN or public) and every browser shows the same page.
  var dark = saved === 'dark';
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
})();
