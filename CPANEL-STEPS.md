# Pointing dentninja.co.za at the new site — cPanel walkthrough

Do this in two sittings with a wait in between. Email breaks if the A records
change before the MX record does, so the wait is not optional.

**Before you start:** change the cPanel password. It was emailed to you in plain
text. *Preferences → Password & Security.*

---

## Sitting 1 — the MX record (about 5 minutes)

### 1. Check mail routing is set to Local

*Email → Email Routing*

- Select `dentninja.co.za` from the dropdown
- Choose **Local Mail Exchanger**
- Click **Change**

Do this even if it looks right already. If it is left on "Automatically Detect
Configuration", cPanel re-reads the DNS after step 3 below and can decide the
domain's mail lives elsewhere — at which point it stops accepting mail for you.
Setting it to Local explicitly removes that risk.

### 2. Open the zone

*Domains → Zone Editor* → find `dentninja.co.za` → click **Manage**

### 3. Repoint MX

- Click the **MX** filter tab
- You'll see one record: `dentninja.co.za` → `dentninja.co.za`, priority 0
- Click **Edit**
- Change the destination to: `mail.dentninja.co.za`
- Leave priority as **0**
- Set **TTL** to `300`
- **Save Record**

### 4. Drop the TTL on the records you'll change next

Still in Manage, click the **A** filter tab:

- Edit the `dentninja.co.za` A record → set TTL to `300` → Save
- Edit the `www` record → set TTL to `300` → Save

Changing the TTL now means sitting 2 takes 5 minutes instead of 4 hours.

### 5. Stop

Wait **at least 4 hours** — overnight is easiest. The old 4-hour TTL has to
expire before the internet picks up any of this.

---

## Between sittings — confirm mail still works

Do not skip this. It is the whole reason for the wait.

1. From Gmail (or any address **not** on this domain), send a test email to
   `justin@dentninja.co.za`
2. Confirm it arrives
3. Reply from `justin@dentninja.co.za` and confirm the reply arrives back

If mail is flowing, the risky part is done. If it isn't, stop and say so — the
MX change is reversible and nothing else has been touched yet.

---

## Sitting 2 — point the domain at GitHub (about 10 minutes)

*Domains → Zone Editor → dentninja.co.za → Manage → **A** filter tab*

### 6. Change the main A record

- Find the record where Name is `dentninja.co.za.` and value is `196.41.122.211`
- Click **Edit**
- Change the value to `185.199.108.153`
- TTL `300`
- **Save Record**

> Only change the record whose name is exactly `dentninja.co.za.`
> **Leave `mail.dentninja.co.za` on `196.41.122.211`.** Your mail now depends on
> it. If you see other subdomains (cpanel, webmail, ftp, autodiscover) pointing
> at `196.41.122.211`, leave those alone too.

### 7. Add the other three

Back on the Zone Editor screen, use **+ A Record** three times:

| Name | Record Type | TTL | Address |
|---|---|---|---|
| `dentninja.co.za` | A | 300 | `185.199.109.153` |
| `dentninja.co.za` | A | 300 | `185.199.110.153` |
| `dentninja.co.za` | A | 300 | `185.199.111.153` |

All four must be present — they're GitHub's load-balanced set, not options.

### 8. Point www at GitHub

Click the **CNAME** filter tab and look for `www`.

**If a www CNAME exists:** Edit it, set the value to
`obsidianstudiodesigns.github.io`, TTL 300, Save.

**If www appears under the A tab instead:** delete that A record, then use
**+ CNAME Record**:

| Name | Record Type | TTL | Record |
|---|---|---|---|
| `www` | CNAME | 300 | `obsidianstudiodesigns.github.io` |

### 9. Tell me it's done

I'll confirm the records are live worldwide, then finish the GitHub side —
adding the domain to the repository and enabling HTTPS. That part takes a few
minutes and the certificate is issued automatically.

---

## Optional IPv6

If you want it, add four AAAA records on `dentninja.co.za`. Not required — the
site works fine without them.

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
| `mail.dentninja.co.za` A record | your mail delivery now depends on it |
| The SPF TXT record | mail authentication; still valid as-is |
| Any DKIM / DMARC records | mail authentication |
| `cpanel`, `webmail`, `ftp`, `autodiscover` | control panel and mail client access |

The SPF record stays correct after the move because the mail server is listed
explicitly as `ip4:196.41.122.211`, not only via the `+a` mechanism.

---

## Leave WordPress alone for now

Don't delete the WordPress install or cancel anything. It costs nothing to leave
in place, and if something needs backing out, putting the A record back to
`196.41.122.211` restores the old site immediately.

Clean it up a few weeks after the new site is confirmed live.

---

## What "done" looks like

- `https://dentninja.co.za/` — the new site, padlock in the address bar
- `https://www.dentninja.co.za/` — redirects to the non-www address
- `http://dentninja.co.za/` — redirects to HTTPS
- Email to and from `justin@dentninja.co.za` — still working
- `https://dentninja.co.za:2083` — cPanel still reachable
