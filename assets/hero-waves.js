/* Philo Agency — vlny v pozadí hero sekce.
 *
 * Původní verze překreslovala 200+ SVG cest (21 tisíc bodů) v každém snímku,
 * což zatěžovalo procesor a web sekal. Tahle kreslí to samé na jedno canvas
 * plátno: jeden path a jeden stroke na snímek, řidší vzorkování po svislici,
 * strop 30 fps a smyčka stojí, jakmile je hero mimo obraz nebo je karta skrytá.
 */
(function () {
  'use strict';

  var container = document.getElementById('hero-waves');
  if (!container) return;

  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%';
  container.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── deterministický gradient noise (levnější než simplex, na vlny stačí) ─── */
  var perm = new Uint8Array(512);
  (function () {
    var p = new Uint8Array(256), seed = 1337, i, r, t;
    for (i = 0; i < 256; i++) p[i] = i;
    for (i = 255; i > 0; i--) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      r = seed % (i + 1);
      t = p[i]; p[i] = p[r]; p[r] = t;
    }
    for (i = 0; i < 512; i++) perm[i] = p[i & 255];
  })();

  function grad(h, x, y) {
    switch (h & 3) {
      case 0: return x + y;
      case 1: return y - x;
      case 2: return x - y;
      default: return -x - y;
    }
  }

  function noise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y);
    var xf = x - xi, yf = y - yi;
    var X = xi & 255, Y = yi & 255;
    var u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
    var v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
    var aa = perm[perm[X] + Y], ab = perm[perm[X] + Y + 1];
    var ba = perm[perm[X + 1] + Y], bb = perm[perm[X + 1] + Y + 1];
    var g1 = grad(aa, xf, yf), g2 = grad(ba, xf - 1, yf);
    var g3 = grad(ab, xf, yf - 1), g4 = grad(bb, xf - 1, yf - 1);
    var x1 = g1 + u * (g2 - g1);
    var x2 = g3 + u * (g4 - g3);
    return x1 + v * (x2 - x1);
  }

  /* ─── mřížka ─── */
  var W = 0, H = 0, xGap = 8, yGap = 20, nLines = 0, nPoints = 0, xStart = 0, yStart = 0;

  function build() {
    var rect = container.getBoundingClientRect();
    W = Math.ceil(rect.width);
    H = Math.ceil(rect.height);
    if (W === 0 || H === 0) return false;

    // Čáry jsou vlasové a na 10 % krytí — vyšší než 1,25× hustota pixelů
    // by stála výkon, aniž by to kdokoli poznal.
    var dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(15,23,42,0.1)';

    xGap = W < 640 ? 12 : 8;
    nLines = Math.ceil((W + 200) / xGap);
    nPoints = Math.ceil((H + 60) / yGap);
    xStart = (W - xGap * nLines) / 2;
    yStart = (H - yGap * nPoints) / 2;
    return true;
  }

  /* ─── kreslení ─── */
  function draw(time) {
    ctx.clearRect(0, 0, W, H);
    ctx.beginPath();

    var driftX = time * 0.000024, driftY = time * 0.000006;

    for (var i = 0; i < nLines; i++) {
      var x = xStart + xGap * i;
      var nx = x * 0.003 + driftX;
      for (var j = 0; j < nPoints; j++) {
        var y = yStart + yGap * j;
        var m = noise(nx, y * 0.002 + driftY) * 8;
        var px = x + Math.cos(m) * 12;
        var py = y + Math.sin(m) * 6;
        if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }

  /* ─── smyčka: strop 30 fps, běží jen když je hero vidět ─── */
  var FRAME_MS = 1000 / 30 - 2;
  var rafId = null, lastFrame = 0, t0 = 0, t0Elapsed = 0, inView = true;

  function now() { return window.performance && performance.now ? performance.now() : Date.now(); }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    if (now - lastFrame < FRAME_MS) return;
    lastFrame = now;
    draw(now - t0);
  }

  /* Po pauze navazujeme tam, kde jsme přestali — vlny nepřeskočí. */
  function start() {
    if (rafId !== null || reduceMotion) return;
    t0 = now() - t0Elapsed;
    lastFrame = 0;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    if (rafId === null) return;
    t0Elapsed = now() - t0;
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  function init() {
    if (!build()) return;
    draw(0);
    if (reduceMotion) return;      // uživatel si přeje omezené animace — zůstane statické
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView && !document.hidden) start(); else stop();
      }, { threshold: 0 }).observe(container);
    } else {
      start();
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (inView) start();
    });
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (build()) draw(rafId === null ? t0Elapsed : now() - t0);
    }, 150);
  }, { passive: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
