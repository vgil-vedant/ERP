/* Home page carousel: two slides, next / previous, two indicators.
   Advances every 7 s, pauses while the pointer or focus is inside it, and does
   not advance on its own when the visitor prefers reduced motion.
   Opening the page with #slide-2 starts on the second slide. */
(function () {
  'use strict';
  var root = document.querySelector('.carousel');
  if (!root) return;
  var slides = root.querySelectorAll('.carousel__slide');
  var dots = root.querySelectorAll('.carousel__dots button');
  var current = 0;
  var timer = null;

  function show(n) {
    current = (n + slides.length) % slides.length;
    Array.prototype.forEach.call(slides, function (s, i) { s.classList.toggle('is-active', i === current); });
    Array.prototype.forEach.call(dots, function (d, i) {
      d.classList.toggle('is-active', i === current);
      if (i === current) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
  }
  function start() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    stop();
    timer = setInterval(function () { show(current + 1); }, 7000);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  root.querySelector('.carousel__ctrl--prev').addEventListener('click', function () { show(current - 1); start(); });
  root.querySelector('.carousel__ctrl--next').addEventListener('click', function () { show(current + 1); start(); });
  Array.prototype.forEach.call(dots, function (d, i) { d.addEventListener('click', function () { show(i); start(); }); });
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', start);

  var m = /^#slide-(\d+)$/.exec(window.location.hash);
  if (m) {
    // choosing the first slide from the address is not an animation
    root.classList.add('is-static');
    show(Number(m[1]) - 1);
    window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { root.classList.remove('is-static'); }); });
  }
  start();
})();
