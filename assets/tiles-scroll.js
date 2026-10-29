/*
 * The scroll showcase for the „Co dostanete“ tiles: as the reader scrolls down, each
 * tile's figure plays once on its own and goes back to rest (tile.hairlineShow, set by
 * the figure's script), one after another in reading order as the tiles come into view.
 * Once per page view; never on mobile, where the figures are hidden, nor for readers
 * who asked for less motion. Hover keeps working as before, at any time.
 */
(() => {
  const tiles = [...document.querySelectorAll(".fig-tile")];
  if (!tiles.length || !("IntersectionObserver" in window)) return;
  if (!matchMedia("(min-width: 640px)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // a beat after the tile's own reveal (the .reveal fade-up), then one tile every GAP
  const FIRST = 550, GAP = 450;
  const queue = [];
  let timer = 0;
  const next = () => {
    const tile = queue.shift();
    if (!tile) { timer = 0; return; }
    if (tile.hairlineShow) tile.hairlineShow();
    timer = setTimeout(next, GAP);
  };

  const io = new IntersectionObserver((entries) => {
    entries
      .filter((e) => e.isIntersecting)
      .map((e) => e.target)
      .sort((a, b) => tiles.indexOf(a) - tiles.indexOf(b))
      .forEach((tile) => { io.unobserve(tile); queue.push(tile); });
    if (queue.length && !timer) timer = setTimeout(next, FIRST);
  }, { threshold: 0.6 });
  tiles.forEach((tile) => io.observe(tile));
})();
