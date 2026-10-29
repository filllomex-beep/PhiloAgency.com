/*
 * Plug: the figure in the „Připojení domény“ tile, drawn with HL (hairline-kernel.js).
 * A socket block with a website on its lid, and a plug on a cable, the domain,
 * standing off from it, its prongs bright. Hovering the tile plays it once: the plug
 * slides home in one smooth motion and, as it seats, the website's frame takes the
 * bright stroke; leaving pulls it back out. The read-out says offline / online.
 */
(() => {
  const tile = document.querySelector("[data-plug]");
  if (!tile || !window.HL) return;
  const host = tile.querySelector("[data-hairline]"), readout = tile.querySelector("[data-plug-state]");
  const {
    Cam, bezier, clamp, facing, fit, lerp, open, poly, prism, proj, reducedMotion, rings, rrect, seg,
    mk, put, register, solid, inject,
  } = HL;

  const SX = 64, SW = 50, SH = 38, PL = 28, PR = 12, GMAX = 40, REST = 24, BZ0 = 7, BZ1 = 31;
  const TAIL = [SX + 62, 62, 0];

  inject(document);
  const C = Cam(45, 0.5, 2.05);
  const extent = [[0, -SW / 2, 0], [SX, SW / 2, 0], [SX + REST + PL + 30, -14, 0], [SX + REST + PL + 30, 14, BZ1], [0, -SW / 2, SH], TAIL];
  fit(C, extent, 200, 166);
  const P = proj(C), front = facing(C);

  // crop the viewBox to the socket, the plug at rest and its cable, so it fills the tile
  const ex = extent.map((p) => P(p[0], p[1], p[2])), pad = 8;
  const vx = Math.min(...ex.map((q) => q[0])) - pad, vy = Math.min(...ex.map((q) => q[1])) - pad;
  const vw = Math.max(...ex.map((q) => q[0])) + pad - vx, vh = Math.max(...ex.map((q) => q[1])) + pad - vy;
  const svg = mk("svg", { viewBox: [vx, vy, vw, vh].map(Math.round).join(" "), "aria-hidden": "true" }, host);
  const g = mk("g", {}, svg);

  // the socket: a rounded block, two holes in its near face, a website on its lid
  { const [r, i] = rings(0, -SW / 2, SX, SW / 2, 9, 1.6); put(solid(g), prism(P, front, r, i, 0, SH)); }
  const onFace = (y0, z0, y1, z1, rr) => poly(rrect(y0, z0, y1, z1, rr, 4).map((q) => P(SX, q.u, q.v)));
  mk("path", { d: onFace(-15, 9, 15, 29, 6), class: "nf lo" }, g);
  mk("path", { d: onFace(-8.6, 16.5, -5.4, 20.5, 1) + onFace(5.4, 16.5, 8.6, 20.5, 1), class: "nf" }, g);
  const lid = (u0, v0, u1, v1, rr) => poly(rrect(u0, v0, u1, v1, rr, 4).map((q) => P(q.u, q.v, SH)));
  const site = mk("path", { d: lid(8, -18, SX - 8, 18, 3), class: "nf" }, g);
  mk("path", { d: seg(P(16, -18, SH), P(16, 18, SH)) + lid(22, -14, SX - 12, -2, 1.5) + lid(22, 2, 40, 14, 1.5) + lid(44, 2, SX - 12, 14, 1.5), class: "nf lo" }, g);

  // the plug: two prongs, a body with grip ridges, and its cable
  const prongs = [solid(g), solid(g)], body = solid(g), grip = mk("path", { class: "nf lo" }, g), cable = mk("path", { class: "nf" }, g);

  // the gap runs on the same soft curve as the other tiles' figures
  const ease = bezier(0.45, 0, 0.15, 1), SLIDE = 950;
  const gap = { v: REST, from: REST, to: REST, t0: 0, dur: 1 };
  let drawn = NaN, live = null;
  function draw() {
    const gx = gap.v;
    if (gx === drawn) return;
    drawn = gx;
    // the prongs show only where they stand out of the socket
    const px = SX + gx, x0 = Math.max(SX, px - PR);
    [-7, 7].forEach((yc, k) => {
      if (px - x0 < 0.6) { put(prongs[k], { sil: "", crease: "" }); return; }
      const [r, i] = rings(x0, yc - 1.5, px, yc + 1.5, 0.3, 0.2); put(prongs[k], prism(P, front, r, i, 17, 20));
    });
    { const [r, i] = rings(px, -12, px + PL, 12, 5, 1.2); put(body, prism(P, front, r, i, BZ0, BZ1)); }
    grip.setAttribute("d", [0.45, 0.6, 0.75].map((f) => seg(P(px + PL * f, -9, BZ1), P(px + PL * f, 9, BZ1))).join(""));
    const a = [px + PL, 0, 19], b = [px + PL + 34, 0, 19], c = [TAIL[0] + 40, TAIL[1] - 30, 0], d = TAIL, pts = [];
    for (let s = 0; s <= 24; s++) {
      const t = s / 24, u = 1 - t;
      pts.push(P(...[0, 1, 2].map((k) => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k])));
    }
    cable.setAttribute("d", open(pts));
    // it clicks home only once seated: then the site is live and the prongs give up the highlight
    const on = gx < 0.5;
    if (on !== live) {
      live = on;
      site.classList.toggle("hi", on);
      prongs.forEach((p) => p.sil.classList.toggle("hi", !on));
      if (readout) readout.textContent = on ? "online" : "offline";
    }
  }

  const B = register(tile, (_dt, now) => {
    const k = reducedMotion() ? 1 : clamp((now - gap.t0) / gap.dur, 0, 1);
    gap.v = lerp(gap.from, gap.to, ease(k));
    draw();
    return k < 1;
  });

  function setGap(to) {
    clearTimeout(pullLater);
    gap.from = gap.v;
    gap.to = to;
    gap.t0 = performance.now();
    gap.dur = Math.max(300, SLIDE * Math.abs(to - gap.v) / REST);
    B.wake();
  }

  // one play per hover: the plug slides home; leaving pulls it back out.
  // A tap (no hover on touch) plays it the same way and pulls out on its own.
  // Below sm the figure is hidden (the tile stays icon + text, as on mobile before), so it never plays there.
  const TAP_HOLD = 2600, wide = matchMedia("(min-width: 640px)");
  let pullLater = 0;
  tile.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && wide.matches) setGap(0); });
  tile.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") setGap(REST); });
  tile.addEventListener("pointerup", (e) => {
    if (e.pointerType === "mouse" || !wide.matches || gap.to !== REST) return;
    setGap(0);
    pullLater = setTimeout(() => setGap(REST), SLIDE + TAP_HOLD);
  });
})();
