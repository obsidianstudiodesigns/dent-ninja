# dentninja.co.za — DNS changes to point the domain at the new site

The new site stays hosted on GitHub Pages. The domain needs to **point at it via
DNS** so that `https://dentninja.co.za/` serves the new site directly.

> **This is a DNS change, not a redirect.**
> Please do **not** set up "domain forwarding", "URL forwarding" or "URL masking".
> Those leave the visitor's address bar showing a github.io address, or wrap the
> site in a frame — both harm search rankings. The A and CNAME records below are
> what's needed, and the address bar stays on `dentninja.co.za`.

---

## ⚠️ Read this first — email will break if the order is wrong

The MX record currently points at the bare domain:

```
dentninja.co.za.   MX   0   dentninja.co.za.      <-- resolves to 196.41.122.211
dentninja.co.za.   A        196.41.122.211
```

Mail is delivered by following that MX to the **A record of the domain itself**.
So the moment the A record is changed to GitHub's IPs, mail for
**justin@dentninja.co.za** would be routed to GitHub, which runs no mail server,
and **every incoming email would bounce.**

**The MX record must be repointed to a dedicated mail hostname first.**

`mail.dentninja.co.za` already exists and already resolves to `196.41.122.211`,
so no new host is needed:

```
mail.dentninja.co.za.   A   196.41.122.211      (already in place)
```

Please make the MX change, let it propagate, and only then change the A records.
The current TTL is 14400 (4 hours), so please allow for that — or drop the TTL
to 300 a day beforehand to make the switch quick and low-risk.

---

## Step 1 — Repoint MX (do this first, on its own)

| Type | Name | Value | Priority |
|---|---|---|---|
| MX | `dentninja.co.za` | `mail.dentninja.co.za` | 0 |

Then **wait for the old TTL to expire** (up to 4 hours) and confirm mail is still
being delivered before continuing.

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
| `mail.dentninja.co.za` A record | it's now what MX depends on |
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
