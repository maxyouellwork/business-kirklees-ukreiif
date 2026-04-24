# Email Capture — Setup Guide

The landing page email signup flows through:

```
Page form → Cloudflare Worker → Teams webhook → Power Automate → [Excel row + Outlook email]
```

Why this shape:
- **Worker hides the webhook URL** from the client (otherwise anyone could spam rows).
- **Teams webhook trigger** in Power Automate is FREE — the HTTP-trigger alternative needs a Premium licence. This is the scan-and-save pattern.

---

## Part 1 — Excel file in OneDrive

1. Open Excel online (or create on desktop and save to OneDrive).
2. New workbook → save as **`UKREiiF 2026 — Email Captures.xlsx`** in your OneDrive.
3. In row 1, add headers: `Email` | `Source` | `Submitted at` | `Country` | `IP` | `User agent`
4. Select the headers + one blank row → **Insert → Table** → tick "My table has headers" → name it **`Captures`** (Table Design tab).
5. Share the file with Jess (read/edit as she prefers).

---

## Part 2 — Power Automate flow (via Teams webhook)

> Start in Teams (not Power Automate) — this gives you the free webhook trigger.

1. Open **Teams** → any channel you own → `…` menu → **Workflows** → search **"Post to a channel when a webhook request is received"** → Next → pick the team/channel → **Add workflow**.
2. Teams shows you the **webhook URL** — copy it somewhere safe. (You'll paste it into the Worker in Part 3.)
3. Open **Power Automate** (make.powerautomate.com) → **My flows** → you'll see the new flow. Open it → **Edit**.
4. **Delete** the default "Post in chat or channel" action (we don't want Teams notifications).
5. Click **+ New step** → **Excel Online (Business)** → **Add a row into a table**.
   - Location: OneDrive for Business
   - Document Library: OneDrive
   - File: `UKREiiF 2026 — Email Captures.xlsx`
   - Table: `Captures`
   - Map fields from dynamic content:
     - **Email** → `triggerBody()?['email']`
     - **Source** → `triggerBody()?['source']`
     - **Submitted at** → `triggerBody()?['submittedAt']`
     - **Country** → `triggerBody()?['country']`
     - **IP** → `triggerBody()?['ip']`
     - **User agent** → `triggerBody()?['userAgent']`
6. Click **+ New step** → **Office 365 Outlook** → **Send an email (V2)**.
   - **To:** `triggerBody()?['email']` (dynamic content)
   - **Subject:** `Your Kirklees investment pack`
   - **Body:** (HTML — paste template below, tweak to suit)
   - **From (Send As):** leave blank for now (sends from your account). When you have `invest@kirklees.gov.uk` send-as rights, set that here.
   - **Attachments:** attach the investment brochure PDF (upload or link to SharePoint).
7. **Save** the flow. Test it by posting a sample payload from the flow run history (Power Automate has a "Test" button — paste the JSON structure from the worker's payload).

### Email body template

```html
<p>Hi,</p>
<p>Thanks for requesting our investment pack — full brochure attached.</p>
<p>We've got over £3.5bn of ongoing investment reshaping Kirklees. If you'd like a conversation, just reply to this email or visit <a href="https://businesskirklees.com">businesskirklees.com</a>.</p>
<p>Looking forward to meeting you at UKREiiF.</p>
<p>— The Business Kirklees team</p>
```

### Changing the From address later

When you get access to `invest@kirklees.gov.uk`:
1. Ensure your account has **Send As** permission on that mailbox (ask Jess / IT).
2. Open the flow → Send email (V2) action → set **From (Send As)** = `invest@kirklees.gov.uk`.
3. Save. No other changes needed.

---

## Part 3 — Cloudflare Worker (proxy)

From this folder:

```bash
cd worker
npm install
npx wrangler login    # one-time
npx wrangler secret put TEAMS_WEBHOOK_URL
# (paste the Teams webhook URL from Part 2, step 2)
npx wrangler deploy
```

Deploy prints a URL like `https://business-kirklees-capture.<your-subdomain>.workers.dev`.

If your subdomain isn't `maxyouell`, update `CAPTURE_ENDPOINT` in `../index.html` to match the deployed URL. Then commit & push.

---

## Part 4 — Test end to end

1. Visit the live landing page (GitHub Pages or wherever Lewis deploys).
2. Enter a test email → submit.
3. Expected within ~30s:
   - Row appears in the Excel sheet.
   - Email arrives at the address you entered.

If it doesn't work, check:
- Power Automate flow run history (make.powerautomate.com → your flow → Runs)
- Worker logs: `cd worker && npx wrangler tail`
- Browser console for CORS/network errors

---

## Switching to Jess's tenant later

When Jess is ready to own it:
1. She creates her own flow following Part 2 (in her tenant, pointing at her OneDrive sheet).
2. She sends you the new webhook URL.
3. You run `npx wrangler secret put TEAMS_WEBHOOK_URL` and paste hers.
4. Disable your staging flow. Done — no page changes, no re-deploy of the plugin.
