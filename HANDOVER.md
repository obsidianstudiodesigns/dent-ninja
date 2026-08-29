# Dent Ninja — deployment notes for the hosting provider

New website for **dentninja.co.za**, replacing the current one.

Everything needed is in **`dentninja-site.zip`** (36 files, ~5.2 MB unpacked).

---

## What this is

A **static website** — HTML, CSS and JavaScript only.

- No PHP, no database, no Node, no build step, no dependencies to install
- Nothing to compile — the files are ready to serve exactly as they are
- Works on any standard web host (Apache, nginx, IIS, or any static host)

If the current site is WordPress or a page builder, this **replaces** it. Please
take a full backup of the existing site before removing anything.

---

## What to do

1. **Back up the current site** (files and, if applicable, database).
2. **Unzip into the web root** — the folder that serves `https://dentninja.co.za/`.
   Usually `public_html/`, sometimes `htdocs/`, `www/` or `wwwroot/`.
3. `index.html` must end up at the **root**, not inside a subfolder.
   `https://dentninja.co.za/` must serve it, with no `/index.html` in the address.
4. **Keep the folder structure exactly as it is.** All paths are relative, so the
   site works from any location, but only if `assets/` stays alongside `index.html`:

   ```
   index.html
   favicon.ico
   robots.txt
   sitemap.xml
   site.webmanifest
   .htaccess          (optional — see below)
   assets/
     css/  js/  img/  img/services/  video/
   ```

5. **HTTPS must be on** with a valid certificate, and `http://` should 301 to
   `https://`.

---

## Settings that matter

**Canonical hostname — non-www.** The site declares
`https://dentninja.co.za/` as its canonical address. Please 301 redirect
`www.dentninja.co.za` → `dentninja.co.za`.
*If you would rather run www as the primary, say so before go-live — it is a
one-line change on our side, but the site and the search-engine markup must
agree, so it can't simply be switched at the server.*

**MIME types.** Some older server configs don't know these. Please confirm:

| Extension | Type |
|---|---|
| `.webp` | `image/webp` |
| `.webmanifest` | `application/manifest+json` |
| `.mp4` | `video/mp4` |
| `.svg` | `image/svg+xml` |

Modern images and video are used for page speed. If `.webp` is served with the
wrong type, images silently fall back to the larger versions — the site still
works, it's just slower.

**Caching.** `assets/` can be cached aggressively (1 year). `index.html`,
`robots.txt` and `sitemap.xml` should **not** be long-cached, so future updates
appear straight away.

**`.htaccess` (optional).** The zip includes one for Apache with compression,
caching and MIME types already set. It is safe to delete if the server is not
Apache or if it conflicts with your setup. The HTTPS/www redirect block inside
it is **commented out on purpose** — if the server already handles that,
enabling it too can cause a redirect loop.

---

## Two things to be careful with

**1. Do not change the MX or email DNS records.**
`justin@dentninja.co.za` is a live address and is published on the new site.
This is a website file change only. If any DNS work is involved, mail records
must be left exactly as they are.

**2. Old pages need redirecting.**
The new site is a single page. Any URL on the current site that Google has
indexed — `/about`, `/contact`, `/services` and so on — will 404 once this goes
live, and that loses whatever ranking those pages hold.

**Please send a list of the current site's live URLs**, and 301 redirect each of
them to `https://dentninja.co.za/`. If the current site is only a single page,
nothing is needed here — just confirm that.

---

## After it's live

Please confirm each of these resolves:

- `https://dentninja.co.za/` — loads, with the hero video playing
- `https://dentninja.co.za/robots.txt`
- `https://dentninja.co.za/sitemap.xml`
- `https://dentninja.co.za/favicon.ico`
- `http://dentninja.co.za/` — redirects to `https://`
- `https://www.dentninja.co.za/` — redirects to the non-www address

---

## Access for future updates

Please provide **FTP/SFTP or control-panel access** so future content changes
(new repair photos, price or service updates) can be uploaded directly without
going through a support ticket each time.
