/*
 * Drawers: the figure in the „a další možnosti“ tile, drawn with HL (hairline-kernel.js).
 * A cabinet of four drawers, one feature each: a blog, a gallery, booking, a shop.
 * Only what stands out of the cabinet is drawn. At rest the gallery is half out and
 * bright. Hovering the tile plays it once: a wave runs down the cabinet, each drawer
 * sliding out to show what it holds (ruled sheets, photo tiles, a calendar of dots,
 * parcels) and back as the next one comes, and the last one stays out; leaving
 * settles the cabinet back to rest.
 */
(() => {
  const tile = document.querySelector("[data-drawers]");
  if (!tile || !window.HL) return;
  const host = tile.querySelector("[data-hairline]");
  const { Cam, bezier, clamp, facing, fillet, fit, lerp, poly, prism, proj, reducedMotion, rings, rrect, seg, mk, put, register, solid, inject } = HL;

  const D = 58, HW = 42, N = 4, Z0 = 7, DH = 20, PITCH = 24, OUT = 42, REST = [0, 0, 22, 0], DW = 35, HOME = 2;
  const zb = (k) => Z0 + k * PITCH;

  inject(document);
  const C = Cam(60, 0.5, 1.86);
  const top = zb(N - 1) + DH + 7;
  fit(C, [[0, -HW, 0], [D + OUT, -HW, 0], [D + OUT, HW, 0], [0, HW, top], [D + OUT, HW, top - 7]], 200, 166);
  const P = proj(C), front = facing(C);
  const svg = mk("svg", { "aria-hidden": "true" }, host);
  const g = mk("g", {}, svg);

  // the cabinet, with a slot framed in its face for each drawer
  { const [r, i] = rings(0, -HW, D, HW, 7, 1.6); put(solid(g), prism(P, front, r, i, 0, top)); }
  const onFace = (x, y0, z0, y1, z1, rr) => poly(rrect(y0, z0, y1, z1, rr, 4).map((q) => P(x, q.u, q.v)));
  mk("path", { d: [...Array(N).keys()].map((k) => onFace(D, -DW - 2, zb(k) - 2, DW + 2, zb(k) + DH + 2, 3)).join(""), class: "nf lo" }, g);

  // bottom to top: shop, booking, gallery, blog
  const dr = [];
  for (let k = 0; k < N; k++) {
    const grp = mk("g", {}, g);
    dr.push({ k, box: solid(grp), stuff: mk("path", { class: "nf lo" }, grp), handle: mk("path", { class: "nf" }, grp), out: REST[k], from: REST[k], drawn: NaN });
  }

  /** What each drawer holds, laid on its floor, kept to the part that stands out. */
  function stuff(k, x0, x1, z) {
    const at = (x, y) => P(x, y, z), rr = (a, b, c, d, r) => poly(rrect(a, b, c, d, r, 4).map((q) => at(q.u, q.v)));
    const fits = (a) => a >= x0 + 2 && a <= x1 - 4;
    if (k === 3) return [6, 14, 22, 30].filter((d) => fits(x1 - d)).map((d) => seg(at(x1 - d, -26), at(x1 - d, d === 30 ? 6 : 26))).join("");
    if (k === 2) return [[-30, -8], [-4, 16], [20, 30]].map(([a, b]) => (fits(x1 - 20) ? rr(x1 - 20, a, x1 - 5, b, 2) : "")).join("");
    if (k === 0) return [[-28, -6], [2, 24]].map(([a, b]) => (fits(x1 - 28) ? rr(x1 - 28, a, x1 - 6, b, 2.5) + seg(at(x1 - 17, a), at(x1 - 17, b)) : "")).join("");
    // booking: a calendar, three weeks of small round days
    let cal = "";
    for (let j = 0; j < 15; j++) { const x = x1 - 7 - Math.floor(j / 5) * 8, y = -24 + (j % 5) * 12; if (fits(x)) cal += rr(x - 2, y - 2, x + 2, y + 2, 2); }
    return cal;
  }

  function draw(d, out) {
    if (out === d.drawn) return;
    d.drawn = out;
    const z0 = zb(d.k), z1 = z0 + DH, x1 = D + out;
    if (out > 1) { const [r, i] = rings(D, -DW, x1, DW, 2.5, 1); put(d.box, prism(P, front, r, i, z0, z1)); }
    else put(d.box, { sil: onFace(D, -DW, z0, DW, z1, 3), crease: "" });
    // the knob: a plus, for more
    const zc = z0 + DH / 2, A = 6, Wd = 1.9;
    const cross = [[-Wd, -A], [Wd, -A], [Wd, -Wd], [A, -Wd], [A, Wd], [Wd, Wd], [Wd, A], [-Wd, A], [-Wd, Wd], [-A, Wd], [-A, -Wd], [-Wd, -Wd]];
    d.handle.setAttribute("d", poly(fillet(cross, cross.map((_, j) => (j % 3 === 2 ? 0.5 : 1.2)), 3).map(([y, z]) => P(x1, y, zc + z))));
    d.stuff.setAttribute("d", out > 14 ? stuff(d.k, D, x1, z1) : "");
  }

  // the wave: top drawer first, each one out and back on the same soft curve as the other
  // tiles' figures, overlapping the next so it reads as one motion; the last one stays out
  const ease = bezier(0.45, 0, 0.15, 1), GAP = 420, SWING = 1000, SETTLE = 500;
  const order = [3, 2, 1, 0];
  const bump = (p) => (p <= 0 || p >= 1 ? 0 : p < 0.5 ? ease(p * 2) : 1 - ease((p - 0.5) * 2));
  let mode = "rest", t0 = -1e9;
  const B = register(tile, (_dt, now) => {
    const e = reducedMotion() ? 1e9 : now - t0;
    let moving;
    if (mode === "play") {
      // what was out before the wave tucks itself away as the wave starts
      const fade = 1 - ease(clamp(e / SETTLE, 0, 1));
      order.forEach((k, j) => {
        const p = (e - j * GAP) / SWING, last = j === N - 1;
        const wave = OUT * (last ? ease(clamp(p * 2, 0, 1)) : bump(p));
        dr[k].out = Math.max(dr[k].from * fade, wave);
      });
      moving = e < (N - 1) * GAP + SWING / 2;
    } else {
      const k = ease(clamp(e / SETTLE, 0, 1));
      dr.forEach((d) => { d.out = lerp(d.from, REST[d.k], k); });
      moving = e < SETTLE;
    }
    dr.forEach((d) => draw(d, d.out));
    // the bright stroke rides on the drawer furthest out
    const lead = dr.reduce((a, b) => (b.out > a.out + 0.01 ? b : a), dr[HOME]);
    dr.forEach((d) => d.box.sil.classList.toggle("hi", d === lead));
    return moving;
  });
  // frame what is drawn, at rest and with every drawer fully out, so the cabinet sits centred in the tile (hairline-frame.js)
  frameView(svg, [() => dr.forEach((d) => draw(d, OUT)), () => dr.forEach((d) => draw(d, REST[d.k]))], 8);

  function setMode(m) {
    mode = m;
    t0 = performance.now();
    dr.forEach((d) => { d.from = d.out; });
    B.wake();
  }

  // one play per hover; leaving settles it back. A tap (no hover on touch) plays it the same way and settles on its own.
  // Below sm the figure is hidden (the tile stays icon + text, as on mobile before), so it never plays there.
  const TAP_HOLD = 2600, wide = matchMedia("(min-width: 640px)");
  let settleLater = 0;
  tile.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && wide.matches) { clearTimeout(settleLater); setMode("play"); } });
  tile.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") { clearTimeout(settleLater); setMode("rest"); } });
  tile.addEventListener("pointerup", (e) => {
    if (e.pointerType === "mouse" || !wide.matches || mode === "play") return;
    setMode("play");
    settleLater = setTimeout(() => setMode("rest"), (N - 1) * GAP + SWING + TAP_HOLD);
  });
})();
