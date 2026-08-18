# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project structure

This is a **static single-file site** — the only deliverable is `index.html`. Everything (HTML, inline `<style>`, and inline `<script>`) lives there. The `app/`, `components/`, and `lib/` directories exist as an empty Next.js scaffold and are not used. There is no build step, no `package.json`, no bundler.

To preview the site: open `index.html` directly in a browser, or use Puppeteer for automated screenshots.

## Design system

The site is built around a glass-morphism aesthetic with a warm off-white background (`#f9f8f6`). Core CSS utility classes defined in the inline `<style>` block:

- `.glass` — primary frosted panel (62 % white, 24 px blur)
- `.glass-sm` — lighter variant (55 % white, 16 px blur)
- `.glass-dark` — inverted for dark-background sections (11 % white, 18 px blur)
- `.glass-nav` — sticky nav bar (78 % white, 24 px blur)
- `.gradient-text` — red gradient text (`#c0392b → #d9453a`)
- `.blob` — decorative ambient blobs (absolute-positioned, pointer-events none)
- `.animate-marquee` / `.animate-marquee-reverse` — infinite logo strip scroll

Typography: **Inter** (Google Fonts, weights 300–900). Language: Czech (`lang="cs"`).

## Animation stack

- **GSAP 3.12.5 + ScrollTrigger** (CDN) — scroll-triggered reveal animations, timeline sequences
- **Tailwind CSS** (CDN) — utility classes for layout/spacing; config extended inline via `tailwind.config`
- Prefer plain CSS transitions for simple hover states; reach for GSAP only when sequencing or scroll triggers are needed

---

# Premium Website Recreation

I'm building a high-end, premium website — agency / SaaS-launch quality,
rich but tasteful animations and polished micro-interactions, never a
generic template. I'll give you a reference or instruction in one of
these forms: a **screenshot**, a **code snippet**, a **text description**,
or a **plain command** ("make the hero darker", "add a pricing section").

The single most important rule: **match the effort to the input.** Do not
run the full screenshot-comparison loop for small edits. Verbose loops
waste time and tokens — only the visual-reference path earns them.

## Routing — decide before doing anything

- **Plain command / text instruction** → make the edit using your best
  judgment for what looks premium and cohesive. Take ONE viewport
  screenshot only if the change is visual. Then stop. No comparison loop.
- **Code snippet** → integrate it, matching the existing style and
  animation system. ONE viewport screenshot to confirm it rendered. Stop.
- **Screenshot / visual reference** → run the comparison workflow below.
  This is the ONLY path that loops.

## Comparison workflow (visual references only)

1. Build or edit `index.html`.
2. Take ONE viewport screenshot with Puppeteer (not `--fullpage`).
   Capture individual sections or mid-animation frames ONLY if I ask.
3. Compare against the reference. Fix visible mismatches: spacing/padding,
   font size/weight/line-height, colors, alignment, radii/shadows/
   gradients, image and icon placement, responsive behavior.
4. Re-screenshot and compare ONCE more.
5. Stop when no *visible* issues remain. Do not chase sub-pixel
   differences. **Maximum 2 rounds** unless I explicitly ask for more.

Give a one-line summary of what you fixed. Don't narrate every step.

## Editing rules (keep token cost low)

- Make **surgical edits** to the relevant section. Do NOT regenerate the
  whole file for a small change.
- Don't re-read the entire `index.html` before every edit if you already
  know the section you're touching.
- Keep screenshots at viewport size and reasonable resolution. Full-page
  captures of a tall site are large — use them only when I ask.

## Build defaults

- Single `index.html`, all content inline, unless I request otherwise.
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- GSAP via CDN for anything beyond basic CSS/Tailwind transitions;
  prefer plain CSS transitions when they get an equally smooth result.
- Placeholder images from `https://placehold.co/` when none are provided.
- Mobile-first, fully responsive.

## Animation defaults

Premium and subtle, never gimmicky: scroll-triggered reveals
(fade / slide-up), tasteful hover and button/card/link micro-interactions,
smooth section transitions, light parallax where it fits. Natural easing
curves, never linear. Target smooth 60fps with no layout shift on load.
