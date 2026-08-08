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
  img/                  logo variants, icons, posters, OG image
  img/services/         "What gets fixed" card photography (600w + 1000w)
  video/                cropped, web-optimised hero videos
src/                    original client masters (untouched, kept for reference)
"What gets fixed"/      original service photography, as supplied
```

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

### Service photography

The five supplied images (`1408×768`) carry the same star watermark, in an identical
spot on every one: `x 1265–1311, y 624–673`. All are cropped to `1256×768` — taking it
off the right edge costs 10% of the frame, where cropping the bottom would have cost 19%.

Delivered at 600w and 1000w with `srcset`, lazy-loaded below the fold.

"Creases & body lines" had no supplied photo, so its card uses a frame from the client's
own hero footage (already watermark-free) showing a rod worked along a door's swage
line. Drop a sixth photo in and swap the `creases-*.jpg` pair to replace it.

---

## Accessibility & resilience

- Content is **never** gated behind an observer — reveals use a rect sweep, and the
  hiding CSS is scoped to `.js` so a JS failure leaves a fully readable page.
- `prefers-reduced-motion` disables the grain, ticker, parallax, tilt and video.
- The service cards deliberately avoid `backdrop-filter` and `preserve-3d` inside their
  clipped bounds. Six of those on screen at once tanks rasterisation — enough to hang a
  software-rendered capture outright, which is a fair proxy for a mid-range phone.
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
