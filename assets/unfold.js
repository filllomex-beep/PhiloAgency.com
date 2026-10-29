/*
 * Unfold: the figure in the „Responzivní design“ tile, drawn with HL (hairline-kernel.js).
 * A phone standing in its dock that becomes a laptop. Hovering the tile plays it once,
 * on a spring: the screen leans back on its hinge, the dock slides out into a keyboard
 * deck, and the page inside reflows from one column to two to three, staggered down
 * from the hero. The read-out in the corner counts the viewport width the device stands for.
 */
(() => {
  const tile = document.querySelector("[data-unfold]");
  if (!tile || !window.HL) return;
  const host = tile.querySelector("[data-hairline]"), readout = tile.querySelector("[data-unfold-px]");
  const {
    Cam, clamp, facing, fit, lerp, open, poly, prism, proj, rad, rings, rrect, seg,
    bezier, reducedMotion, tween, tset, tval, tdone, mk, put, register, solid, flatDot, place, inject,
  } = HL;

  const WMIN = 84, WMAX = 210, H = 150, CX = 105, TOP = 22, BOT = 19, BZ = 5, GAP = 4, N = 6, T = 4;
  const DMAX = 128, LEAN = 22, HL_ = 126, STAGGER = 40;
  const px = (w) => Math.round(390 + ((w - WMIN) / (WMAX - WMIN)) * 890);
  const colsAt = (w) => (px(w) < 600 ? 1 : px(w) < 1000 ? 2 : 3);
  const smooth = (t) => t * t * (3 - 2 * t);

  /** Where card i sits at `cols` columns: [left, width] as shares of the screen, [top, height] in units. */
  function layout(i, cols) {
    if (i === 0) return [0, 1, H - TOP, 28];
    const k = i - 1, rows = Math.ceil((N - 1) / cols), avail = H - TOP - BOT - 28 - GAP;
    const ch = Math.min(32, (avail - (rows - 1) * GAP) / rows), row = Math.floor(k / cols);
    return [(k % cols) / cols, 1 / cols, H - TOP - 28 - GAP - row * (ch + GAP), ch];
  }

  inject(document);
  const C = Cam(30, 0.5, 1.2);
  const extent = [[-6, -4, 0], [WMAX + 6, DMAX, 0], [-6, DMAX, 0], [WMAX + 6, -4, 0], [0, -4, H + 4], [WMAX, -50, HL_]];
  fit(C, extent, 200, 160);
  const P = proj(C), front = facing(C);

  // crop the viewBox to the most extreme poses, so the device fills the tile instead of the 400 × 320 plate
  const ex = extent.map((p) => P(p[0], p[1], p[2])), pad = 6;
  const vx = Math.min(...ex.map((q) => q[0])) - pad, vy = Math.min(...ex.map((q) => q[1])) - pad;
  const vw = Math.max(...ex.map((q) => q[0])) + pad - vx, vh = Math.max(...ex.map((q) => q[1])) + pad - vy;
  const svg = mk("svg", { viewBox: [vx, vy, vw, vh].map(Math.round).join(" "), "aria-hidden": "true" }, host);

  const g = mk("g", {}, svg);
  const back = mk("path", { class: "lo" }, g), face = mk("path", { class: "sil" }, g);
  const screen = mk("path", { class: "nf lo" }, g), slit = mk("path", { class: "nf" }, g);
  const cam = flatDot(g, C, 0.8, "dot off");
  const cards = [];
  for (let i = 0; i < N; i++) {
    const [fx, fw, top, h] = layout(i, 1);
    cards.push({ el: mk("path", { class: "nf lo" }, g), fx: tween(fx), fw: tween(fw), top: tween(top), h: tween(h) });
  }
  // the dock that becomes the deck, its keyboard and trackpad
  const deck = solid(g), keys = mk("path", { class: "nf lo" }, g), trackpad = mk("path", { class: "nf lo" }, g);

  // the width runs on one eased curve, soft at both ends, so the lid opens in a single motion;
  // a shorter trip (folding back from halfway) takes proportionally less time
  const OPEN = 1300, easeW = bezier(0.45, 0, 0.15, 1);
  const W = { x: WMIN, from: WMIN, to: WMIN, t0: 0, dur: OPEN };
  const stepW = (now) => {
    const p = reducedMotion() ? 1 : clamp((now - W.t0) / W.dur, 0, 1);
    W.x = lerp(W.from, W.to, easeW(p));
    return p < 1;
  };
  let cols = 1, drawnW = NaN, shown = NaN;
  const draw = (now) => {
    const w = W.x, t = smooth(clamp((w - WMIN) / (WMAX - WMIN), 0, 1)), x0 = CX - w / 2;
    const th = rad(LEAN * t), sn = Math.sin(th), cs = Math.cos(th);
    const D = lerp(8, DMAX, t), hb = lerp(7, 4, t), zh = lerp(0, hb - 1, t), Hc = lerp(H, HL_, t), sv = Hc / H;
    // a point on the screen's plane, leaning back about its hinge; off is along its normal
    const at = (u, v, off = 0) => P(x0 + u, -v * sn + off * cs, zh + v * cs + off * sn);
    const ring = (u0, v0, u1, v1, r, off) => rrect(u0, v0, u1, v1, r, 5).map((q) => at(q.u, q.v, off));
    if (w !== drawnW) {
      drawnW = w;
      const r = lerp(13, 7, t), phone = t < 0.3;
      back.setAttribute("d", poly(ring(0, 0, w, Hc, r, -lerp(T, 2.5, t))));
      face.setAttribute("d", poly(ring(0, 0, w, Hc, r, 0)));
      screen.setAttribute("d", poly(ring(BZ, lerp(BZ, 8, t), w - BZ, Hc - BZ, Math.max(2, r - 4), 0)));
      slit.setAttribute("d", phone ? open([at(w / 2 - 8, H - 9.5), at(w / 2 + 8, H - 9.5)]) : "");
      place(cam, at(phone ? w / 2 + 14 : w / 2, Hc - (phone ? 9.5 : 2.6)));
      const [dr, di] = rings(x0 - lerp(6, 0, t), 0.5, x0 + w + lerp(6, 0, t), D, lerp(3, 7, t), 1);
      put(deck, prism(P, front, dr, di, 0, hb));
      if (D > 40) {
        // a keyboard of five rows, and a trackpad centred below it
        const k0 = x0 + 15, k1 = x0 + w - 15, ky0 = 10, ky1 = D * 0.5, kz = hb;
        keys.setAttribute("d", poly(rrect(k0, ky0, k1, ky1, 2.5, 4).map((q) => P(q.u, q.v, kz))) +
          [1, 2, 3, 4].map((j) => seg(P(k0 + 2, lerp(ky0, ky1, j / 5), kz), P(k1 - 2, lerp(ky0, ky1, j / 5), kz))).join(""));
        trackpad.setAttribute("d", poly(rrect(CX - w * 0.2, D * 0.58, CX + w * 0.2, D * 0.9, 4, 4).map((q) => P(q.u, q.v, kz))));
      } else { keys.setAttribute("d", ""); trackpad.setAttribute("d", ""); }
      const p = px(w);
      if (readout && p !== shown) { shown = p; readout.textContent = p + " px"; }
    }
    const iw = w - 2 * BZ - 2 * GAP, u0 = BZ + GAP;
    cards.forEach((c) => {
      const fx = tval(c.fx, now), fw = tval(c.fw, now), top = tval(c.top, now), h = tval(c.h, now);
      const a = u0 + fx * iw + GAP / 2, b = u0 + (fx + fw) * iw - GAP / 2;
      c.el.setAttribute("d", poly(ring(a, (top - h) * sv, b, top * sv, 2.5, 0)));
    });
  };

  const B = register(tile, (dt, now) => {
    const m = stepW(now);
    // the page reflows as the screen actually passes each breakpoint, not when the target is set
    const c = colsAt(W.x);
    if (c !== cols) {
      cols = c;
      cards.forEach((cd, i) => {
        const [fx, fw, top, h] = layout(i, cols), d = i * STAGGER;
        tset(cd.fx, fx, now, d); tset(cd.fw, fw, now, d); tset(cd.top, top, now, d); tset(cd.h, h, now, d);
      });
    }
    draw(now);
    return m || cards.some((cd) => !tdone(cd.fx, now) || !tdone(cd.top, now) || !tdone(cd.h, now) || !tdone(cd.fw, now));
  });

  // one play per hover: phone → laptop in a single motion; leaving folds it back to the phone.
  // A tap (no hover on touch) plays it the same way and folds back on its own.
  const TAP_HOLD = 2600;
  let foldLater = 0;
  function setWidth(w) {
    clearTimeout(foldLater);
    W.from = W.x;
    W.to = w;
    W.t0 = performance.now();
    W.dur = Math.max(300, OPEN * Math.abs(w - W.x) / (WMAX - WMIN));
    cards[0].el.classList.toggle("hi", w === WMIN);
    face.classList.toggle("hi", w !== WMIN);
    B.wake();
  }
  tile.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") setWidth(WMAX); });
  tile.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") setWidth(WMIN); });
  tile.addEventListener("pointerup", (e) => {
    if (e.pointerType === "mouse" || W.to !== WMIN) return;
    setWidth(WMAX);
    foldLater = setTimeout(() => setWidth(WMIN), OPEN + TAP_HOLD);
  });
  setWidth(WMIN);
})();
