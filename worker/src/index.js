const ALLOWED_ORIGINS = [
  "https://maxyouellwork.github.io",
  "https://businesskirklees.com",
  "https://www.businesskirklees.com",
  "http://localhost:8080",
  "http://localhost:3000",
];

// Personal email providers — skip Companies House lookup for these.
const PERSONAL_DOMAINS = new Set([
  "gmail.com","googlemail.com","yahoo.com","yahoo.co.uk","hotmail.com","hotmail.co.uk",
  "outlook.com","outlook.co.uk","live.com","live.co.uk","icloud.com","me.com","mac.com",
  "aol.com","protonmail.com","proton.me","msn.com","btinternet.com","sky.com","tutanota.com",
  "virginmedia.com","talktalk.net","tiscali.co.uk","blueyonder.co.uk","ntlworld.com",
  "fastmail.com","fastmail.fm","zoho.com","yandex.com","gmx.com","mail.com",
]);

const corsHeaders = (origin) => ({
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
});

const json = (data, status, origin) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });

// Looks up a company on Companies House by guessing from the email domain.
// Returns { name, number, city } for the first active match, or null if no
// match / personal email / API key missing / error.
async function lookupCompany(email, apiKey) {
  if (!apiKey) return null;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain || PERSONAL_DOMAINS.has(domain)) return null;

  // Get the org name part of the domain (e.g. "mail.jll.com" -> "jll",
  // "foo.bar.co.uk" -> "bar")
  const parts = domain.split(".");
  let orgPart;
  if (parts.length >= 3 && parts[parts.length - 1] === "uk" && parts[parts.length - 2].length <= 3) {
    orgPart = parts[parts.length - 3]; // foo.bar.co.uk -> bar
  } else {
    orgPart = parts[parts.length - 2]; // foo.bar.com -> bar
  }
  if (!orgPart || orgPart.length < 2) return null;

  try {
    const res = await fetch(
      `https://api.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(orgPart)}&items_per_page=5`,
      { headers: { Authorization: "Basic " + btoa(apiKey + ":") } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const items = data.items || [];
    // Prefer active matches; fall back to first result if no active.
    const match = items.find((i) => i.company_status === "active") || items[0];
    if (!match) return null;
    return {
      name: match.title || "",
      number: match.company_number || "",
      city: match.address?.locality || match.address?.region || "",
    };
  } catch {
    return null;
  }
}

// LinkedIn OIDC sign-in. Two routes:
//   /auth/linkedin/start  -> redirect to LinkedIn authorize
//   /auth/linkedin/callback -> exchange code, fetch userinfo, post back to opener
async function handleLinkedInStart(request, env) {
  const url = new URL(request.url);
  const delegate = url.searchParams.get("d") || "";
  const state = btoa(JSON.stringify({ d: delegate, t: Date.now() }));
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.LINKEDIN_CLIENT_ID,
    redirect_uri: `${url.origin}/auth/linkedin/callback`,
    scope: "openid profile email",
    state,
  });
  return Response.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params}`,
    302
  );
}

async function handleLinkedInCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("Missing authorization code.", { status: 400 });
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: env.LINKEDIN_CLIENT_ID,
      client_secret: env.LINKEDIN_CLIENT_SECRET,
      redirect_uri: `${url.origin}/auth/linkedin/callback`,
    }),
  });
  if (!tokenRes.ok) {
    return new Response(`Token exchange failed (${tokenRes.status})`, { status: 502 });
  }
  const tokens = await tokenRes.json();

  // Fetch userinfo (OIDC standard endpoint — returns name, email, picture)
  const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userRes.ok) {
    return new Response(`Userinfo fetch failed (${userRes.status})`, { status: 502 });
  }
  const user = await userRes.json();

  // Pull the delegate code back out of state if present.
  let delegate = "";
  try { delegate = JSON.parse(atob(url.searchParams.get("state") || "")).d || ""; } catch {}

  const payload = {
    name: user.name || [user.given_name, user.family_name].filter(Boolean).join(" ") || "",
    email: user.email || "",
    delegate,
  };

  // Render a small page that posts the result back to the opener and closes.
  // Falls back to redirect-with-query-params if not in a popup.
  const json = JSON.stringify(payload).replace(/</g, "\\u003c");
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Signed in</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;background:#1a2234;color:#f5f0eb;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center}.dot{width:10px;height:10px;border-radius:50%;background:#d4681a;display:inline-block;margin:0 4px;animation:p 1.4s ease-in-out infinite both}.dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}@keyframes p{0%,80%,100%{opacity:.2}40%{opacity:1}}</style>
</head><body><div><p style="font-size:18px;margin-bottom:14px">Signed in. Returning to the form…</p><div><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>
<script>
(function(){
  var data = ${json};
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({ type: "linkedin-signin", data: data }, "*");
    setTimeout(function(){ window.close(); }, 250);
  } else {
    var u = new URL("https://maxyouellwork.github.io/business-kirklees-ukreiif/");
    if (data.name) u.searchParams.set("li_name", data.name);
    if (data.email) u.searchParams.set("li_email", data.email);
    if (data.delegate) u.searchParams.set("d", data.delegate);
    window.location.replace(u.toString());
  }
})();
</script></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/auth/linkedin/start") return handleLinkedInStart(request, env);
    if (url.pathname === "/auth/linkedin/callback") return handleLinkedInCallback(request, env);

    const origin = request.headers.get("origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, origin);
    }
    if (!env.TEAMS_WEBHOOK_URL) {
      return json({ error: "Webhook not configured" }, 500, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Bad JSON" }, 400, origin);
    }

    const email = String(body.email || "").trim();
    const name = String(body.name || "").trim().slice(0, 100);
    const company = String(body.company || "").trim().slice(0, 150);
    const source = String(body.source || "ukreiif-landing").slice(0, 64);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return json({ error: "Invalid email" }, 400, origin);
    }

    // Best-effort enrichment from the email's domain. Doesn't block on errors —
    // returns null and we just send empty strings to PA.
    const ch = await lookupCompany(email, env.COMPANIES_HOUSE_API_KEY);

    const payload = {
      email,
      name,
      company,
      source,
      chMatch: ch?.name || "",
      chCity: ch?.city || "",
      chNumber: ch?.number || "",
      submittedAt: new Date().toISOString(),
      userAgent: request.headers.get("user-agent") || "",
      ip: request.headers.get("cf-connecting-ip") || "",
      country: request.cf?.country || "",
    };

    try {
      const upstream = await fetch(env.TEAMS_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!upstream.ok) {
        return json({ error: "Upstream error", status: upstream.status }, 502, origin);
      }
      return json({ ok: true }, 200, origin);
    } catch {
      return json({ error: "Upstream unreachable" }, 502, origin);
    }
  },
};
