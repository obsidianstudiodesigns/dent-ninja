# dentninja.co.za — DNS changes to point the domain at the new site

The new site stays hosted on GitHub Pages. The domain needs to **point at it via
DNS** so that `https://dentninja.co.za/` serves the new site directly.

> **This is a DNS change, not a redirect.**
> Please do **not** set up "domain forwarding", "URL forwarding" or "URL masking".
> Those leave the visitor's address bar showing a github.io address, or wrap the
> site in a frame — both harm search rankings. The A and CNAME records below are
> what's needed, and the address bar stays on `dentninja.co.za`.

---

## ⚠️ Read this first — email breaks if the order is wrong

Mail currently depends on the domain's own A record along two paths:

```
dentninja.co.za.        A       196.41.122.211
mail.dentninja.co.za.   CNAME   dentninja.co.za     <-- follows the apex
dentninja.co.za.        MX  0   dentninja.co.za     <-- follows the apex
```

The moment the apex A record points at GitHub, mail for
**justin@dentninja.co.za** routes to GitHub, which runs no mail server, and
**every incoming email bounces.**

Repointing MX on its own is *not* enough — `mail.dentninja.co.za` is a CNAME to
the apex, so it would follow the apex to GitHub too. The mail hostname has to
become an independent A record first.

(This also fixes a standards problem: per RFC 2181 an MX record must not resolve
to a CNAME, which is what the zone currently does.)

---

## Step 1 — Make mail independent (do this first, on its own)

**Delete** this CNAME:

| Type | Name | Value |
|---|---|---|
| CNAME | `mail.dentninja.co.za` | `dentninja.co.za` |

**Add** this A record in its place:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `mail.dentninja.co.za` | `196.41.122.211` | 300 |

**Then** repoint MX at it:

| Type | Name | Value | Priority | TTL |
|---|---|---|---|---|
| MX | `dentninja.co.za` | `mail.dentninja.co.za` | 0 | 300 |

Then **wait for the old TTL to expire** (14400 = 4 hours) and confirm mail is
still being delivered before continuing. Send a test message from an address
off the domain, and reply to it.

---

## Step 2 — Point the domain at GitHub Pages

**Remove** the existing apex A record `196.41.122.211`, and **add these four**:

| Type | Name | Value |
|---|---|---|
| A | `dentninja.co.za` | `185.199.108.153` |
| A | `dentninja.co.za` | `185.199.109.153` |
| A | `dentninja.co.za` | `185.199.110.153` |
| A | `dentninja.co.za` | `185.199.111.153` |

Optionally add IPv6 as well:

| Type | Name | Value |
|---|---|---|
| AAAA | `dentninja.co.za` | `2606:50c0:8000::153` |
| AAAA | `dentninja.co.za` | `2606:50c0:8001::153` |
| AAAA | `dentninja.co.za` | `2606:50c0:8002::153` |
| AAAA | `dentninja.co.za` | `2606:50c0:8003::153` |

All four A records are required — they are GitHub's load-balanced set, not
alternatives to choose between.

## Step 3 — Point www at GitHub

`www` is currently a CNAME to the apex. Please change it to:

| Type | Name | Value |
|---|---|---|
| CNAME | `www` | `obsidianstudiodesigns.github.io` |

(The trailing dot may be required depending on the control panel.)

`www.dentninja.co.za` will then redirect to `dentninja.co.za`, which is the
canonical address the site declares.

---

## Do not change these

| Record | Reason |
|---|---|
| `MX` after Step 1 | mail delivery |
| The new `mail.dentninja.co.za` A record | it's what MX now depends on |
| `cpanel`, `webmail`, `ftp` A records | panel, webmail and FTP access |
| `autodiscover`, `autoconfig` A records | mail client auto-setup |
| `TXT` SPF record | mail authentication |
| Any DKIM / DMARC records | mail authentication |

The current SPF is:

```
v=spf1 ip4:196.41.122.211 include:spamkill.cybersmart.co.za +a +mx ~all
```

This stays valid after the change — the mail server is listed explicitly as
`ip4:196.41.122.211`, so it remains authorised even though the domain's A record
now points elsewhere. **Please leave it exactly as it is.** (The `+a` mechanism
becomes meaningless once the A record moves to GitHub, but it is harmless, and
editing SPF carries more risk than leaving it.)

---

## Summary of the change

| Record | From | To |
|---|---|---|
| `mail` | CNAME to the apex | A record on `196.41.122.211` |
| MX | `dentninja.co.za` | `mail.dentninja.co.za` |
| A (apex) | `196.41.122.211` | GitHub's four IPs above |
| CNAME www | `dentninja.co.za` | `obsidianstudiodesigns.github.io` |
| Everything else | — | unchanged |

---

## Old site URLs — nothing to preserve

Checked directly rather than asked for. The current site is a stock WordPress +
Elementor install; its sitemap lists only the defaults:

```
/                             "Elementor #46" placeholder
/2026/03/16/hello-world/      default WordPress post
/sample-page/                 default WordPress page
/hello-theme-26/              default theme page
/category/uncategorized/      default category
```

None of these hold any ranking worth keeping, so no redirects are needed. They
will 404 after the cutover and drop out of the index on their own.

---

## SSL on the mail hostname

Once the apex A record points at GitHub, the host's AutoSSL can no longer
validate `dentninja.co.za` over HTTP. That is expected — GitHub issues the
website certificate.

`mail.dentninja.co.za` keeps pointing at the mail server, so validation for it
still succeeds and secure IMAP/POP/SMTP are unaffected. Worth asking the host to
confirm, since a lapsed mail certificate is a quiet failure.

---

## After DNS has propagated

Nothing further is needed from the hosting provider. The remaining steps happen
on the GitHub side:

1. Set the custom domain to `dentninja.co.za` in the repository's Pages settings
2. Wait for the TLS certificate to be issued automatically (usually minutes)
3. Enable **Enforce HTTPS**

Then these should all resolve:

- `https://dentninja.co.za/` — the new site
- `https://www.dentninja.co.za/` — redirects to the non-www address
- `http://dentninja.co.za/` — redirects to HTTPS
- Email to `justin@dentninja.co.za` — still arriving
