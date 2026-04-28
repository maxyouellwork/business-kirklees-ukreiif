# Business Kirklees · Invest in Kirklees lander
## Full technical brief — UKREiiF 2026

**Author:** Max Youell · Comms · Kirklees Council
**Date:** 28 April 2026
**Purpose:** A complete record of what the site does, what technologies it uses, what data it touches, where that data goes, and where it falls short. Written so the council web team, legal, comms, and the inward investment team can audit the system without surprises.

---

## 1. What the site is

A single-page web app that does two related jobs:

1. **Public landing page** for "Invest in Kirklees" content during UKREiiF 2026 (19–21 May, Leeds). Hero video, headline stats, project cards, news, contact info.
2. **Lead capture surface** triggered when a delegate scans a personalised QR code on a Kirklees Council lanyard at the event. Each of 8 council delegates has a unique short code (`?d=js` for Jess Newbould, `?d=jb` for James Barker, etc.). Scanning the QR opens the page in "delegate mode": a fullscreen "Let's connect." splash with a slide-up form pre-attributed to that team member.

The page is one HTML file (`index.html`) with CSS and JavaScript inlined. There is no build step, no framework, no database in the page itself. All dynamic behaviour happens client-side or via a small Cloudflare Worker.

---

## 2. Where it lives

| Component | Hosted on | URL |
|---|---|---|
| Static page (current preview) | GitHub Pages | https://maxyouellwork.github.io/business-kirklees-ukreiif/ |
| Static page (planned production) | businesskirklees.com via WordPress plugin | TBC — Lewis to confirm path |
| Capture endpoint (Cloudflare Worker) | Cloudflare Workers | https://business-kirklees-capture.maxyouell-work.workers.dev |
| Power Automate flow | Microsoft 365 (Power Automate) | Triggered by webhook from the Worker |
| Excel sheet (lead log) | SharePoint Online (Business Kirklees site) | Accessed via Power Automate "Excel Online (Business)" connector |
| Auto-reply email | Office 365 Outlook (Business Kirklees mailbox) | Sent via Power Automate "Send an email (V2)" |

There is no separate database. The Excel sheet IS the lead log.

---

## 3. The page, section by section

The page is split into clearly separated sections. Each one explains exactly what's on screen.

### 3.1 Loader
A 0.8-second navy splash shown while the page loads. Displays the Business Kirklees mark.
- Skipped entirely for users who have `prefers-reduced-motion: reduce` set in their OS — no flash, no animation.

### 3.2 Hero
Full-viewport intro section.
- **Background:** Looping muted MP4 of Kirklees regeneration footage (`kirklees_v9_nographics-Original-1-1.mp4`, hosted on businesskirklees.com).
- **Overlay:** Multi-stop gradient overlay so text always meets WCAG contrast ratios regardless of which video frame is showing.
- **Headline:** "Invest in **Kirklees.**"
- **Sub:** "At the heart of the Northern Powerhouse. £3.5bn of ongoing investment reshaping our district."
- **CTA button:** "Explore opportunities" → scrolls to the Pitch section.
- **Pause/Play button (top-right):** Lets keyboard and mouse users stop the looping video at any time. Required for WCAG 2.2.2.
- **Scroll hint** at bottom — animated mouse-wheel pictogram. Hidden for reduced-motion users.

### 3.3 Pitch
Cream section directly below the hero with the headline figure.
- Animated counter: "£0bn → £9.7bn — Annual economy"
- Statement: "£3.5bn of ongoing investment is transforming Kirklees…"
- **Capture form:** single-field email capture. See section 5.1.

### 3.4 Stats grid
Eight key stat tiles in a 4-column grid (2-col on small screens):
- 15k Businesses
- 40k Graduates / yr
- £250m Huddersfield Blueprint
- £210m Cultural Heart
- £200m Dewsbury Blueprint
- £70m Gigabit Fibre
- 7m People within 1hr
- 2nd Best place to start a business

### 3.5 Investment pipeline (dark section)
- Tag: "Opportunities"
- H2: "Investment pipeline"
- Four image cards linking to the relevant BK pages:
  - Huddersfield Blueprint (£250m+)
  - Dewsbury Blueprint (£200m)
  - Station to Stadium (New for 2026)
  - Employment & Industrial (Development-ready)
- Animated counter: "Total investment pipeline — £0m → £3.5bn+"
- Three icon-led cards linking to:
  - Skills & Workforce → businesskirklees.com/reasons-to-invest/
  - Inward Investment → businesskirklees.com/investment-opportunities/
  - Gigabit Infrastructure → businesskirklees.com/reasons-to-invest/

### 3.6 Connectivity
Cinematic section with a darkened backdrop image and a stylised departure board showing journey times: Leeds 25min, Manchester 35min, Sheffield 40min, London 2:30hrs.

### 3.7 News
Three latest news items linking to BK articles:
- 12 Mar — "Huddersfield's new library hub opening this September"
- 16 Dec — "Helping Kirklees businesses to Thrive"
- 04 Dec — "Regeneration plans for Marsden approved"

Action bar with two buttons:
- **Share** — uses `navigator.share` on mobile (system share sheet), falls back to copying URL to clipboard on desktop with a "Copied!" confirmation.
- **Investment brochure (PDF)** — opens the official council brochure PDF in a new tab.

### 3.8 Contact card
A "business card" component displaying:
- Business & Regeneration · Kirklees Council
- Phone: 01484 221000 (`tel:` link)
- Email: invest@kirklees.gov.uk (`mailto:` link)
- Web: businesskirklees.com (opens in new tab)
- A "Save to contacts" button below it. Clicking generates a vCard file (`.vcf`) and triggers download — works with iOS, Android, macOS Contacts, Outlook, Google Contacts.

### 3.9 Footer
- Kirklees Council logo
- Tag: "Kirklees. An exceptional place to do business."
- Social icons: LinkedIn, YouTube
- Links: Accessibility statement, Cookies policy, Privacy notice
- Copyright: businesskirklees.com · © Kirklees Council

---

## 4. Delegate mode (the QR-scan flow)

When the URL has a `?d=<code>` parameter that matches a known code, the page enters **delegate mode**:

1. A fullscreen navy splash (`Let's / connect.`) covers the page above the public content.
2. A white bottom-sheet modal slides up with:
   - A circular avatar (initials) of the team member
   - "Introduced by [Name]"
   - Their role
   - Their council email (`mailto:` link)
   - Heading: "Get your investment pack"
   - "Sign in with LinkedIn" button (one-tap form fill)
   - Three required fields: Name, Company, Email
   - Submit button: "Get my pack"
   - Privacy notice link
3. Pressing the close (X) dismisses both layers and reveals the public lander underneath.

**The 8 delegate codes** (defined in the page source — see `DELEGATES` object):

| Code | Name | Role |
|---|---|---|
| `js` | Jess Newbould | Inward Investment Project Officer |
| `jb` | James Barker | Inward Investment Project Officer |
| `cd` | Chris Duffill | Head of Business, Economy & Growth |
| `tf` | Thomas Fish | Head of Town Centre Programmes |
| `jo` | Joanne Bartholomew | Director of Development |
| `ds` | David Shepherd | Executive Director for Place |
| `dw` | David Wildman | Service Director · Regeneration & Skills |
| `pj` | Phil Jones | Service Director · Homes & Neighbourhoods |

If the code doesn't match (or there's no `?d=` param), the page just shows the regular public lander.

**Why per-delegate codes?** So every lead captured at the event can be tagged in Excel with whoever made the introduction. Helps the team know who to follow up with.

---

## 5. The forms — what they do, where the data goes

### 5.1 Public capture form (one field)
- Single email input + "Get investment pack" button
- Submitted JSON to Worker:
  ```json
  { "email": "...", "source": "ukreiif-landing" }
  ```

### 5.2 Delegate mode form (three fields + LinkedIn)
- Name, Company, Email — all required, all client-side validated
- Submitted JSON to Worker:
  ```json
  { "name": "...", "company": "...", "email": "...", "source": "delegate-js" }
  ```
- Or, if "Sign in with LinkedIn" used: a popup is opened to the Worker's `/auth/linkedin/start` endpoint, which redirects to LinkedIn's OAuth. After auth, name and email are returned and pre-fill the form.

Both forms perform client-side validation before submission and display inline error messages announced to screen readers (`role="alert"`).

---

## 6. The Cloudflare Worker — full pipeline

**Source:** `worker/src/index.js` (~225 lines of JavaScript).

The Worker is a single Cloudflare Worker function that handles all server-side logic. It has three responsibilities:

### 6.1 `POST /` — capture endpoint
- Accepts JSON with `{ email, name, company, source }`
- Validates email format and length (≤254 chars, RFC-ish regex)
- **Companies House lookup:** if the email domain is not a personal provider (gmail.com, yahoo.com, etc — full list of 30+ in the source), the Worker:
  - Extracts the org-name part of the domain (e.g. `mail.jll.com` → `jll`, `foo.bar.co.uk` → `bar`)
  - Calls `https://api.company-information.service.gov.uk/search/companies?q=<org>` with HTTP Basic auth (the API key)
  - Picks the first active match (or first result if none active)
  - Returns `{ name, number, city }` of that company
  - If the lookup fails for any reason, it silently returns `null` — capture is never blocked by enrichment
- Builds the final payload:
  ```json
  {
    "email": "...",
    "name": "...",
    "company": "...",
    "source": "ukreiif-landing | delegate-<code>",
    "chMatch": "JLL Limited",
    "chCity": "London",
    "chNumber": "01188567",
    "submittedAt": "2026-04-28T13:42:11.000Z",
    "userAgent": "Mozilla/5.0...",
    "ip": "<IPv4 from Cloudflare>",
    "country": "GB"
  }
  ```
- POSTs that payload to Power Automate via `TEAMS_WEBHOOK_URL` (a free Workflows webhook, no Premium licence needed)
- Returns `{ ok: true }` on success, `{ error: "..." }` on failure

### 6.2 `GET /auth/linkedin/start`
- Reads `?d=<delegate-code>` from query
- Builds an OAuth state token (base64-encoded JSON containing the delegate code + timestamp)
- Redirects to LinkedIn's OAuth `authorize` endpoint with the council's LinkedIn Client ID and `openid profile email` scopes

### 6.3 `GET /auth/linkedin/callback`
- LinkedIn redirects here with `?code=…&state=…`
- Worker exchanges the code for an access token at LinkedIn's token endpoint
- Calls LinkedIn's `userinfo` endpoint to get the user's name and verified email
- Renders a small HTML page that:
  - `postMessage`s the user data back to the parent window (the lander) and closes the popup
  - Or, if the popup was blocked / window not detected, redirects back to the lander with `li_name=…&li_email=…` query params

LinkedIn never sees the user's company. We only get name + verified email. Anything beyond that requires LinkedIn Partner approval.

### 6.4 Worker secrets
Stored as Cloudflare Worker secrets, never in source code:
- `TEAMS_WEBHOOK_URL` — Microsoft Power Automate webhook URL
- `COMPANIES_HOUSE_API_KEY` — Companies House Public Data API key
- `LINKEDIN_CLIENT_ID` — LinkedIn OIDC client ID
- `LINKEDIN_CLIENT_SECRET` — LinkedIn OIDC client secret

### 6.5 CORS
The Worker only accepts POSTs from a fixed allow-list of origins:
- `https://maxyouellwork.github.io`
- `https://businesskirklees.com`
- `https://www.businesskirklees.com`
- `http://localhost:8080` and `http://localhost:3000` (development)

---

## 7. Power Automate flow

The Worker forwards each capture into a Microsoft Power Automate flow on the **free Microsoft 365 Workflows tier** (no Premium licence needed). The flow is owned in the Business Kirklees / Investment team's Microsoft tenant.

### 7.1 Flow trigger
- Workflows webhook (free) — receives the JSON payload from the Worker

### 7.2 Action 1 — Add a row to Excel
- **Connector:** Excel Online (Business)
- **File:** A workbook on the Business Kirklees SharePoint site with a Table called "Leads" (or similar)
- **Columns mapped from payload:**
  1. Submitted at (timestamp)
  2. Name
  3. Email
  4. Company (typed by user)
  5. CH match (Companies House name)
  6. CH city
  7. CH number
  8. Source (`ukreiif-landing` or `delegate-<code>`)
  9. Country (from Cloudflare)
  10. IP address
  11. User agent
  12. (one more — currently the original company field as cross-check, can be confirmed)

### 7.3 Action 2 — Send email (V2)
- **Connector:** Office 365 Outlook
- **From:** Currently sent from Max's mailbox during testing — needs swapping to `invest@kirklees.gov.uk` once the Investment team grants send-as access (pending action)
- **To:** the email address submitted by the lead
- **Subject:** "Your Kirklees investment pack"
- **Body:** Personalised greeting, link to the brochure PDF, contact info. Uses an inline expression so the closing line is date-aware:
  - Before 19 May: "Hope to see you at UKREiiF"
  - 19–21 May: "Hope to connect with you at UKREiiF"
  - After 21 May: "Looking forward to speaking"

### 7.4 Action 3 — Post a card in Teams
The flow optionally posts a card into the Investment team's Teams chat each time a lead lands, so the team gets a real-time notification. (This was originally an adaptive-card action that we deleted because it required a Premium licence; current setup is the simpler "post message" action that works on the free tier.)

---

## 8. External services and dependencies — every single one

### 8.1 Scripts loaded in `<head>`
| Source | What it does | Size |
|---|---|---|
| cdn.jsdelivr.net/npm/lenis@1.1.18 | Smooth-scroll library | ~5KB |
| cdn.jsdelivr.net/npm/gsap@3.12.7 | Animation library | ~70KB |
| cdn.jsdelivr.net/npm/gsap@3.12.7/dist/ScrollTrigger.min.js | GSAP plugin for scroll-driven animation | ~25KB |
| cdn.jsdelivr.net/npm/canvas-confetti@1.9.3 | Tiny confetti effect on form success | ~10KB |
| fonts.googleapis.com (JetBrains Mono) | Monospace font for stat numbers | ~30KB |

### 8.2 Local fonts (in the `fonts/` directory)
- VAG Rounded (display headings) — bold + light
- D-DIN (body sans-serif) — regular + bold

### 8.3 Images and video
- All hero/section imagery is fetched from `businesskirklees.com/wp-content/uploads/...` — i.e. the council's own WordPress media library. We're not hot-linking from anywhere else.
- The hero video is `kirklees_v9_nographics-Original-1-1.mp4` from the same WordPress library.
- The hero "poster" frame (shown before video plays) is `22054_213_Aerial_Night-scaled.jpg` from the same source.
- The favicon is `favicon.png` from the same source.
- For lanyard QR codes only, `api.qrserver.com` is used to render the codes once at print time. This is **not** called from the live page — only when generating the printed lanyards.

### 8.4 Third-party APIs called by the Worker
| Service | Endpoint | Purpose |
|---|---|---|
| Companies House Public Data | `api.company-information.service.gov.uk/search/companies` | Look up company name from email domain |
| LinkedIn OAuth | `linkedin.com/oauth/v2/authorization` and `/accessToken` | Sign-in flow |
| LinkedIn API | `api.linkedin.com/v2/userinfo` | Get name + verified email of signed-in user |
| Power Automate | `prod-XX.westeurope.logic.azure.com/...` (the webhook URL) | Forward the lead into the flow |

### 8.5 What the page does NOT use
- **No analytics tracker.** No Google Analytics, no Facebook Pixel, no Hotjar, no anything.
- **No third-party cookies.** The page sets no cookies of its own.
- **No A/B testing tool.**
- **No remote config or feature flags.**
- **No CDN edge functions modifying content.**
- **No fingerprinting libraries.**

The only network traffic that leaves the page when a user lands on it is: fetching the inline scripts (jsDelivr CDN), fetching JetBrains Mono (Google Fonts CDN), fetching images/video from businesskirklees.com, and — only if the user submits a form — POSTing their form data to the council's Cloudflare Worker.

---

## 9. Data captured per lead

For each form submission, the Excel sheet records the following:

| Field | Source | Why |
|---|---|---|
| Email | Submitted by user | Required — for sending the pack |
| Name | Submitted by user (delegate mode) or LinkedIn | For personalisation |
| Company | Submitted by user | For lead context |
| Companies House match | Worker lookup from email domain | Helps the team verify and prioritise |
| Companies House number | Worker lookup | Tied to UK companies register |
| Companies House city | Worker lookup | Geographic context |
| Source | URL / delegate code | Attribution to whichever team member introduced the lead, or to the public landing |
| Submitted at | Server time | Audit trail |
| Country | Cloudflare's IP geolocation | Quick filter for UK vs international leads |
| IP address | HTTP request header (`cf-connecting-ip`) | Audit trail; debugging spam |
| User agent | HTTP request header | Debugging |

No other data is collected. We do not request, capture, or store: phone numbers, postal addresses, dates of birth, payment details, identity documents, or session tokens.

---

## 10. GDPR and privacy

### 10.1 Notices shown to the user
- A privacy line under the form: *"We'll send you our investment pack and add you to our contact list."*
- A link to the council's existing privacy notice for the Investment team:
  `https://www.kirklees.gov.uk/beta/information-and-data/pdf/privacy-notice-business-investment-team.pdf`
- The link is marked "(opens in new tab)" for screen readers.

### 10.2 Lawful basis
- **Consent** — the user is filling in a form to request the pack
- **Legitimate interest** — onward inclusion in the council's investment contact list (covered by the Investment team's existing privacy notice)

### 10.3 Where data lives
- During transit: TLS 1.2/1.3, HTTPS-only
- In Cloudflare Worker: payload is processed in memory and forwarded; nothing persistent stored on Cloudflare
- In Power Automate: the flow run history retains payloads for ~28 days by default
- In Excel: indefinitely (subject to council retention policy)
- In Outlook sent items: per Outlook retention

### 10.4 Right-to-be-forgotten
A request to delete a lead is handled by manually removing the row from the Excel sheet and deleting the auto-reply email from sent items. The Worker holds nothing, so nothing to delete there.

### 10.5 Personal email handling
The Worker explicitly skips Companies House lookup for the 30+ known personal email domains (gmail.com, yahoo.com, hotmail.com, outlook.com, icloud.com, aol.com, btinternet.com, etc.). Personal-domain submissions still capture the email and any user-typed company name; they just don't get an automatic Companies House match.

---

## 11. Accessibility

The page passes:
- **WCAG 2.1 Level AA** — all required success criteria
- **WCAG 2.2** — extends AA with the new criteria (focus appearance, dragging, target size 24×24+)
- **Lighthouse Accessibility:** 100/100 on both `/` and `/?d=js`
- **axe-core 4.10:** 0 violations on AA, AAA, and best-practice rule sets

Specific implementations:
- `lang="en-GB"`
- Skip-to-content link (visible on keyboard focus)
- `<main>`, `<header>`, `<footer>`, `<section>` landmarks throughout
- Hero text contrast ≥ 4.5:1 against the worst-case video frame (multi-stop overlay ensures this)
- Hero video: aria-hidden, has play/pause toggle, paused automatically for reduced-motion users
- `prefers-reduced-motion` honoured: skips loader, GSAP, Lenis smooth scroll, video autoplay, and confetti
- Body text minimum 14px, most labels 12px+, headlines responsive
- Form inputs ≥48px tall on mobile (large touch targets, exceeds WCAG 2.5.5 24px minimum)
- Required form fields marked with both colour AND text ("Fields marked * are required")
- `aria-invalid` flips to `true` on validation failure, `aria-required` set on required inputs
- Errors announced via `role="alert"` regions (immediate) and successes via `role="status"` (polite)
- Modal: focus trap, `inert` on backdrop content while open, focus returns to skip-link when dismissed
- Visible `:focus-visible` outline on every interactive element (3px orange or white depending on background)
- Decorative SVGs all marked `aria-hidden="true"` and `focusable="false"`
- All images have descriptive `alt`, decorative ones have `alt=""`
- One `<h1>` per page; clean heading hierarchy
- Smooth scroll uses Lenis (programmatic) so users can still cancel; doesn't break browser back/forward

Reports for evidence:
- `lighthouse-a11y-main.html`
- `lighthouse-a11y-delegate.html`
- `lighthouse-score-main.png`
- `lighthouse-score-delegate.png`

---

## 12. Performance

- One HTML file, ~50KB before scripts.
- Total external JS: ~110KB minified
- Total external CSS: 0 (all inline)
- Fonts: ~150KB total, loaded with `font-display: swap`
- Hero video is `<video poster=...>` so the poster shows immediately; video downloads after.
- All images use `loading="lazy"` below the fold.
- No bundling step — the file ships as you read it. Zero build complexity.

---

## 13. Browser support

Tested on:
- iOS Safari 17+ (the most likely device at UKREiiF — phones)
- Chrome 119+ (desktop & Android)
- Firefox 119+
- Safari 16+ (macOS)
- Edge 119+

Falls back gracefully on older browsers:
- No `prefers-reduced-motion` support → animations run normally
- No `navigator.share` → copies URL to clipboard instead
- No `navigator.vibrate` → silently skipped
- LinkedIn popup blocked → falls back to redirect with query-param prefill

Internet Explorer is not supported. (No browser this old will be at the conference.)

---

## 14. Failure modes — what happens when X breaks

| Thing that breaks | What the user sees | What the team sees |
|---|---|---|
| User has no JavaScript | Page renders with content but animations don't fire and forms don't submit | No lead captured — but page is still readable as a static document |
| jsDelivr CDN is down | Page renders without animations, but content is fully visible | Forms still work |
| Google Fonts is down | Page falls back to system monospace for stat numbers | Cosmetic only |
| Hero video fails to load | Poster image stays | Cosmetic only |
| User submits invalid email | Inline error: "Please enter a valid email address" + screen-reader announcement | No lead captured |
| Worker is down | "Something went wrong — please try again or email invest@kirklees.gov.uk" | No lead captured; user has fallback |
| Companies House API is down | Lead captured normally; `chMatch`/`chCity`/`chNumber` are empty strings | Excel row goes through, just without enrichment |
| LinkedIn OAuth fails | User can still fill the form manually | No degradation |
| LinkedIn popup is blocked | Fallback redirect with `li_name`/`li_email` query params pre-fills the form | No degradation |
| Power Automate is down | Worker returns 502; page shows the error message | No lead captured |
| Excel "Add row" fails | Power Automate logs an error in flow history | Auto-reply may still go out depending on flow design |
| User dismisses the delegate splash | Underlying public page is visible — they can still browse | They can re-trigger by reloading or scanning the QR again |

---

## 15. Files in the repo

```
linkinbio-bk/
├── index.html              ← The entire lander (HTML + CSS + JS, ~700 lines)
├── fonts/                  ← VAG Rounded + D-DIN local fonts
├── ukreiif-white.png       ← UKREiiF logo (white version)
├── turbine-graphic.png     ← Wind turbine illustration on contact card
├── departure-board.jpg     ← Train departures background image
├── kirklees-map.svg        ← (banked, unused on current page)
├── worker/
│   ├── src/index.js        ← Cloudflare Worker source
│   ├── wrangler.toml       ← Worker deployment config
│   └── package.json        ← Worker dependencies (none in production)
├── lanyards/
│   ├── lanyard-preview.html ← Per-delegate lanyard print template
│   ├── render-preview.mjs   ← Puppeteer script that turns the template into a PNG
│   ├── bk-mark.png          ← Business Kirklees ident
│   └── kc-logo.png          ← Kirklees Council logo
├── lighthouse-a11y-main.html      ← Lighthouse a11y report — public page (100/100)
├── lighthouse-a11y-delegate.html  ← Lighthouse a11y report — delegate mode (100/100)
├── lighthouse-score-main.png      ← Score screenshot
├── lighthouse-score-delegate.png  ← Score screenshot
├── presentation/
│   ├── index.html                 ← Internal slide deck for the team
│   └── business-kirklees-team-brief.pdf
└── TECHNICAL_BRIEF.md     ← This document
```

---

## 16. Deployment / update process

### 16.1 Updating the page
1. Edit `index.html` locally
2. Commit and push to `main` on GitHub
3. GitHub Pages re-deploys within ~30 seconds
4. Cloudflare CDN cache may take up to 5 minutes to refresh

### 16.2 Updating the Worker
1. Edit `worker/src/index.js`
2. From `worker/`: `npx wrangler deploy`
3. Live within ~10 seconds globally

### 16.3 Once the WordPress plugin is approved
- A separate plugin file will be packaged that loads the lander as either an iframe or a hybrid (HTML markup + remote-loaded CSS/JS) inside a Business Kirklees page.
- Lewis (council web team) installs the plugin in WordPress; from then on, all updates happen via the GitHub repo without any WP admin involvement.

### 16.4 Rolling back
- Page: `git revert <commit>` and push.
- Worker: `npx wrangler rollback` (instant to previous version).

---

## 17. Tech stack summary (one-liner per item)

| Tech | Purpose |
|---|---|
| HTML5 | Document structure |
| CSS3 (custom properties, grid, flex, clamp) | Layout and theme |
| Vanilla JavaScript (no framework) | Interactivity |
| GSAP + ScrollTrigger | Hero animation, scroll-driven reveals |
| Lenis | Smooth scroll on mouse-wheel |
| canvas-confetti | One-line celebration effect on form success |
| Cloudflare Workers | Serverless edge function for capture + LinkedIn OAuth + Companies House lookup |
| Microsoft Power Automate (Workflows free tier) | Flow that writes to Excel and sends auto-reply |
| Microsoft 365 — Excel Online + Outlook + Teams | Lead destination |
| Companies House Public Data API | Email-domain → company enrichment |
| LinkedIn OIDC | One-tap form fill |
| GitHub Pages | Static page host (current preview) |
| WordPress + Elementor Pro | Future production host (via plugin) |

---

## 18. What I would change if I had unlimited time

A truthful list, so we're not pretending the work is "finished":
- Replace the inline script bundles with a build step so the JS is split into critical/below-fold chunks
- Add proper error boundaries with Sentry or similar (currently errors only surface in browser console)
- Add a public sitemap.xml + open-graph image once the page is at its production URL
- Run a proper screen-reader walkthrough with NVDA and VoiceOver (rather than just automated tooling)
- Add reduced-data variants of the hero video (a 200KB version for slow connections)
- Schedule a Lighthouse run weekly via GitHub Actions to catch regressions

None of these are blockers. Listed only in the spirit of full disclosure.

---

## 19. Contact

Built and maintained by Max Youell · Comms · Kirklees Council. Questions to **maxyouell.work@gmail.com**.
