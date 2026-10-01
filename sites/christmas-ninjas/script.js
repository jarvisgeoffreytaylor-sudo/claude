/* The Christmas Ninjas. Vanilla JS, no dependencies.
   Modules: Hero (scroll-driven roofline opening), Menu, Reveal, Designer (light designer),
   Quote (form to mailto), plus a tiny footer helper.
   Nothing here gates content: without JS, or with prefers-reduced-motion, the hero is fully lit and static. */
(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var EMAIL = '7Christmasninjas@gmail.com';
  var PHONE_TEL = '+14403208377';
  var root = document.documentElement;
  var reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function svgEl(name, attrs) {
    var el = document.createElementNS(SVG_NS, name);
    for (var k in attrs) { el.setAttribute(k, attrs[k]); }
    return el;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function listToText(items) {
    if (items.length <= 1) { return items.join(''); }
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }
  function smoothOK() { return !reduceMotionQuery.matches; }

  /* ---------------------------------------------------------------
     1. Hero. The roof is pinned for one extra screen or two of scroll.
        Scroll position IS the state: scroll, swipe, arrow keys, tap and the
        "Turn on all lights" button all just move the page, and the ninja
        walks the roofline stringing lights. Jumping to any link below the
        hero (or the Skip link) lands past the runway with everything lit.
     --------------------------------------------------------------- */
  var Hero = (function () {
    var run = $('#hero-run'), hero = $('#top'), scene = $('#hero-scene'), svg = $('#roof');
    if (!run || !hero || !scene || !svg) { return {}; }
    var ninja = $('#ninja'), pilot = $('.pilot', svg);
    var btn = $('#lights-btn'), hint = $('#hero-hint'), status = $('#hero-status');
    var header = $('#site-header'), copy = $('#hero-copy');
    var active = root.classList.contains('motion');

    // Scene space = viewBox of #roof (house.jpg traced at 994 x 522).
    var VB = { x: -150, w: 1320, h: 562 };
    var CAM_MIN = 30, CAM_MAX = 1010;
    // Route the ninja walks: left foot of the left gable, peaks and feet, to the far right gable.
    var RV = [[108, 362], [186, 289], [270, 373], [294, 303], [323, 236], [412, 350], [500, 345], [620, 210], [728, 350], [752, 292], [872, 195], [947, 297]];
    var cum = [0];
    for (var i = 1; i < RV.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(RV[i][0] - RV[i - 1][0], RV[i][1] - RV[i - 1][1]));
    }
    var routeLen = cum[cum.length - 1];
    function lenAtU(u) {
      var k = Math.min(RV.length - 2, Math.floor(u));
      return cum[k] + (cum[k + 1] - cum[k]) * (u - k);
    }
    function pointAt(L) {
      L = clamp(L, 0, routeLen);
      var k = 1;
      while (k < cum.length - 1 && cum[k] < L) { k++; }
      var t = (L - cum[k - 1]) / ((cum[k] - cum[k - 1]) || 1);
      var a = RV[k - 1], b = RV[k];
      return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t };
    }
    function angleAt(L) {
      var a = pointAt(L - 14), b = pointAt(L + 14);
      return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    }

    var strings = $$('.str', svg).map(function (g) {
      var n = g.getAttribute('data-n');
      var u = g.getAttribute('data-u').split(',').map(Number);
      return {
        n: n, g: g, f: -1,
        len: $('#s' + n, svg).getTotalLength(),
        a: lenAtU(u[0]), b: lenAtU(u[1]),
        mk: $('#m' + n + ' .mk', svg),
        washes: $$('.wash[data-n="' + n + '"]', svg)
      };
    });

    var cw = 0, ch = 0, s = 1, vw = 980, camCur = null;
    var runPx = 1, heroH = 1, runTop = 0;
    var target = 0, cur = 0, running = false, prevP = 0, lastLit = -1;
    var hdrSolid = null, copyOp = -1;

    // Layout is read here only (load, resize), never inside the scroll path.
    function measure() {
      heroH = hero.offsetHeight;
      runPx = Math.max(1, run.offsetHeight - heroH);
      runTop = run.getBoundingClientRect().top + window.pageYOffset;
    }
    function layout() {
      cw = scene.clientWidth; ch = scene.clientHeight;
      if (!cw || !ch) { return; }
      // The roofline zone is whatever the headline block and ground strip leave. Fit the house height into it
      // (about 285 scene units from the top of the tallest peak plus ninja to the ground), fill the width when
      // that is possible, and on narrow screens hold a readable minimum zoom and follow the ninja.
      var sFitW = cw / (CAM_MAX - CAM_MIN), sFitH = ch / 285;
      var sMin = clamp(sFitH * 0.7, 1.3, 2);   // tall zones (tablet portrait) zoom in a little so the roof does not float low
      s = Math.min(sFitH, Math.max(sFitW, sMin));
      vw = cw / s;
      svg.classList.add('cam');
      svg.style.width = (VB.w * s) + 'px';
      svg.style.height = (VB.h * s) + 'px';
      scene.style.setProperty('--ground', Math.ceil(10 * s + 2) + 'px');
    }

    function setLight(st, f) {
      if (f === st.f) { return; }
      st.f = f;
      if (f <= 0) {
        st.g.classList.remove('on'); st.g.removeAttribute('mask');
      } else {
        st.g.classList.add('on');
        if (f >= 1) { st.g.removeAttribute('mask'); }
        else {
          st.mk.style.strokeDasharray = (f * st.len).toFixed(1) + ' ' + (st.len * 3).toFixed(1);
          st.g.setAttribute('mask', 'url(#m' + st.n + ')');
        }
      }
      var w = smooth(f * 1.4);
      st.washes.forEach(function (el) { el.style.opacity = w.toFixed(3); });
    }

    function render(p, instantCam) {
      var L = p * routeLen;
      var front = L - 9 * (1 - clamp((p - 0.97) / 0.03, 0, 1));
      if (p >= 0.999) { front = routeLen + 1; }
      strings.forEach(function (st) {
        var f = clamp((front - st.a) / (st.b - st.a), 0, 1);
        setLight(st, f < 0.004 ? 0 : (f > 0.996 ? 1 : f));
      });

      var pt = pointAt(L);
      var ang = clamp(angleAt(L) * 0.55, -26, 26);
      var moving = Math.abs(p - prevP) > 0.00015;
      prevP = p;
      var bob = moving ? Math.sin(L * 0.32) * 1.1 : 0;
      var sway = moving ? Math.sin(L * 0.32 + 1) * 2 : 0;
      ninja.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + (pt.y + 1 + bob).toFixed(1) + ') rotate(' + (ang + sway).toFixed(1) + ')');
      var lit = 0.3 + 0.7 * smooth(p / 0.1);
      if (Math.abs(lit - lastLit) > 0.004) { ninja.style.setProperty('--lit', lit.toFixed(3)); lastLit = lit; }
      if (pilot) { pilot.style.display = p > 0.07 ? 'none' : ''; pilot.style.opacity = (1 - smooth(p / 0.06)).toFixed(2); }

      // camera: follow the ninja when the screen is narrower than the house
      var want = pt.x - vw * 0.4;
      var lo = CAM_MIN, hi = CAM_MAX - vw;
      want = hi < lo ? (lo + hi) / 2 : clamp(want, lo, hi);
      // on wide screens the finished house settles back to centre
      if (hi - lo < 260 && hi >= lo) { want += ((lo + hi) / 2 - want) * smooth((p - 0.88) / 0.12); }
      camCur = (camCur === null || instantCam) ? want : camCur + (want - camCur) * 0.2;
      if (Math.abs(want - camCur) < 0.05) { camCur = want; }
      svg.style.transform = 'translate3d(' + (-(camCur - VB.x) * s).toFixed(1) + 'px,0,0)';

      var done = p >= 0.999;
      if (slider) {
        scene.setAttribute('aria-valuenow', String(Math.round(p * 100)));
        scene.setAttribute('aria-valuetext', done ? 'Roofline fully lit' : Math.round(p * 100) + ' percent of the roofline lit');
      }
      if (hint) { hint.classList.toggle('gone', p > 0.02); }
      if (btn) {
        var label = done ? 'Replay' : 'Turn on all lights';
        if (btn.textContent !== label) { btn.textContent = label; }
        if (status) {
          var msg = done ? 'All lights are on.' : '';
          if (status.textContent !== msg) { status.textContent = msg; status.hidden = !done; if (hint) { hint.hidden = done; } }
        }
      }
    }

    var slider = false;
    var WALK = 0.94; // the last 6% of the runway is a hold: the ninja stops and the roofline settles
    function rawFromScroll() { return clamp((window.pageYOffset - runTop) / runPx, 0, 1); }
    // scroll 0..1 to walk 0..1: gentle ease in and out, so the start and the landing feel soft
    function ease(raw) {
      var w = clamp(raw / WALK, 0, 1);
      return w * 0.45 + smooth(w) * 0.55;
    }
    var lastT = 0, queued = false;
    function frame(t) {
      queued = false;
      var y = window.pageYOffset;

      // header gets its backing once the headline starts to leave
      var solid = y > (active ? runPx : 0) + heroH * 0.45;
      if (header && solid !== hdrSolid) { hdrSolid = solid; header.classList.toggle('solid', solid); }
      if (!active) { return; }

      // after the pin releases, the headline block fades before it can reach the header
      if (copy) {
        var r = clamp((y - runTop - runPx) / (heroH * 0.4), 0, 1);
        var op = Math.round((1 - r) * 50) / 50;
        if (op !== copyOp) { copyOp = op; copy.style.opacity = op >= 1 ? '' : op; }
      }

      target = ease(rawFromScroll());
      // far below the hero nobody sees the walk: jump straight to the end state
      if (y > runTop + runPx + heroH * 1.2) { cur = target; }
      var dt = lastT ? Math.min(100, t - lastT) : 16;
      lastT = t;
      var d = target - cur;
      if (Math.abs(d) < 0.0006) {
        if (cur !== target || !rendered) { cur = target; render(cur); rendered = true; }
        lastT = 0; running = false; return;
      }
      cur += d * (1 - Math.exp(-dt / 110));
      render(cur);
      running = true; queued = true;
      window.requestAnimationFrame(frame);
    }
    var rendered = false;
    function onScroll() {
      if (queued) { return; }
      queued = true;
      window.requestAnimationFrame(frame);
    }

    function scrollToP(p, smoothly) {
      window.scrollTo({ top: runTop + clamp(p, 0, 1) * runPx, behavior: (smoothly && smoothOK()) ? 'smooth' : 'auto' });
    }
    function nudge(dp) { scrollToP(rawFromScroll() + dp, true); }

    function setup() {
      measure(); layout();
      if (active) {
        target = cur = ease(rawFromScroll());
        camCur = null;
        render(cur, true);
        rendered = true;
      } else {
        // static: all lights on, ninja crouched on the middle peak
        strings.forEach(function (st) { setLight(st, 1); });
        var pk = lenAtU(7), pt = pointAt(pk);
        ninja.setAttribute('transform', 'translate(' + pt.x + ' ' + (pt.y + 1) + ')');
        ninja.style.setProperty('--lit', '1');
        if (pilot) { pilot.style.display = 'none'; }
        camCur = null;
        var want = pt.x - vw * 0.5, lo = CAM_MIN, hi = CAM_MAX - vw;
        want = hi < lo ? (lo + hi) / 2 : clamp(want, lo, hi);
        svg.style.transform = 'translate3d(' + (-(want - VB.x) * s).toFixed(1) + 'px,0,0)';
      }
      hdrSolid = null; copyOp = -1;
      onScroll();
    }

    if (active) {
      slider = true;
      scene.setAttribute('role', 'slider');
      scene.setAttribute('tabindex', '0');
      scene.setAttribute('aria-label', 'Guide the ninja along the roof. Left and right arrow keys move him; lights switch on behind him.');
      scene.setAttribute('aria-valuemin', '0');
      scene.setAttribute('aria-valuemax', '100');
      if (hint) { hint.hidden = false; }
      if (btn) { btn.hidden = false; }

      scene.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'ArrowRight') { e.preventDefault(); nudge(0.1); }
        else if (k === 'ArrowLeft') { e.preventDefault(); nudge(-0.1); }
        else if (k === 'Home') { e.preventDefault(); scrollToP(0, true); }
        else if (k === 'End') { e.preventDefault(); scrollToP(1, true); }
      });

      // swipe / drag left moves him on, right brings him back; a plain tap nudges him forward
      var drag = null;
      scene.addEventListener('pointerdown', function (e) {
        if (e.target.closest && e.target.closest('a, button')) { return; }
        if (e.pointerType === 'mouse' && e.button !== 0) { return; }
        drag = { x: e.clientX, y: e.clientY, t: Date.now(), moved: false, sy: window.pageYOffset, id: e.pointerId };
      });
      scene.addEventListener('pointermove', function (e) {
        if (!drag || e.pointerId !== drag.id) { return; }
        var dx = e.clientX - drag.x;
        if (Math.abs(dx) > 8) {
          drag.moved = true;
          window.scrollTo(0, drag.sy - dx * (runPx / (cw * 0.9)));
        }
      });
      function endDrag(e) {
        if (!drag || e.pointerId !== drag.id) { return; }
        var d = drag; drag = null;
        if (e.type === 'pointerup' && !d.moved && Math.abs(e.clientY - d.y) < 8 && Date.now() - d.t < 400) { nudge(0.12); }
      }
      scene.addEventListener('pointerup', endDrag);
      scene.addEventListener('pointercancel', function () { drag = null; });

      if (btn) {
        btn.addEventListener('click', function () {
          if (rawFromScroll() >= 0.999) { scrollToP(0, false); } else { scrollToP(1, true); }
        });
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('load', function () { measure(); onScroll(); });
    if (window.ResizeObserver) {
      var lw = 0, lh = 0;
      new ResizeObserver(function () {
        if (scene.clientWidth !== lw || scene.clientHeight !== lh) { lw = scene.clientWidth; lh = scene.clientHeight; setup(); }
      }).observe(scene);
    } else {
      window.addEventListener('resize', setup);
    }
    setup();
    return {};
  })();

  /* ---------------------------------------------------------------
     1b. Menu toggle (small screens). Links are plain anchors without JS.
     --------------------------------------------------------------- */
  (function () {
    var header = $('#site-header'), btn = $('#nav-toggle'), list = $('#nav-links');
    if (!header || !btn || !list) { return; }
    function setOpen(open) {
      header.classList.toggle('nav-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
    list.addEventListener('click', function (e) { if (e.target.closest('a')) { setOpen(false); } });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setOpen(false); btn.focus(); }
    });
  })();

  /* ---------------------------------------------------------------
     1c. Reveal: text lights up as it enters. Resting state is visible;
         this only runs with JS, motion allowed and IntersectionObserver.
     --------------------------------------------------------------- */
  (function () {
    var items = $$('.rv');
    if (!items.length || !('IntersectionObserver' in window) || !root.classList.contains('motion')) { return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    root.classList.add('reveal-on');
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------------------------------------------------------
     2. Light designer
     --------------------------------------------------------------- */
  var Designer = (function () {
    var app = $('#designer-app');
    if (!app) { return {}; }
    var svg = $('#house-svg');

    var ZONES = {
      roof:    { paths: [{ d: 'M168 206 L320 98 L474 206' }, { d: 'M48 257 L128 204 L208 257' }], holidayOnly: false },
      windows: { paths: [{ d: 'M216 232 h50 v58 h-50 Z', closed: true }, { d: 'M376 232 h50 v58 h-50 Z', closed: true }], holidayOnly: false },
      door:    { paths: [{ d: 'M298 338 V282 A22 22 0 0 1 342 282 V338' }], holidayOnly: false },
      trees:   { paths: [{ d: 'M530 192 L556 250 L504 264 L562 298 L498 314 L572 334' }, { d: 'M603 250 L618 292 L588 300 L624 326 L582 332' }], holidayOnly: true },
      shrubs:  { paths: [{ d: 'M209 334 A27 19 0 0 1 263 334' }, { d: 'M377 334 A27 19 0 0 1 431 334' }], holidayOnly: true },
      wreath:  { paths: [{ d: 'M332 292 A12 12 0 1 1 308 292 A12 12 0 1 1 332 292', closed: true, tight: true }], holidayOnly: true }
    };
    var MODES = {
      holiday:   { label: 'Holiday', spacing: 17, r: 3.2, hint: 'Holiday: seasonal lights, put up and taken down.' },
      permanent: { label: 'Permanent', spacing: 11, r: 2.2, hint: 'Permanent: track lighting that stays up, ready for any occasion.' }
    };
    var SCENES = {
      christmas: { label: 'Christmas',     mode: 'holiday',   palette: 'redgreen',     zones: ['roof', 'windows', 'trees', 'shrubs', 'wreath'] },
      halloween: { label: 'Halloween',     mode: 'holiday',   palette: 'orangepurple', zones: ['roof', 'windows', 'door', 'shrubs'] },
      july4:     { label: '4th of July',   mode: 'holiday',   palette: 'rwb',          zones: ['roof', 'windows', 'door', 'shrubs'] },
      gameday:   { label: 'Game day',      mode: 'holiday',   palette: 'orange',       zones: ['roof', 'windows', 'door'] },
      everyday:  { label: 'Everyday warm', mode: 'permanent', palette: 'warm',         zones: ['roof'] }
    };

    var modeInputs = $$('input[name="mode"]', app);
    var paletteInputs = $$('input[name="palette"]', app);
    var zoneInputs = $$('input[name="zone"]', app);
    var sceneBtns = $$('[data-scene]', app);
    var customInput = $('#custom-color');
    var customRow = $('#custom-row');
    var colorName = $('#color-name');
    var modeHint = $('#mode-hint');
    var zoneHint = $('#zone-hint');
    var summaryEl = $('#design-summary');
    var quoteBtn = $('#design-quote');
    var wreathDecor = $('#wreath-decor');

    var state = {
      mode: 'holiday',
      palette: 'warm',
      custom: customInput.value,
      zones: { roof: true, windows: true, door: false, trees: false, shrubs: false, wreath: false },
      scene: null
    };

    // Palette colors come from the data-colors attributes in the HTML.
    var palettes = {};
    paletteInputs.forEach(function (inp) {
      palettes[inp.value] = { name: inp.getAttribute('data-name'), colors: inp.getAttribute('data-colors').split(',') };
      var cols = palettes[inp.value].colors;
      var sw = inp.nextElementSibling;
      applySwatch(sw, cols);
    });
    function applySwatch(sw, cols) {
      sw.style.setProperty('--sw1', cols[0]);
      if (cols.length === 1) {
        sw.style.setProperty('--sw', cols[0]);
      } else {
        var seg = 100 / cols.length;
        sw.style.setProperty('--sw', 'conic-gradient(' + cols.map(function (c, i) {
          return c + ' ' + (i * seg) + '% ' + ((i + 1) * seg) + '%';
        }).join(', ') + ')');
      }
    }

    function currentColors() {
      return state.palette === 'custom' ? [state.custom] : palettes[state.palette].colors;
    }
    function paletteName() {
      return state.palette === 'custom' ? 'custom color ' + state.custom : palettes[state.palette].name.toLowerCase();
    }
    function zoneActive(id) {
      return state.zones[id] && !(ZONES[id].holidayOnly && state.mode === 'permanent');
    }

    // Light layouts depend only on geometry and spacing, so measure once per mode.
    var layoutCache = {};
    function layoutFor(zoneId, mode) {
      var key = zoneId + ':' + mode;
      if (layoutCache[key]) { return layoutCache[key]; }
      var spacing = MODES[mode].spacing;
      var out = ZONES[zoneId].paths.map(function (def) {
        var tmp = svgEl('path', { d: def.d });
        var zoneG = $('#z-' + zoneId);
        zoneG.appendChild(tmp);
        var len = tmp.getTotalLength();
        var n = Math.max(2, Math.round(len / (spacing * (def.tight ? 0.6 : 1))));
        var points = [];
        var slots = def.closed ? n : n + 1;
        for (var i = 0; i < slots; i++) {
          var pt = tmp.getPointAtLength((i / n) * len);
          points.push([pt.x, pt.y]);
        }
        zoneG.removeChild(tmp);
        return { d: def.d, points: points };
      });
      layoutCache[key] = out;
      return out;
    }

    function renderLights() {
      var colors = currentColors();
      var m = MODES[state.mode];
      Object.keys(ZONES).forEach(function (id) {
        var g = $('#z-' + id);
        while (g.firstChild) { g.removeChild(g.firstChild); }
        if (!zoneActive(id)) { return; }
        var idx = 0;
        layoutFor(id, state.mode).forEach(function (path) {
          g.appendChild(svgEl('path', { d: path.d, 'class': state.mode === 'permanent' ? 'track' : 'cord' }));
          path.points.forEach(function (p) {
            var col = colors[idx % colors.length];
            g.appendChild(svgEl('circle', { 'class': 'bulb', cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: m.r, fill: col }));
            idx++;
          });
        });
      });
      wreathDecor.style.display = zoneActive('wreath') ? '' : 'none';
    }

    function summaryText() {
      var ids = Object.keys(ZONES).filter(zoneActive);
      if (!ids.length) { return ''; }
      var labels = ids.map(function (id) { return $('input[value="' + id + '"]', app).getAttribute('data-label'); });
      var text = '';
      if (state.scene) { text += 'Scene: ' + SCENES[state.scene].label + '. '; }
      text += MODES[state.mode].label + ' lighting in ' + paletteName() + ' on the ' + listToText(labels) + '.';
      return text;
    }

    function syncControls() {
      modeInputs.forEach(function (i) { i.checked = i.value === state.mode; });
      paletteInputs.forEach(function (i) { i.checked = i.value === state.palette; });
      customInput.value = state.custom;
      customRow.classList.toggle('active', state.palette === 'custom');
      zoneInputs.forEach(function (i) {
        i.checked = !!state.zones[i.value];
        i.disabled = ZONES[i.value].holidayOnly && state.mode === 'permanent';
      });
      sceneBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-scene') === state.scene ? 'true' : 'false'); });
      colorName.textContent = state.palette === 'custom' ? 'Custom (' + state.custom + ')' : palettes[state.palette].name;
      modeHint.textContent = MODES[state.mode].hint;
      zoneHint.hidden = state.mode !== 'permanent';
    }

    function render() {
      syncControls();
      renderLights();
      var text = summaryText();
      summaryEl.textContent = text || 'No lights placed yet. Choose where the lights go.';
    }

    /* events */
    modeInputs.forEach(function (i) {
      i.addEventListener('change', function () { state.mode = i.value; state.scene = null; render(); });
    });
    paletteInputs.forEach(function (i) {
      i.addEventListener('change', function () { state.palette = i.value; state.scene = null; render(); });
    });
    customInput.addEventListener('input', function () {
      state.custom = customInput.value; state.palette = 'custom'; state.scene = null; render();
    });
    zoneInputs.forEach(function (i) {
      i.addEventListener('change', function () { state.zones[i.value] = i.checked; state.scene = null; render(); });
    });
    sceneBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-scene');
        var s = SCENES[key];
        state.mode = s.mode;
        state.palette = s.palette;
        if (s.custom) { state.custom = s.custom; }
        Object.keys(state.zones).forEach(function (id) { state.zones[id] = s.zones.indexOf(id) !== -1; });
        state.scene = key;
        render();
      });
    });
    quoteBtn.addEventListener('click', function () {
      var text = summaryText();
      document.dispatchEvent(new CustomEvent('design:quote', {
        detail: { summary: text, service: state.mode === 'permanent' ? 'Permanent lighting' : 'Holiday lighting' }
      }));
    });

    render();
    return { getSummary: summaryText };
  })();

  /* ---------------------------------------------------------------
     3. Quote form. No backend: validate, then open a mailto: with
        everything prefilled. Visible call + copy fallbacks.
        (Replace with a form service later. See README.)
     --------------------------------------------------------------- */
  var Quote = (function () {
    var form = $('#quote-form');
    if (!form) { return {}; }
    var f = {
      name: $('#f-name'), phone: $('#f-phone'), email: $('#f-email'), town: $('#f-town'),
      service: $('#f-service'), design: $('#f-design'), notes: $('#f-notes')
    };
    var errBox = $('#form-error');
    var status = $('#form-status');
    var mailtoLink = $('#status-mailto');
    var copyBtn = $('#copy-btn');
    var copyMsg = $('#copy-msg');
    var lastRequest = '';

    function setError(key, msg) {
      var input = f[key], p = $('#e-' + key);
      if (!p) { return; }
      if (msg) { p.textContent = msg; p.hidden = false; input.setAttribute('aria-invalid', 'true'); }
      else { p.textContent = ''; p.hidden = true; input.removeAttribute('aria-invalid'); }
    }

    function validate() {
      var errs = {};
      if (!f.name.value.trim()) { errs.name = 'Please enter your name.'; }
      var digits = f.phone.value.replace(/\D/g, '');
      if (!f.phone.value.trim()) { errs.phone = 'Please enter a phone number.'; }
      else if (digits.length < 10) { errs.phone = 'Please enter a 10-digit phone number.'; }
      var email = f.email.value.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errs.email = 'That email does not look right. Check it or leave it blank.'; }
      if (!f.town.value.trim()) { errs.town = 'Please enter your address or town.'; }
      if (!f.service.value) { errs.service = 'Please choose a service.'; }
      return errs;
    }

    function buildRequest() {
      var v = function (k) { return f[k].value.trim(); };
      var subject = 'Quote request: ' + v('service') + ' - ' + v('name');
      var lines = [
        'Quote request from the Christmas Ninjas website',
        '',
        'Name: ' + v('name'),
        'Phone: ' + v('phone'),
        'Email: ' + (v('email') || '(not given)'),
        'Address/town: ' + v('town'),
        'Service: ' + v('service')
      ];
      if (v('design')) { lines.push('', 'Lighting look:', v('design')); }
      if (v('notes')) { lines.push('', 'Notes:', v('notes')); }
      var body = lines.join('\n');
      var href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) +
                 '&body=' + encodeURIComponent(body.replace(/\n/g, '\r\n'));
      return { subject: subject, body: body, href: href };
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var errs = validate();
      var keys = ['name', 'phone', 'email', 'town', 'service'];
      keys.forEach(function (k) { setError(k, errs[k]); });
      var bad = keys.filter(function (k) { return errs[k]; });
      if (bad.length) {
        errBox.textContent = 'Please fix ' + (bad.length === 1 ? 'the highlighted field' : 'the highlighted fields') + ' and try again.';
        errBox.hidden = false;
        status.hidden = true;
        f[bad[0]].focus();
        return;
      }
      errBox.hidden = true;
      var req = buildRequest();
      lastRequest = 'To: ' + EMAIL + '\nSubject: ' + req.subject + '\n\n' + req.body;
      mailtoLink.setAttribute('href', req.href);
      copyMsg.textContent = '';
      status.hidden = false;
      status.focus();
      window.location.href = req.href;
    });

    Object.keys(f).forEach(function (k) {
      f[k].addEventListener('input', function () { setError(k, ''); });
    });

    function legacyCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
    copyBtn.addEventListener('click', function () {
      var done = function (ok) {
        copyMsg.textContent = ok
          ? 'Copied. Paste it into an email to ' + EMAIL + ' or a text.'
          : 'Could not copy automatically. Please call 440-320-8377 or email ' + EMAIL + '.';
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(lastRequest).then(function () { done(true); }, function () { done(legacyCopy(lastRequest)); });
      } else {
        done(legacyCopy(lastRequest));
      }
    });

    document.addEventListener('design:quote', function (e) {
      var d = e.detail || {};
      if (d.summary) { f.design.value = d.summary; }
      if (d.service && !f.service.value) { f.service.value = d.service; }
      else if (d.service && f.service.value !== d.service && f.service.value.indexOf('Both') !== 0) { f.service.value = d.service; }
      window.setTimeout(function () { f.name.focus({ preventScroll: true }); }, 50);
    });

    return { buildRequest: buildRequest, PHONE_TEL: PHONE_TEL };
  })();

  /* footer year */
  var yr = $('#year');
  if (yr) { yr.textContent = new Date().getFullYear(); }
})();
