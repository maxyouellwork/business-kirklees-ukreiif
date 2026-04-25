const ALLOWED_ORIGINS = [
  "https://maxyouellwork.github.io",
  "https://businesskirklees.com",
  "https://www.businesskirklees.com",
  "http://localhost:8080",
  "http://localhost:3000",
];

const PACK_PDF_URL = "https://www.kirklees.gov.uk/beta/place-to-make-it/pdf/invest-in-kirklees-brochure.pdf";

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

const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;

async function handleCapture(request, env, origin) {
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
  const source = String(body.source || "ukreiif-landing").slice(0, 64);
  if (!validEmail(email)) return json({ error: "Invalid email" }, 400, origin);

  const payload = {
    email,
    source,
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
}

async function handlePackClick(request, env) {
  const url = new URL(request.url);
  const email = (url.searchParams.get("e") || "").trim();

  // Always 302 — even if logging fails or email is missing, the user shouldn't
  // be left staring at an error page. We'll just record the click as anonymous.
  const redirect = Response.redirect(PACK_PDF_URL, 302);

  if (env.CLICK_WEBHOOK_URL) {
    const payload = {
      email: validEmail(email) ? email : "",
      clickedAt: new Date().toISOString(),
      userAgent: request.headers.get("user-agent") || "",
      ip: request.headers.get("cf-connecting-ip") || "",
      country: request.cf?.country || "",
    };
    // Fire-and-forget so the redirect isn't held up.
    request.signal.throwIfAborted?.();
    fetch(env.CLICK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }

  return redirect;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("origin") || "";

    // Click tracking redirect: GET /r/pack?e=<email>
    if (url.pathname === "/r/pack") {
      return handlePackClick(request, env);
    }

    // Default: form capture endpoint.
    return handleCapture(request, env, origin);
  },
};
