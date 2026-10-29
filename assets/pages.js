/*
 * Pages: the figure in the „Až 5 podstránek“ tile, drawn with HL (hairline-kernel.js).
 * Five pages of one website standing in a cascade, home at the front, each told apart
 * by its layout: a hero, an about with a portrait, a grid of services, a gallery, a
 * contact form. Hovering the tile plays it once: the stack fans out in one smooth
 * motion, front to back, so every page shows itself; leaving gathers it again.
 * The read-out in the corner counts the pages as they come out, 1 / 5 to 5 / 5.
 */
(() => {
  const tile = document.querySelector("[data-pages]");
  if (!tile || !window.HL) return;
  const host = tile.querySelector("[data-hairline]"), readout = tile.querySelector("[data-pages-count]");
  const { Cam, bezier, clamp, fit, lerp, open, poly, proj, reducedMotion, rrect, seg, mk, register, flatDot, place, inject } = HL;

  const N = 5, PW = 112, PH = 82, G = 16, DX = 12, ZS = [0, 13, 24, 33, 40], TH = 2.4, BAR = 11;
  // how far the fan spreads each step back: sideways and up, in world units
  const FAN_X = 14, FAN_Z = 15;

  /** Each page's content, as rounded boxes [u0, v0, u1, v1] and rules [u0, v, u1] in its own plane. */
  function content(i) {
    const top = PH - BAR - 6, L = 8, R = PW - 8;
    if (i === 0) return { box: [[L, top - 30, R, top], ...[0, 1, 2].map((k) => [L + k * 33, 8, L + k * 33 + 29, top - 36])], rule: [] };
    if (i === 1) return { box: [[L, 10, L + 38, top]], rule: [0, 1, 2, 3, 4].map((k) => [L + 46, top - 6 - k * 10, R - (k === 4 ? 26 : 0)]) };
    if (i === 2) return { box: [0, 1].flatMap((r) => [0, 1, 2].map((k) => [L + k * 33, top - 27 - r * 29, L + k * 33 + 29, top - r * 29])), rule: [] };
    if (i === 3) return { box: [[L, top - 30, L + 46, top], [L + 50, top - 30, R, top], [L, 8, L + 30, top - 34], [L + 34, 8, L + 64, top - 34], [L + 68, 8, R, top - 34]], rule: [] };
    return { box: [[L, top - 11, R, top], [L, top - 26, R, top - 15], [L, top - 47, R, top - 30], [R - 30, 8, R, top - 52]], rule: [] };
  }

  inject(document);
  const C = Cam(30, 0.5, 1.72);
  const pos = (i, f) => [i * (DX + FAN_X * f), -i * G, ZS[i] + i * FAN_Z * f];
  const ext = [];
  for (let i = 0; i < N; i++) for (const f of [0, 1]) {
    const [x, y, z] = pos(i, f);
    ext.push([x, y, z], [x + PW, y, z], [x, y, z + PH], [x + PW, y, z + PH], [x, y - TH, z], [x + PW, y - TH, z + PH]);
  }
  fit(C, ext, 200, 160);
  const P = proj(C);

  // crop the viewBox to the stack, closed and fanned, so it fills the tile instead of the 400 × 320 plate
  const ex = ext.map((p) => P(p[0], p[1], p[2])), pad = 6;
  const vx = Math.min(...ex.map((q) => q[0])) - pad, vy = Math.min(...ex.map((q) => q[1])) - pad;
  const vw = Math.max(...ex.map((q) => q[0])) + pad - vx, vh = Math.max(...ex.map((q) => q[1])) + pad - vy;
  const svg = mk("svg", { viewBox: [vx, vy, vw, vh].map(Math.round).join(" "), "aria-hidden": "true" }, host);

  // painted back to front, so a nearer page covers a farther one
  const g = mk("g", {}, svg), pages = [];
  for (let i = N - 1; i >= 0; i--) {
    const grp = mk("g", {}, g), c = content(i);
    pages[i] = {
      back: mk("path", { class: "lo" }, grp), face: mk("path", { class: "sil" }, grp),
      bar: mk("path", { class: "nf lo" }, grp), boxes: mk("path", { class: "nf lo" }, grp),
      dots: [0, 1, 2].map((k) => flatDot(grp, C, 0.75, k === 0 ? "dot m" : "dot off")),
      c, f: 0, from: 0, to: 0, t0: 0, dur: 1, drawn: NaN,
    };
  }

  function draw(i, f) {
    const p = pages[i];
    if (f === p.drawn) return;
    p.drawn = f;
    const [x, y, z] = pos(i, f);
    const at = (u, v, off = 0) => P(x + u, y - off, z + v);
    const box = (b, r, off = 0) => poly(rrect(b[0], b[1], b[2], b[3], r, 4).map((q) => at(q.u, q.v, off)));
    p.back.setAttribute("d", box([0, 0, PW, PH], 5, TH));
    p.face.setAttribute("d", box([0, 0, PW, PH], 5));
    p.bar.setAttribute("d", seg(at(3, PH - BAR), at(PW - 3, PH - BAR)) + open([at(34, PH - BAR / 2), at(PW - 14, PH - BAR / 2)]));
    p.boxes.setAttribute("d", p.c.box.map((b) => box(b, 2)).join("") + p.c.rule.map((r) => seg(at(r[0], r[1]), at(r[2], r[1]))).join(""));
    p.dots.forEach((d, k) => place(d, at(8 + k * 6, PH - BAR / 2)));
  }

  // each page runs on the same soft curve as the laptop, one after another, so the fan opens as one motion
  const OPEN = 1100, STAGGER = 90, ease = bezier(0.45, 0, 0.15, 1);
  let count = 0;
  const B = register(tile, (_dt, now) => {
    let moving = false;
    pages.forEach((p, i) => {
      const k = reducedMotion() ? 1 : clamp((now - p.t0) / p.dur, 0, 1);
      p.f = lerp(p.from, p.to, ease(k));
      if (k < 1) moving = true;
      draw(i, p.f);
    });
    // a page counts once it is halfway out; the highlight rides on the newest one
    const n = 1 + pages.filter((p, i) => i > 0 && p.f > 0.5).length;
    if (n !== count) {
      count = n;
      pages.forEach((p, i) => p.face.classList.toggle("hi", i === n - 1));
      if (readout) readout.textContent = n + " / " + N;
    }
    return moving;
  });

  // one play per hover: the stack fans out front to back; leaving gathers it back to front.
  // A tap (no hover on touch) plays it the same way and gathers on its own.
  const TAP_HOLD = 2600;
  let gatherLater = 0;
  function setFan(to) {
    clearTimeout(gatherLater);
    const now = performance.now();
    pages.forEach((p, i) => {
      if (i === 0) return;
      p.from = p.f;
      p.to = to;
      p.t0 = now + (to ? i - 1 : N - 1 - i) * STAGGER;
      p.dur = Math.max(250, OPEN * Math.abs(to - p.f));
    });
    B.wake();
  }
  // below sm the figure is hidden (the tile stays icon + text, as on mobile before), so it never plays there
  const wide = matchMedia("(min-width: 640px)");
  tile.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && wide.matches) setFan(1); });
  tile.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") setFan(0); });
  tile.addEventListener("pointerup", (e) => {
    if (e.pointerType === "mouse" || !wide.matches || pages[1].to !== 0) return;
    setFan(1);
    gatherLater = setTimeout(() => setFan(0), OPEN + (N - 2) * STAGGER + TAP_HOLD);
  });
})();
