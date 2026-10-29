/*
 * Form: the figure in the „Kontaktní formulář“ tile, drawn with HL (hairline-kernel.js).
 * A contact form standing up, turned to the viewer: a name, an email, a message and a
 * send button in relief, with labels, a grip in the message's corner and a consent box.
 * At rest the name is filled and a caret waits in the email. Hovering the tile plays
 * it once: the email and the message fill line by line, then the button presses in,
 * bright, and the consent box is ticked; leaving clears it back to rest.
 */
(() => {
  const tile = document.querySelector("[data-form]");
  if (!tile || !window.HL) return;
  const host = tile.querySelector("[data-hairline]");
  const { Cam, bezier, clamp, fit, hull, lerp, open, poly, proj, reducedMotion, rrect, seg, mk, register, inject } = HL;

  const W = 120, H = 178, T = 3, BTN = [64, 10, 110, 28], BOX = [10, 15, 19, 24];
  // fields: [u0, v0, u1, v1, lines of text as shares of the width]
  const F = [
    [10, 125, 110, 139, [0.46]],
    [10, 94, 110, 108, [0.62]],
    [10, 44, 110, 76, [0.86, 0.9, 0.5]],
  ];

  inject(document);
  const C = Cam(30, 0.5, 1.56);
  fit(C, [[0, -T, 0], [W, -T, 0], [0, 6, 0], [W, 6, H], [0, -T, H]], 200, 160);
  const P = proj(C);
  const at = (u, v, y = 0) => P(u, y, v);
  const box = (u0, v0, u1, v1, r, y = 0) => rrect(u0, v0, u1, v1, r, 4).map((q) => at(q.u, q.v, y));

  const svg = mk("svg", { "aria-hidden": "true" }, host);
  const g = mk("g", {}, svg);
  mk("path", { d: poly(box(0, 0, W, H, 8, -T)), class: "lo" }, g);
  mk("path", { d: poly(box(0, 0, W, H, 8)), class: "sil" }, g);
  // a heading: one strong rule and one dim one
  mk("path", { d: seg(at(10, H - 12), at(58, H - 12)), class: "nf" }, g);
  mk("path", { d: seg(at(10, H - 19), at(84, H - 19)), class: "nf lo" }, g);

  // a label over each field, a corner grip on the message, and a consent box beside the button
  mk("path", { d: F.map((f, i) => seg(at(f[0] + 1, f[3] + 6), at(f[0] + [22, 26, 32][i], f[3] + 6))).join(""), class: "nf lo" }, g);
  mk("path", { d: seg(at(100, 47), at(107, 54)) + seg(at(104, 47), at(107, 50)), class: "nf lo" }, g);
  mk("path", { d: poly(box(BOX[0], BOX[1], BOX[2], BOX[3], 1.5)) + seg(at(24, 19.5), at(54, 19.5)), class: "nf lo" }, g);
  const tick = mk("path", { class: "nf" }, g);

  // every moving number runs on the same soft curve as the other tiles' figures
  const ease = bezier(0.45, 0, 0.15, 1);
  const tw = (v) => ({ v, from: v, to: v, t0: 0, dur: 1 });
  const go = (t, to, now, delay, dur) => { t.from = t.v; t.to = to; t.t0 = now + delay; t.dur = dur; };
  const step = (t, now) => {
    const k = reducedMotion() ? 1 : clamp((now - t.t0) / t.dur, 0, 1);
    t.v = lerp(t.from, t.to, ease(k));
    return k < 1;
  };

  const fields = F.map((f, i) => ({
    frame: mk("path", { d: poly(box(f[0], f[1], f[2], f[3], 3)), class: "nf lo" }, g),
    text: mk("path", { class: "nf" }, g), f, amt: tw(i === 0 ? 1 : 0), drawn: NaN,
  }));
  const caret = mk("path", { class: "nf" }, g);
  const btn = { el: mk("path", { class: "sil" }, g), face: mk("path", { class: "nf lo" }, g), out: tw(4), drawn: NaN };

  function drawField(fd, k) {
    if (k === fd.drawn) return;
    fd.drawn = k;
    const [u0, v0, u1, v1, lines] = fd.f, wdt = u1 - u0 - 12, n = lines.length, top = n > 1 ? v1 - 8 : (v0 + v1) / 2;
    fd.text.setAttribute("d", lines.map((share, j) => {
      const part = Math.max(0, Math.min(1, k * n - j)) * share, v = top - j * 9;
      return part > 0.01 ? seg(at(u0 + 6, v), at(u0 + 6 + wdt * part, v)) : "";
    }).join(""));
  }
  function drawBtn(o) {
    if (o === btn.drawn) return;
    btn.drawn = o;
    const [u0, v0, u1, v1] = BTN;
    btn.el.setAttribute("d", poly(hull(box(u0, v0, u1, v1, 6, 0).concat(box(u0, v0, u1, v1, 6, o)))));
    btn.face.setAttribute("d", seg(at(u0 + 12, (v0 + v1) / 2, o), at(u1 - 12, (v0 + v1) / 2, o)));
  }

  // the bright stroke and the caret ride on the progress: the field being typed into, then the button once it is pressed
  let active = null;
  function mark() {
    const sent = btn.out.v < 2.5;
    const typing = fields.findIndex((fd) => fd.amt.v < 0.99);
    const a = sent ? 3 : typing < 0 ? 2 : typing;
    if (a === active) return;
    active = a;
    fields.forEach((fd, i) => { fd.frame.classList.toggle("hi", i === a); fd.frame.classList.toggle("lo", i !== a); });
    btn.el.classList.toggle("hi", a === 3);
    tick.setAttribute("d", a === 3 ? open([at(12, 19.5), at(14.5, 17), at(18, 22.5)]) : "");
    const f = F[a];
    caret.setAttribute("d", a < F.length ? seg(at(f[0] + 6, f[3] - 4), at(f[0] + 6, f[1] + (f[3] - f[1] > 20 ? f[3] - f[1] - 12 : 4))) : "");
  }

  const B = register(tile, (_dt, now) => {
    let m = false;
    fields.forEach((fd) => { if (step(fd.amt, now)) m = true; drawField(fd, fd.amt.v); });
    if (step(btn.out, now)) m = true;
    drawBtn(btn.out.v);
    mark();
    return m;
  });
  // frame what is drawn, so the form sits centred in the tile (hairline-frame.js)
  frameView(svg, [], 10);

  // one play: the email types in, then the message, then the button presses; leaving clears it
  const FILL = 650, MSG = 1100, PRESS = 380, SEND = FILL + MSG - 200;
  function send() {
    const now = performance.now();
    go(fields[1].amt, 1, now, 0, FILL);
    go(fields[2].amt, 1, now, FILL - 150, MSG);
    go(btn.out, 1, now, SEND, PRESS);
    B.wake();
  }
  function clear() {
    const now = performance.now();
    go(btn.out, 4, now, 0, 300);
    go(fields[2].amt, 0, now, 0, 450);
    go(fields[1].amt, 0, now, 120, 400);
    B.wake();
  }

  // Below sm the figure is hidden (the tile stays icon + text, as on mobile before), so it never plays there.
  const HOLD = 2000, wide = matchMedia("(min-width: 640px)");
  let clearLater = 0;
  tile.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && wide.matches) { clearTimeout(clearLater); send(); } });
  tile.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") { clearTimeout(clearLater); clear(); } });
  // one play on its own, then back to rest: on a tap (no hover on touch), and for the scroll showcase
  // (tiles-scroll.js), which plays the tiles one after another as they scroll into view; never under the mouse
  let hovered = false;
  tile.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") hovered = true; });
  tile.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hovered = false; });
  tile.hairlineShow = () => {
    if (!wide.matches || hovered || fields[1].amt.to !== 0) return;
    send();
    clearLater = setTimeout(clear, SEND + PRESS + HOLD);
  };
  tile.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") tile.hairlineShow(); });
})();
