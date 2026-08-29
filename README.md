# Dent Ninja — Paintless Dent Removal

Marketing site for **Dent Ninja**, a certified paintless dent removal (PDR) technician
based in Boksburg, Gauteng, serving the wider East Rand.

Dark neon single-page site, themed from the client's logo artwork. No build step, no
framework, no dependencies to install — open `index.html` and it runs.

---

## Business details (source: client flyer + logo)

| | |
|---|---|
| Trading name | Dent Ninja — Paintless Dent Removal |
| Service | Paintless dent removal; mobile / on-site |
| Phone / WhatsApp | 065 640 1620 (`+27 65 640 1620`) |
| Email | justin@dentninja.co.za |
| Facebook | https://www.facebook.com/share/19RT3oAPUh/ |
| Base | Boksburg |
| Areas served | Boksburg, Benoni, Brakpan, Kempton Park, Springs & surrounding |
| Positioning | *No paint. No filler. No problem.* / *Quality work. Honest prices. Ninja results.* |
| Credentials | Certified PDR technician with hands-on panel beating experience |

---

## Brand & theme

The whole visual system is derived from the client's logo artwork
(`src/logo-original.jpg`) rather than applied on top of it:

| Role | Colour | Where it comes from |
|---|---|---|
| Page base | `#04060F` | the logo's near-black blue-violet field (sampled from its corners) |
| Structural accent | `#00D2FC` | the cyan arc, the ninja's rim light, the left-hand lightning |
| Action accent | `#FF3200` | the "NINJA" wordmark and the right-hand lightning |
| Ice / heading | `#F2F8FF` | the "DENT" wordmark |

Cyan carries structure (rules, icons, numbering, focus rings, link hovers,
form focus); red carries action (primary CTAs, headline accent words). Section
backgrounds pair a cyan glow against a red one, echoing the logo's split ring.

### The logo assets

`assets/img/logo-neon.png` is the artwork alpha-keyed off its black field, so
it composites onto any section without a black box behind it. Three details
make that work:

- **Un-premultiplied RGB.** Alpha is `max(R,G,B)` and RGB is normalised to full
  intensity, so compositing over black reproduces the original exactly while
  the glows stay translucent over anything lighter.
- **A black floor.** Channel values at or below 10 go fully transparent —
  without it, JPEG mush around the artwork leaves a faintly darker rectangle
  once the section behind it is coloured rather than black.
- **An elliptical falloff.** The lightning runs to the frame edge in the source;
  a smoothstep window fades it out instead of guillotining it at the boundary.

WebP is the delivered format (`logo-neon.webp`, 211 KB vs 876 KB for the PNG),
with the PNG as a `<picture>` fallback.

### The nav mark

The header uses the real artwork, not a redrawn version. `assets/img/logo-mark.png`
is the ninja and its ring cropped out of the full logo, alpha-keyed the same way.
Isolating it needed a directional fade rather than a straight cut — a row scan
showed the ninja's tool and the "D" of DENT interleave between x 340–360, so no
hard boundary separates them. A smoothstep fade from x 330 to 364 drops the
wordmark while letting the tool dissolve, and a second elliptical falloff keeps
the ring from being clipped.

The header is 86 px so the mark can render at 44–56 px, which is where the
figure stays readable. Below that it closes up (see Icons).

### Icons

The detailed ninja turns to mush below about 48 px, so the favicon is a
purpose-built simplified mark — the neon ring plus a ninja hood and eye-slit,
in the same cyan-to-red gradient. `assets/img/favicon.svg` is the source; the
PNG sizes (48/96/180/192/512) and the multi-size `favicon.ico` are all
rasterised from it, so every size is the same mark.

---

## Structure

```
index.html              the whole page
site.webmanifest        PWA/app icon metadata
robots.txt
assets/
  css/styles.css        design system + all layout
  js/main.js            reveals, 3D tilt, parallax, WhatsApp wiring, forms
  img/                  logo + nav mark (alpha-keyed), icon set, posters, OG image
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

## SEO

On-page work that is done:

- Keyword-led `<title>` and meta description, both locality-first.
- `robots` meta with `max-image-preview:large` (needed for large thumbnails in
  results), canonical, geo meta, Open Graph and Twitter cards with a purpose-
  built 1200×630 share image.
- **JSON-LD `@graph`** with four linked nodes: `AutoBodyShop`/`LocalBusiness`
  (email, phone, `sameAs` → Facebook, geo point, 10 `areaServed` cities, a
  7-item `OfferCatalog`), `WebSite`, `WebPage` and `FAQPage`.
- **`FAQPage` mirrors the visible accordion exactly** — all 8 questions. Google
  requires FAQ rich-result content to be present on the page; schema that
  invents answers is a manual-action risk, so the two are generated from one
  source and verified equal.
- An `image:image` sitemap, and a heading that carries the primary keyword and
  locality ("Paintless dent removal in Boksburg & the East Rand").

Deliberately **not** included: opening hours, price ranges, `aggregateRating`
and reviews. None of those are known, and inventing them in structured data is
both a policy violation and a manual-action risk.

### What actually moves local rankings

On-page SEO is the smaller half of this. For a local service business the
biggest lever by far is a **Google Business Profile** — verified, correctly
categorised ("Auto dent removal service"), with the service area set, real
photos, and reviews. The map pack is where most "dent removal near me" traffic
goes, and no amount of markup on this page substitutes for it. Second lever is
citations: consistent name/phone/address across Facebook, local directories
and any listing sites.

---

## Search Console & the favicon

Submitting the sitemap in Search Console requests indexing; it does not set the
favicon directly. Google picks the favicon up separately, by crawling the home
page and reading its `<link rel="icon">` tags. What this site does to satisfy
Google's documented requirements:

- Square icons at multiples of 48 px (48, 96, 192, 512) plus a 48 px `.ico`.
- Declared in the `<head>` of the home page, on stable URLs.
- Not blocked in `robots.txt`.

Timing: Google re-crawls the home page on its own schedule and refreshes the
icon then — typically days, sometimes a few weeks. Requesting indexing via the
URL Inspection tool can prompt a re-crawl but does not force the icon to
update. Note the favicon shows next to results mainly on **mobile** search.

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

Deployed with GitHub Pages from `main` (root). Staging URL:
**<https://obsidianstudiodesigns.github.io/dent-ninja/>**

Production is the client's own domain, **dentninja.co.za**, pointed at Pages via
DNS — the site is not copied to another host. All absolute URLs (canonical,
`og:url`, JSON-LD, sitemap) already declare `https://dentninja.co.za/`.

`DNS-SETUP.md` has the records for the DNS provider. The one thing to get right
is the order: the MX record points at the bare domain, so it must be moved to
`mail.dentninja.co.za` *before* the apex A record changes, or inbound mail routes
to GitHub and bounces.

All asset paths are relative, so the site also works unchanged from a subdirectory
or from a custom domain.

---

## Before going live on the real domain

- [ ] Swap the Facebook `/share/` link for the page's canonical
      `facebook.com/<PageName>` URL once you have it (works either way, but the
      canonical form is the better `sameAs` value).
- [ ] Create and verify a **Google Business Profile** — the single highest-impact
      step for local ranking, and not something the site can do for you.
- [ ] Point `<link rel="canonical">`, `og:url`, `og:image`, `sitemap.xml` and the
      `robots.txt` sitemap line at `dentninja.co.za` (all four currently use the
      Pages URL). `og:image` must stay absolute — social scrapers reject relative paths.
- [ ] Add real before/after repair photos when available — for a trade like this they
      convert better than any stock or generated image.
- [ ] Confirm business hours and add them to the JSON-LD if the client wants them shown.
