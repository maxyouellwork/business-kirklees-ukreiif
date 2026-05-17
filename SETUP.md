# Email Capture — Setup Guide

The landing page email signup flows through:

```
Page form → Cloudflare Worker → Teams webhook → Power Automate → [Excel row + Outlook email]
```

Why this shape:
- **Worker hides the webhook URL** from the client (otherwise anyone could spam rows).
- **Teams webhook trigger** in Power Automate is FREE — the HTTP-trigger alternative needs a Premium licence. (The separate Scan & Save flow — **Part 5** — uses the same free-webhook trick.)

> **Two capture paths feed this system.** Parts 1–4 cover the **landing-page form**. The **Scan & Save** badge-scanning app is a separate path with its own flow — see **Part 5**. Both write to the same workbook but to different tables, and both email from `communication@` / reply-to `invest@`.

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
   - **From (Send As):** `communication@kirklees.gov.uk` (requires the Outlook connection account to have **Send As** permission on that shared mailbox — see note below).
   - **Reply To:** `invest@kirklees.gov.uk` — under **Show advanced options** → **Reply To**. Replies go to the Investment team even though the mail is sent from the Comms mailbox.
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

### From / Reply-To convention

Mail sends **from** `communication@kirklees.gov.uk` (the Comms shared mailbox) and **replies go to** `invest@kirklees.gov.uk` (the Investment team). To set this on the flow:

1. Open the flow → **Send an email (V2)** action.
2. **From (Send As):** `communication@kirklees.gov.uk`.
3. **Show advanced options** → **Reply To:** `invest@kirklees.gov.uk`.
4. Save.

**Send As permission is required.** The Outlook connection used by the flow (currently Max's account) must have **Send As** on `communication@kirklees.gov.uk`, or the flow run will fail with an authorization error. If it isn't granted yet, ask Comms / IT to add it before switching the From address. The **Reply To** header needs no special permission.

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

## Part 5 — Scan & Save flow (event badge scanning)

`Scan & Save` is a **separate Cloudflare Pages app** — `scan-and-save.pages.dev` — **not in this repo**. At the event a rep scans a contact and the app POSTs a JSON payload to its own Teams webhook, which triggers the Power Automate flow **"Scan & Save — UKREiiF"** (a sibling of the lander flow, same tenant; flow id `9f656a0a-63b4-4298-a89f-3523da1d7b9b`).

Payload fields the scanner sends: `contactName`, `contactCompany`, `contactEmail`, `delegate`, `event`, `emailSubject`, `emailBody`.

The flow:
1. **Add a row into a table** → same workbook (`UKREiiF 2026 — Email Captures.xlsx`) but a **separate `Scans` table** on its own sheet, so scanned contacts stay distinct from lander captures (which go to the `Captures` table). Columns: `Submitted at`, `Name`, `Company`, `Email`, `Delegate`, `Event`. This step runs **before** the email, so a card with no email is still logged.
2. **Send an email (V2)** → the brochure, **To** `contactEmail`, **From** `communication@kirklees.gov.uk`, **Reply To** `invest@kirklees.gov.uk` (same convention as the lander flow).

> **Power Automate field tip:** to map a payload field, click straight into the parameter box and type the expression with a leading `@` — e.g. `@triggerBody()?['contactName']`. It's stored as a real expression. Don't use the fx / expression-editor panel; it's unreliable to drive.

There is **no** separate "skip email if the card has no email" condition — not needed, because the row is logged before the email runs. A card with no email still appears in `Scans`; only that run's email step shows as failed (no wrong email is ever sent).

---

## Switching to Jess's tenant later

When Jess is ready to own it:
1. She creates her own flow following Part 2 (in her tenant, pointing at her OneDrive sheet).
2. She sends you the new webhook URL.
3. You run `npx wrangler secret put TEAMS_WEBHOOK_URL` and paste hers.
4. Disable your staging flow. Done — no page changes, no re-deploy of the plugin.
