/* The Christmas Ninjas. Vanilla JS, no dependencies.
   Modules: Lights (master toggle), Roofline (scroll progress + nav),
   Designer (light designer), Quote (form to mailto), plus a tiny footer helper. */
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
  function listToText(items) {
    if (items.length <= 1) { return items.join(''); }
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }

  /* ---------------------------------------------------------------
     1. Lights master toggle (remembered; default on)
     --------------------------------------------------------------- */
  var Lights = (function () {
    var KEY = 'cn-lights';
    var btn = $('#lights-toggle');
    if (!btn) { return {}; }
    var state = $('.lights-state', btn);

    function apply(on) {
      if (on) { delete root.dataset.lights; } else { root.dataset.lights = 'off'; }
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
      if (state) { state.textContent = on ? 'on' : 'off'; }
    }
    function save(on) {
      try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* storage blocked: fine */ }
    }
    var on = true;
    try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) { on = true; }
    apply(on);
    btn.addEventListener('click', function () {
      on = !on;
      apply(on);
      save(on);
    });
    return {};
  })();

  /* ---------------------------------------------------------------
     2. Roofline scroll progress + section nav
     A ninja sneaks along the roofline as you scroll; bulbs switch on
     behind him. Each peak is a link to a section.
     --------------------------------------------------------------- */
  var Roofline = (function () {
    var nav = $('#roofline');
    var header = $('#site-header');
    if (!nav || !header) { return {}; }
    var svg = $('.roofline-svg', nav);
    var items = $$('li', nav);
    var links = items.map(function (li) { return $('a', li); });
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    var N = links.length;
    var BULB_COLORS = ['#ff5a5f', '#ffd98a', '#4ee08e', '#ffd98a'];

    var pts = [], cum = [], total = 0, peakIdx = [], peakLen = [];
    var bulbs = [], bulbLens = [], lit = 0;
    var ninja = null, edge = null;
    var ticking = false, movingTimer = null, lastLen = -1;

    function build() {
      var W = nav.clientWidth, H = nav.clientHeight;
      if (!W || !H) { return; }
      while (svg.firstChild) { svg.removeChild(svg.firstChild); }
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

      var m = Math.max(28, Math.min(64, W * 0.06));
      var step = (W - 2 * m) / (N - 1);
      var e = step * 0.38;
      var vy = H - 8;
      pts = [[0, vy]];
      peakIdx = [];
      var xs = [];
      for (var i = 0; i < N; i++) {
        var x = m + i * step;
        xs.push(x);
        pts.push([Math.max(0, x - e), vy]);
        pts.push([x, i % 2 ? 38 : 32]);
        peakIdx.push(pts.length - 1);
        pts.push([Math.min(W, x + e), vy]);
      }
      pts.push([W, vy]);

      cum = [0];
      for (var j = 1; j < pts.length; j++) {
        cum.push(cum[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
      }
      total = cum[cum.length - 1];
      peakLen = peakIdx.map(function (idx) { return cum[idx]; });

      var d = pts.map(function (p, k) { return (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
      svg.appendChild(svgEl('path', { 'class': 'rl-fill', d: d + ' L' + W + ' ' + H + ' L0 ' + H + 'Z' }));
      edge = svgEl('path', { 'class': 'rl-edge', d: d });
      svg.appendChild(edge);

      var g = svgEl('g', { 'class': 'rl-bulbs' });
      bulbs = []; bulbLens = []; lit = 0;
      var count = Math.floor(total / 15);
      for (var b = 1; b < count; b++) {
        var len = (b / count) * total;
        var p = pointAt(len);
        var c = svgEl('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 3 });
        c.style.setProperty('--c', BULB_COLORS[b % BULB_COLORS.length]);
        g.appendChild(c);
        bulbs.push(c);
        bulbLens.push(len);
      }
      svg.appendChild(g);

      ninja = svgEl('g', { 'class': 'rl-ninja' });
      ninja.appendChild(svgEl('use', { href: '#ninja', width: 38, height: 35 }));
      svg.appendChild(ninja);

      items.forEach(function (li, k) {
        li.style.left = xs[k].toFixed(1) + 'px';
        $('.rl-bulb', li).style.top = (pts[peakIdx[k]][1] + 12) + 'px';
      });
      lastLen = -1;
      update(true);
    }

    function pointAt(len) {
      len = Math.max(0, Math.min(total, len));
      var i = 1;
      while (i < cum.length - 1 && cum[i] < len) { i++; }
      var seg = cum[i] - cum[i - 1] || 1;
      var t = (len - cum[i - 1]) / seg;
      var a = pts[i - 1], b = pts[i];
      return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, angle: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    }

    /* Section progress p in [0, N-1]. Integer values mean the section
       top sits at the header edge. Handles short last sections. */
    function progress() {
      var y = window.pageYOffset;
      var hh = header.offsetHeight;
      var max = Math.max(1, root.scrollHeight - window.innerHeight);
      var eff = targets.map(function (t, k) {
        var top = t.getBoundingClientRect().top + y - hh;
        return k === 0 ? 0 : Math.min(top, max - (N - 1 - k) * 24);
      });
      var k = N - 1;
      while (k > 0 && y < eff[k]) { k--; }
      if (k === N - 1) { return N - 1; }
      var span = Math.max(1, eff[k + 1] - eff[k]);
      return Math.max(0, Math.min(N - 1, k + (y - eff[k]) / span));
    }

    function update(force) {
      ticking = false;
      if (!pts.length) { return; }
      var p = progress();
      var active = Math.round(p);
      links.forEach(function (a, k) {
        if (k === active) { a.setAttribute('aria-current', 'true'); } else { a.removeAttribute('aria-current'); }
      });
      var reduce = reduceMotionQuery.matches;
      var len;
      if (reduce) {
        len = peakLen[0];       // parked at the first peak, all lights already on
      } else {
        var i = Math.min(N - 2, Math.floor(p));
        len = peakLen[i] + (peakLen[i + 1] - peakLen[i]) * (p - i);
      }
      items.forEach(function (li, k) {
        $('.rl-bulb', li).classList.toggle('lit', reduce || p >= k - 0.02);
      });

      if (force || len !== lastLen) {
        var pt = pointAt(len);
        var rot = Math.max(-22, Math.min(22, pt.angle * 57.3 * 0.6));
        ninja.setAttribute('transform', 'translate(' + (pt.x - 19).toFixed(1) + ' ' + (pt.y - 33).toFixed(1) + ') rotate(' + rot.toFixed(1) + ' 19 33)');
        var want = reduce ? bulbs.length : bulbLens.filter(function (l) { return l <= len + 1; }).length;
        while (lit < want) { bulbs[lit].classList.add('on'); lit++; }
        while (lit > want) { lit--; bulbs[lit].classList.remove('on'); }
        if (!reduce && lastLen >= 0) {
          ninja.classList.add('moving');
          clearTimeout(movingTimer);
          movingTimer = setTimeout(function () { ninja.classList.remove('moving'); }, 180);
        }
        lastLen = len;
      }
    }

    function onScroll() {
      root.classList.toggle('scrolled', window.pageYOffset > 120);
      if (!ticking) { ticking = true; window.requestAnimationFrame(function () { update(false); }); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('load', function () { update(true); });
    if (reduceMotionQuery.addEventListener) { reduceMotionQuery.addEventListener('change', function () { update(true); }); }
    if (window.ResizeObserver) {
      var lastW = 0;
      new ResizeObserver(function () {
        if (nav.clientWidth !== lastW) { lastW = nav.clientWidth; build(); }
      }).observe(nav);
    } else {
      window.addEventListener('resize', build);
    }
    build();
    onScroll();
    return {};
  })();

  /* ---------------------------------------------------------------
     3. Light designer
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
      holiday:   { label: 'Holiday', spacing: 17, r: 4.6, hint: 'Holiday: seasonal lights, put up and taken down.' },
      permanent: { label: 'Permanent', spacing: 11, r: 3, hint: 'Permanent: track lighting that stays up, ready for any occasion.' }
    };
    var SCENES = {
      christmas: { label: 'Christmas',     mode: 'holiday',   palette: 'redgreen',     zones: ['roof', 'windows', 'trees', 'shrubs', 'wreath'] },
      halloween: { label: 'Halloween',     mode: 'holiday',   palette: 'orangepurple', zones: ['roof', 'windows', 'door', 'shrubs'] },
      july4:     { label: '4th of July',   mode: 'holiday',   palette: 'rwb',          zones: ['roof', 'windows', 'door', 'shrubs'] },
      gameday:   { label: 'Game day',      mode: 'holiday',   palette: 'custom',       zones: ['roof', 'windows', 'door'], custom: '#ff7a1a' },
      everyday:  { label: 'Everyday warm', mode: 'permanent', palette: 'warm',         zones: ['roof'] }
    };

    var modeInputs = $$('input[name="mode"]', app);
    var paletteInputs = $$('input[name="palette"]', app);
    var zoneInputs = $$('input[name="zone"]', app);
    var sceneBtns = $$('[data-scene]', app);
    var customInput = $('#custom-color');
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
            g.appendChild(svgEl('circle', {
              'class': 'bulb', cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: m.r,
              fill: colors[idx % colors.length]
            }));
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
      var customPal = $('input[value="custom"]', app);
      customPal.setAttribute('data-colors', state.custom);
      applySwatch(customPal.nextElementSibling, [state.custom]);
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
     4. Quote form. No backend: validate, then open a mailto: with
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
