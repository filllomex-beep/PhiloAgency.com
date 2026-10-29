/*
 * frameView: crops a Hairline figure's viewBox to what it actually draws, so the
 * figure sits centred in its tile instead of wherever its 400 × 320 plate put it.
 *
 * It measures the drawing as it stands (the rest pose), then after each pose in
 * `poses`: functions that redraw the figure synchronously, the first one into its
 * end pose, the last one back at rest. The frame is as big as the union of the two,
 * so nothing ever clips, and the returned follow(t) slides its centre from the rest
 * pose's (t = 0) to the end pose's (t = 1): call it from the figure's tick with how
 * far along it is, and both ends sit centred while it moves between them.
 *
 * Every path the kernel writes is absolute M/L/Z pairs, so the numbers in each `d`
 * are the points themselves; no layout is needed, so it works while the tile is hidden.
 */
window.frameView = (svg, poses = [], pad = 6) => {
  const measure = () => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const el of svg.querySelectorAll("path")) {
      const n = (el.getAttribute("d") || "").match(/-?\d*\.?\d+/g);
      if (!n) continue;
      for (let i = 0; i + 1 < n.length; i += 2) {
        const x = +n[i], y = +n[i + 1];
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    return { x0, y0, x1, y1 };
  };
  const boxes = [measure()];
  poses.forEach((pose) => { pose(); boxes.push(measure()); });
  const rest = boxes[0], end = boxes.length > 2 ? boxes[1] : rest;
  if (!isFinite(rest.x0)) return () => {};
  const w = Math.max(rest.x1, end.x1) - Math.min(rest.x0, end.x0) + 2 * pad;
  const h = Math.max(rest.y1, end.y1) - Math.min(rest.y0, end.y0) + 2 * pad;
  const cx = (b) => (b.x0 + b.x1) / 2, cy = (b) => (b.y0 + b.y1) / 2;
  const r1 = (v) => Math.round(v * 10) / 10;
  let last = "";
  const follow = (t) => {
    t = Math.max(0, Math.min(1, t || 0));
    const x = cx(rest) + (cx(end) - cx(rest)) * t, y = cy(rest) + (cy(end) - cy(rest)) * t;
    const vb = [x - w / 2, y - h / 2, w, h].map(r1).join(" ");
    if (vb !== last) { last = vb; svg.setAttribute("viewBox", vb); }
  };
  follow(0);
  return follow;
};
