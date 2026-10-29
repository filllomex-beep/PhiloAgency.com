/*
 * Rank: the figure in the „Základní SEO“ tile, drawn with HL (hairline-kernel.js).
 * A search box and five results lying under it, one of them the site, raised and
 * bright, in fourth place at rest. Hovering the tile plays it once: the site climbs
 * to first place in one smooth motion while the results it passes step down one
 * place, staggered; leaving lets it sink back. The read-out counts its place, #4 to #1.
 * Every result stands as a block from the ground, a step lower each place down.
 */
(() => {
  const tile = document.querySelector("[data-rank]");
  if (!tile || !window.HL) return;
  const host = tile.querySelector("[data-hairline]"), readout = tile.querySelector("[data-rank-place]");
  const {
    Cam, bezier, clamp, facing, fit, lerp, poly, prism, proj, reducedMotion, rings, seg,
    mk, put, register, solid, flatDot, place, inject,
  } = HL;

  const N = 5, L = 116, D = 25, STEP = 31, Y0 = 10, ME = 3, UP = 6, TK = 3.5;
  const SB = (N - 1) * 3 + TK + 2;
  const rowY = (r) => Y0 + r * STEP, rowZ = (r) => (N - 1 - r) * 3;

  inject(document);
  const C = Cam(45, 0.5, 1.7);
  const extent = [[-8, -30, 0], [L + 8, -30, 0], [-8, rowY(N - 1) + D + 6, 0], [L + 8, rowY(N - 1) + D + 6, 0],
    [0, 0, rowZ(0) + UP + TK + 4], [0, -27, SB], [L, -27, SB]];
  fit(C, extent, 200, 166);
  const P = proj(C), front = facing(C);

  // crop the viewBox to the list and its search box, so it fills the tile instead of the 400 × 320 plate
  const ex = extent.map((p) => P(p[0], p[1], p[2])), pad = 6;
  const vx = Math.min(...ex.map((q) => q[0])) - pad, vy = Math.min(...ex.map((q) => q[1])) - pad;
  const vw = Math.max(...ex.map((q) => q[0])) + pad - vx, vh = Math.max(...ex.map((q) => q[1])) + pad - vy;
  const svg = mk("svg", { viewBox: [vx, vy, vw, vh].map(Math.round).join(" "), "aria-hidden": "true" }, host);
  const g = mk("g", {}, svg);

  // the search box: a pill with a lens set into its top, a caret after it and a round button
  { const [r, i] = rings(0, -27, L, -5, 11, 1.4); put(solid(g), prism(P, front, r, i, 0, SB)); }
  const flat = (cx, cy, rad) => { const q = []; for (let k = 0; k < 28; k++) { const t = (k / 28) * Math.PI * 2; q.push(P(cx + rad * Math.cos(t), cy + rad * Math.sin(t), SB)); } return poly(q); };
  mk("path", { d: flat(13, -17, 5) + seg(P(18.4, -17, SB), P(24, -17, SB)), class: "nf" }, g);
  mk("path", { d: seg(P(31, -21, SB), P(31, -13, SB)), class: "nf lo" }, g);
  mk("path", { d: flat(L - 12, -16, 6), class: "nf lo" }, g);

  // where each result sits runs on the same soft curve as the other tiles' figures
  const ease = bezier(0.45, 0, 0.15, 1), CLIMB = 1100, SHIFT = 700, STAGGER = 70;
  const tw = (v) => ({ v, from: v, to: v, t0: 0, dur: 1 });
  const go = (t, to, now, delay, dur) => { t.from = t.v; t.to = to; t.t0 = now + delay; t.dur = dur; };
  const step = (t, now) => {
    const k = reducedMotion() ? 1 : clamp((now - t.t0) / t.dur, 0, 1);
    t.v = lerp(t.from, t.to, ease(k));
    return k < 1;
  };

  // the results: a plate each, with a favicon, a title and two lines of snippet
  const res = [];
  for (let k = 0; k < N; k++) {
    const grp = mk("g", {}, g), el = solid(grp);
    res.push({
      k, grp, el, lines: mk("path", { class: "nf lo" }, grp), title: mk("path", { class: "nf" }, grp),
      fav: flatDot(grp, C, 1.3, k === ME ? "dot" : "dot off"), y: tw(rowY(k)), z: tw(rowZ(k) + (k === ME ? UP : 0)), drawn: "",
    });
  }
  res[ME].el.sil.classList.add("hi");

  function draw(r, y, z) {
    const key = y.toFixed(2) + "," + z.toFixed(2);
    if (key === r.drawn) return;
    r.drawn = key;
    const [ring, inner] = rings(0, y, L, y + D, 5, 1.2), t = z + TK;
    put(r.el, prism(P, front, ring, inner, 0, t));
    place(r.fav, P(10, y + 8, t));
    const w = r.k === ME ? 58 : 40 + ((r.k * 17) % 28);
    r.title.setAttribute("d", seg(P(18, y + 8, t), P(18 + w, y + 8, t)));
    r.lines.setAttribute("d", seg(P(8, y + 14.5, t), P(L - 14, y + 14.5, t)) + seg(P(8, y + 19, t), P(L - 36 - r.k * 6, y + 19, t)));
  }

  let order = [], shown = 0;
  const B = register(tile, (_dt, now) => {
    let m = false;
    res.forEach((r) => { if (step(r.y, now)) m = true; if (step(r.z, now)) m = true; draw(r, r.y.v, r.z.v); });
    // keep paint order far to near as rows pass each other; the raised site stays above its neighbours
    const by = res.slice().sort((a, b) => a.y.v + (a.k === ME ? 6 : 0) - (b.y.v + (b.k === ME ? 6 : 0)));
    if (by.some((r, i) => order[i] !== r)) { by.forEach((r) => g.appendChild(r.grp)); order = by; }
    const n = clamp(Math.round((res[ME].y.v - Y0) / STEP), 0, N - 1) + 1;
    if (readout && n !== shown) { shown = n; readout.textContent = "#" + n; }
    return m;
  });

  // the site's place, and the others keep their order around it, each shifting out from the place it takes
  function setRank(want) {
    const now = performance.now();
    const others = res.filter((r) => r.k !== ME);
    const slots = [...Array(N).keys()].filter((s) => s !== want);
    others.forEach((r, i) => {
      if (r.y.to === rowY(slots[i])) return;
      const d = Math.abs(slots[i] - want) * STAGGER;
      go(r.y, rowY(slots[i]), now, d, SHIFT); go(r.z, rowZ(slots[i]), now, d, SHIFT);
    });
    const dur = Math.max(300, CLIMB * Math.abs(rowY(want) - res[ME].y.v) / (rowY(ME) - rowY(0)));
    go(res[ME].y, rowY(want), now, 0, dur); go(res[ME].z, rowZ(want) + UP, now, 0, dur);
    B.wake();
  }

  // one play per hover: the site climbs to first place; leaving lets it sink back to fourth.
  // A tap (no hover on touch) plays it the same way and sinks back on its own.
  // Below sm the figure is hidden (the tile stays icon + text, as on mobile before), so it never plays there.
  const TAP_HOLD = 2600, wide = matchMedia("(min-width: 640px)");
  let sinkLater = 0;
  const climb = () => { clearTimeout(sinkLater); setRank(0); };
  const sink = () => { clearTimeout(sinkLater); setRank(ME); };
  tile.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && wide.matches) climb(); });
  tile.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") sink(); });
  tile.addEventListener("pointerup", (e) => {
    if (e.pointerType === "mouse" || !wide.matches || res[ME].y.to !== rowY(ME)) return;
    climb();
    sinkLater = setTimeout(sink, CLIMB + TAP_HOLD);
  });
})();
