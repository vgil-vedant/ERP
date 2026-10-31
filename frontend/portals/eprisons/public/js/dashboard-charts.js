/* DashBoard charts, drawn as SVG from the figures embedded in the page.
   Two charts, as the original draws them:
     - a stacked area chart for the last seven days (Admission, Release, Visitors)
     - a grouped bar chart for the seven states holding the most people (Inside, Release, Admission)
   Each has a legend, in the original's reversed order. Clicking a legend entry hides or
   shows that series and redraws the chart; hovering a point or a bar shows its value.
   #hide=release,admission in the address starts with those series hidden.
   Nothing here makes a request: the data is in <script id="dash-data" type="application/json">. */
(function (root) {
  'use strict';

  var SERIES = {
    admission: { label: 'Admission', color: '#00e272', marker: 'square' },
    release:   { label: 'Release',   color: '#544fc5', marker: 'diamond' },
    visitors:  { label: 'Visitors',  color: '#2caffe', marker: 'circle' },
    inside:    { label: 'Inside',    color: '#2caffe', marker: 'circle' }
  };

  // ---- geometry (pure, so it can be tested without a browser) --------------
  function niceMax(v) {
    var e = Math.pow(10, Math.floor(Math.log10(v || 1)));
    var steps = [1, 2, 2.5, 5, 10];
    for (var i = 0; i < steps.length; i += 1) { if (steps[i] * e >= v) return steps[i] * e; }
    return 10 * e;
  }

  function fmt(n) { return Number(n).toLocaleString('en-IN'); }
  function kfmt(n) { return n >= 1000 ? (Math.round(n / 100) / 10) + 'k' : String(Math.round(n * 10) / 10); }
  function r1(n) { return Math.round(n * 10) / 10; }

  /** A smooth curve through the points (Catmull-Rom turned into cubic Beziers). */
  function spline(pts) {
    if (!pts.length) return '';
    var d = 'M' + r1(pts[0].x) + ',' + r1(pts[0].y);
    for (var i = 0; i < pts.length - 1; i += 1) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
      var c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
      d += ' C' + r1(c1x) + ',' + r1(c1y) + ' ' + r1(c2x) + ',' + r1(c2y) + ' ' + r1(p2.x) + ',' + r1(p2.y);
    }
    return d;
  }

  /** Stack the visible series bottom to top: [{key, lower[], upper[]}]. */
  function stack(rows, bottomToTop, hidden) {
    var base = rows.map(function () { return 0; });
    var layers = [];
    bottomToTop.forEach(function (key) {
      if (hidden[key]) return;
      var lower = base.slice();
      var upper = rows.map(function (r, i) { return base[i] + (r[key] || 0); });
      layers.push({ key: key, lower: lower, upper: upper });
      base = upper;
    });
    return layers;
  }

  // ---- drawing ---------------------------------------------------------------
  var NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }
  function text(parent, str, attrs) { var t = el('text', attrs, parent); t.textContent = str; return t; }

  function markerShape(parent, kind, cx, cy, size, color, extra) {
    var m, h = size / 2;
    if (kind === 'square') m = el('rect', { x: cx - h, y: cy - h, width: size, height: size }, parent);
    else if (kind === 'diamond') m = el('path', { d: 'M' + cx + ',' + (cy - h - 1) + ' L' + (cx + h + 1) + ',' + cy + ' L' + cx + ',' + (cy + h + 1) + ' L' + (cx - h - 1) + ',' + cy + ' Z' }, parent);
    else m = el('circle', { cx: cx, cy: cy, r: h }, parent);
    m.setAttribute('fill', color); m.setAttribute('stroke', '#fff'); m.setAttribute('stroke-width', '1');
    Object.keys(extra || {}).forEach(function (k) { m.setAttribute(k, extra[k]); });
    return m;
  }

  var tip = null;
  function showTip(evt, html) {
    if (!tip) { tip = document.createElement('div'); tip.className = 'chart-tip'; document.body.appendChild(tip); }
    tip.innerHTML = html; tip.hidden = false;
    tip.style.left = (evt.pageX + 12) + 'px'; tip.style.top = (evt.pageY - 10) + 'px';
  }
  function hideTip() { if (tip) tip.hidden = true; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function bindTip(node, label, key, value) {
    var color = SERIES[key].color;
    var html = '<span class="chart-tip__cat">' + esc(label) + '</span><br><span style="color:' + color + '">&#9679;</span> ' +
      esc(SERIES[key].label) + ': <b>' + fmt(value) + '</b>';
    node.addEventListener('mousemove', function (e) { showTip(e, html); });
    node.addEventListener('mouseleave', hideTip);
  }

  function dayLabel(iso) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }

  function drawTrend(host, rows, hidden) {
    var W = 480, H = 290, L = 46, R = 16, T = 16, B = 34;
    host.textContent = '';
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart', role: 'img',
      'aria-label': 'Admission, release and visitors per day, last seven days, newest first' }, host);
    var order = ['admission', 'release', 'visitors'];                // bottom to top
    var layers = stack(rows, order, hidden);
    var top = layers.length ? Math.max.apply(null, layers[layers.length - 1].upper) : 1;
    var max = niceMax(top);
    var x = function (i) { return L + (rows.length < 2 ? 0 : i * (W - L - R) / (rows.length - 1)); };
    var y = function (v) { return T + (H - T - B) * (1 - v / max); };

    for (var g = 0; g <= 4; g += 1) {
      var gv = max * g / 4;
      el('line', { x1: L, x2: W - R, y1: y(gv), y2: y(gv), class: 'chart__grid' }, svg);
      text(svg, kfmt(gv), { x: L - 8, y: y(gv) + 4, 'text-anchor': 'end', class: 'chart__tick' });
    }
    rows.forEach(function (r, i) {
      text(svg, dayLabel(r.date), { x: x(i), y: H - 12, 'text-anchor': 'middle', class: 'chart__tick' });
    });

    layers.forEach(function (layer) {
      var s = SERIES[layer.key];
      var up = layer.upper.map(function (v, i) { return { x: x(i), y: y(v) }; });
      var lo = layer.lower.map(function (v, i) { return { x: x(i), y: y(v) }; }).reverse();
      var area = spline(up) + ' L' + r1(lo[0].x) + ',' + r1(lo[0].y) + ' ' + spline(lo).replace(/^M[^ ]+ /, '') + ' Z';
      el('path', { d: area, fill: s.color, 'fill-opacity': '0.75', stroke: 'none' }, svg);
      el('path', { d: spline(up), fill: 'none', stroke: s.color, 'stroke-width': '2' }, svg);
    });
    layers.forEach(function (layer) {
      var s = SERIES[layer.key];
      rows.forEach(function (r, i) {
        var cy = y(layer.upper[i]);
        markerShape(svg, s.marker, x(i), cy, 7, s.color);
        var hit = el('circle', { cx: x(i), cy: cy, r: 11, fill: 'transparent', class: 'chart__hit' }, svg);
        bindTip(hit, dayLabel(r.date), layer.key, r[layer.key]);
      });
    });
    if (!layers.length) text(svg, 'All series are hidden. Click a legend entry to show it.', { x: W / 2, y: H / 2, 'text-anchor': 'middle', class: 'chart__tick' });
  }

  function drawStates(host, rows, hidden) {
    var W = 480, L = 128, R = 22, T = 8, B = 34;
    var order = ['inside', 'release', 'admission'];                  // top to bottom within a state
    var visible = order.filter(function (k) { return !hidden[k]; });
    var groupH = 38, H = T + B + rows.length * groupH;
    host.textContent = '';
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart', role: 'img',
      'aria-label': 'Inside, release and admission for the seven states holding the most people' }, host);
    var top = 1;
    rows.forEach(function (r) { visible.forEach(function (k) { top = Math.max(top, r[k]); }); });
    var max = niceMax(top);
    var x = function (v) { return L + (W - L - R) * v / max; };

    for (var g = 0; g <= 4; g += 1) {
      var gv = max * g / 4;
      el('line', { x1: x(gv), x2: x(gv), y1: T, y2: H - B, class: 'chart__grid' }, svg);
      text(svg, kfmt(gv), { x: x(gv), y: H - 14, 'text-anchor': 'middle', class: 'chart__tick' });
    }
    rows.forEach(function (r, i) {
      var y0 = T + i * groupH;
      var name = r.state.length > 20 ? r.state.slice(0, 19) + '…' : r.state;
      var label = text(svg, name.toUpperCase(), { x: L - 8, y: y0 + groupH / 2 + 4, 'text-anchor': 'end', class: 'chart__tick chart__tick--state' });
      var t = el('title', {}, label); t.textContent = r.state;
      var bars = visible.length || 1, bh = Math.min(20, (groupH - 6) / bars);
      var used = bh * visible.length, start = y0 + (groupH - used) / 2;
      visible.forEach(function (k, j) {
        var w = Math.max(x(r[k]) - L, r[k] > 0 ? 1 : 0);
        var bar = el('rect', { x: L, y: start + j * bh, width: w, height: bh - 1, fill: SERIES[k].color, class: 'chart__bar' }, svg);
        bindTip(bar, r.state, k, r[k]);
      });
    });
    el('line', { x1: L, x2: L, y1: T, y2: H - B, class: 'chart__axis' }, svg);
    if (!visible.length) text(svg, 'All series are hidden. Click a legend entry to show it.', { x: W / 2, y: H / 2, 'text-anchor': 'middle', class: 'chart__tick' });
  }

  // ---- legend ------------------------------------------------------------------
  function drawLegend(host, keys, hidden, redraw) {
    host.textContent = '';
    keys.forEach(function (k) {
      var s = SERIES[k];
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'legend__item' + (hidden[k] ? ' is-off' : '');
      b.setAttribute('aria-pressed', hidden[k] ? 'false' : 'true');
      var sw = el('svg', { viewBox: '0 0 16 12', width: 16, height: 12, 'aria-hidden': 'true', class: 'legend__mark' }, b);
      el('line', { x1: 0, x2: 16, y1: 6, y2: 6, stroke: s.color, 'stroke-width': 2 }, sw);
      markerShape(sw, s.marker, 8, 6, 6, s.color);
      b.appendChild(document.createTextNode(s.label));
      b.addEventListener('click', function () { hidden[k] = !hidden[k]; redraw(); });
      host.appendChild(b);
    });
  }

  function init() {
    var dataNode = document.getElementById('dash-data');
    if (!dataNode) return;
    var data = JSON.parse(dataNode.textContent);
    var hidden = {};
    var m = /^#hide=([a-z,]+)$/.exec(window.location.hash);
    if (m) m[1].split(',').forEach(function (k) { if (SERIES[k]) hidden[k] = true; });

    // each chart keeps its own set of hidden series, as the original does;
    // #hide=... only sets where both start
    function wire(hostId, legendId, keys, draw, rows) {
      var host = document.getElementById(hostId), legend = document.getElementById(legendId);
      if (!host || !legend) return;
      var mine = {};
      Object.keys(hidden).forEach(function (k) { mine[k] = hidden[k]; });
      function redraw() {
        draw(host, rows, mine);
        drawLegend(legend, keys, mine, redraw);
      }
      redraw();
    }
    // the original lists the legend in reverse of the stacking order
    wire('chart-trend', 'legend-trend', ['admission', 'release', 'visitors'], drawTrend, data.trend);
    wire('chart-states', 'legend-states', ['admission', 'release', 'inside'], drawStates, data.states);
    document.documentElement.classList.add('charts-ready');
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { niceMax: niceMax, spline: spline, stack: stack, kfmt: kfmt };
})(this);
