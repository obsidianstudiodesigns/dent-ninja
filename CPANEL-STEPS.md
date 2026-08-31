# Pointing dentninja.co.za at the new site — cPanel walkthrough

Do this in two sittings with a wait in between. Email breaks if the A records
change before the mail hostname is fixed, so the order is not optional.

**Before you start:** change the cPanel password. It was emailed to you in plain
text. *Preferences → Password & Security.*

---

## Why the mail step comes first

Right now the zone looks like this:

```
dentninja.co.za.        A       196.41.122.211
mail.dentninja.co.za.   CNAME   dentninja.co.za      <-- follows the apex
dentninja.co.za.        MX  0   dentninja.co.za      <-- follows the apex
```

Both the MX record and the mail hostname ultimately resolve through the
domain's own A record. So the moment that A record points at GitHub, mail for
`justin@dentninja.co.za` is routed to GitHub — which runs no mail server — and
every incoming message bounces.

`mail.dentninja.co.za` has to become a **real A record** pointing at the mail
server, so it stops depending on the apex. Then MX points at it.

(As a bonus this fixes a standards problem: an MX record is not permitted to
point at a CNAME, which is what the current setup effectively does.)

---

## Sitting 1 — make mail independent (about 10 minutes)

### 1. Set mail routing to Local

*Email → Email Routing*

- Select `dentninja.co.za`
- Choose **Local Mail Exchanger**
- Click **Change**

Do this even if it looks correct already. Left on "Automatically Detect
Configuration", cPanel re-reads DNS after step 4 and can decide your mail lives
on another server, at which point it stops accepting mail for you.

### 2. Open the zone

*Domains → Zone Editor* → find `dentninja.co.za` → click **Manage**

### 3. Turn `mail` into an A record

Click the **CNAME** filter tab.

- Find `mail.dentninja.co.za` → value `dentninja.co.za`
- Click **Delete**, and confirm

Now go back and click **+ A Record**:

| Field | Value |
|---|---|
| Name | `mail` |
| Record Type | A |
| TTL | `300` |
| Address | `196.41.122.211` |

Delete the CNAME **before** adding the A record — cPanel won't let both exist
with the same name.

Check the **A** tab afterwards and confirm `mail.dentninja.co.za` is listed at
`196.41.122.211`.

### 4. Repoint the MX record

Click the **MX** filter tab.

- One record: `dentninja.co.za` → `dentninja.co.za`, priority 0
- Click **Edit**
- Destination: `mail.dentninja.co.za`
- Priority: **0**
- TTL: `300`
- **Save Record**

### 5. Drop the TTL on what changes next

On the **A** tab, edit the `dentninja.co.za` record and set TTL to `300`.
On the **CNAME** tab, do the same for `www`.

This makes sitting 2 take minutes rather than hours.

### 6. Stop and wait

Wait **at least 4 hours** — overnight is easiest. The old 4-hour TTL has to
expire before any of this reaches the wider internet.

---

## Between sittings — confirm mail still works

Do not skip this. It is the entire reason for the wait.

1. From Gmail — or any address **not** on this domain — send a test message to
   `justin@dentninja.co.za`
2. Confirm it arrives
3. Reply from `justin@dentninja.co.za` and confirm the reply lands

If mail is flowing, the risky part is behind you. If it isn't, stop and tell me.
Nothing else has been touched yet and the MX change reverses cleanly.

---

## Sitting 2 — point the domain at GitHub (about 10 minutes)

*Domains → Zone Editor → dentninja.co.za → Manage → **A** filter tab*

### 7. Change the apex A record

- Find the record named exactly `dentninja.co.za.`, value `196.41.122.211`
- **Edit** → change the value to `185.199.108.153` → TTL `300` → **Save Record**

> Change **only** the record whose name is exactly `dentninja.co.za.`
>
> Leave every one of these exactly as they are — they are all separate A records
> on `196.41.122.211` and none of them should move:
>
> `mail` · `cpanel` · `webmail` · `ftp` · `autodiscover` · `autoconfig`

### 8. Add the other three

Use **+ A Record** three times:

| Name | Record Type | TTL | Address |
|---|---|---|---|
| `dentninja.co.za` | A | 300 | `185.199.109.153` |
| `dentninja.co.za` | A | 300 | `185.199.110.153` |
| `dentninja.co.za` | A | 300 | `185.199.111.153` |

All four must be present — they are GitHub's load-balanced set, not options to
choose between.

### 9. Point www at GitHub

**CNAME** tab → find `www` (currently pointing at `dentninja.co.za`):

- **Edit** → value `obsidianstudiodesigns.github.io` → TTL `300` → **Save**

If `www` turns out to be an A record instead, delete it and add a CNAME with the
same values.

### 10. Tell me it's done

I'll verify the records are live, then finish the GitHub side — adding the
domain to the repository and enabling HTTPS. The certificate is issued
automatically and usually takes a few minutes.

---

## Optional IPv6

Four AAAA records on `dentninja.co.za`. Not required; the site works without.

```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

---

## Do not touch

| Record | Why |
|---|---|
| `mail` A record (after step 3) | your mail delivery depends on it |
| `cpanel`, `webmail`, `ftp` | control panel, webmail and FTP access |
| `autodiscover`, `autoconfig` | automatic mail client setup |
| The SPF TXT record | mail authentication; still correct as-is |
| Any DKIM / DMARC records | mail authentication |

The SPF record survives the move untouched. It reads:

```
v=spf1 ip4:196.41.122.211 include:spamkill.cybersmart.co.za +a +mx ~all
```

The mail server is authorised explicitly by `ip4:196.41.122.211`, and `+mx` will
now resolve through the new `mail` A record to the same address.

---

## Leave WordPress alone for now

Don't delete the WordPress install or cancel any hosting. It costs nothing to
leave in place, and if anything needs backing out, setting the apex A record
back to `196.41.122.211` restores the old site immediately.

Clean it up a few weeks after the new site is confirmed live.

---

## What "done" looks like

- `https://dentninja.co.za/` — the new site, padlock in the address bar
- `https://www.dentninja.co.za/` — redirects to the non-www address
- `http://dentninja.co.za/` — redirects to HTTPS
- Email to and from `justin@dentninja.co.za` — still working
- `https://dentninja.co.za:2083` — cPanel still reachable
- `https://webmail.dentninja.co.za` — webmail still reachable
