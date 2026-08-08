# Dent Ninja — Paintless Dent Removal

Marketing site for **Dent Ninja**, a certified paintless dent removal (PDR) technician
based in Boksburg, Gauteng, serving the wider East Rand.

Dark, moody, single-page site. No build step, no framework, no dependencies to install —
open `index.html` and it runs.

---

## Business details (source: client flyer + logo)

| | |
|---|---|
| Trading name | Dent Ninja — Paintless Dent Removal |
| Service | Paintless dent removal; mobile / on-site |
| Phone / WhatsApp | 065 640 1620 (`+27 65 640 1620`) |
| Base | Boksburg |
| Areas served | Boksburg, Benoni, Brakpan, Kempton Park, Springs & surrounding |
| Positioning | *No paint. No filler. No problem.* / *Quality work. Honest prices. Ninja results.* |
| Credentials | Certified PDR technician with hands-on panel beating experience |

---

## Structure

```
index.html              the whole page
site.webmanifest        PWA/app icon metadata
robots.txt
assets/
  css/styles.css        design system + all layout
  js/main.js            reveals, 3D tilt, parallax, WhatsApp wiring, forms
  js/dent3d.js          WebGL dent/reflector-board demo (ES module)
  img/                  logo variants, icons, posters, OG image
  video/                cropped, web-optimised hero videos
src/                    original client masters (untouched, kept for reference)
```

---

## The 3D piece

`assets/js/dent3d.js` renders a steel panel sitting under a **PDR reflector board** —
the striped light a technician actually reads a dent with. Drag the slider and the
reflected lines straighten as the metal is worked back to shape.

Implementation notes:

- The dent is displaced **analytically in the vertex shader** (`onBeforeCompile` on a
  `MeshPhysicalMaterial`), including the derived surface normal. Nothing is recomputed
  on the CPU per frame — the whole repair animation is one uniform.
- The dent profile is a gaussian dip plus a raised rim, which is how sheet metal
  actually deforms; a faint factory "crown" keeps the panel from reading as dead-flat CG.
- The environment map is generated procedurally into a canvas (striped board, cool rim
  light, brand-red kicker) and run through `PMREMGenerator` — so there is no HDR file
  to download.
- Three.js is loaded from a CDN via an import map. If it fails to load, if WebGL is
  unavailable, or if the context is lost, the section falls back to a still image.

---

## Media

Both hero videos were cropped to remove the generator's star watermark from the
bottom-right, then re-encoded for the web (H.264, `faststart`, audio stripped):

| | source | delivered |
|---|---|---|
| Desktop | 1280×720 | 1128×720 |
| Mobile | 720×1280 | 632×1280 |

The watermark measured `x 1136–1237, y 560–639` in the desktop master. The mobile
master carried no watermark (verified by temporal averaging and per-pixel scans); the
same proportional crop was applied anyway so the two cuts stay consistent.

`assets/js/main.js` picks the cut at runtime from `matchMedia`, skips the video entirely
on `prefers-reduced-motion` or Save-Data, and pauses it when off-screen.

---

## Accessibility & resilience

- Content is **never** gated behind an observer — reveals use a rect sweep, and the
  hiding CSS is scoped to `.js` so a JS failure leaves a fully readable page.
- `prefers-reduced-motion` disables the grain, ticker, parallax, tilt, video and the
  3D auto-animation.
- Skip link, visible focus rings, labelled form fields, semantic landmarks,
  44px+ touch targets on coarse pointers.
- `AutoBodyShop` JSON-LD with real service areas. Nothing invented — no fabricated
  reviews, ratings, prices or opening hours.

---

## Running locally

Any static server works (the ES module import map needs `http://`, not `file://`):

```bash
python -m http.server 5178
```

Then open <http://localhost:5178>.

---

## Hosting

Deployed with GitHub Pages from `main` (root):
**<https://obsidianstudiodesigns.github.io/dent-ninja/>**

All asset paths are relative, so the site also works unchanged from a subdirectory
or from a custom domain.

---

## Before going live on the real domain

- [ ] Replace the Facebook link in `index.html` and the footer with the page's real URL
      (it currently points at a Facebook search for the page name).
- [ ] Point `<link rel="canonical">`, `og:url`, `og:image`, `sitemap.xml` and the
      `robots.txt` sitemap line at `dentninja.co.za` (all four currently use the
      Pages URL). `og:image` must stay absolute — social scrapers reject relative paths.
- [ ] Add real before/after photos when available; they will outperform any 3D demo.
- [ ] Confirm business hours and add them to the JSON-LD if the client wants them shown.
