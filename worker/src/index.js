const ALLOWED_ORIGINS = [
  "https://maxyouellwork.github.io",
  "https://businesskirklees.com",
  "https://www.businesskirklees.com",
  "http://localhost:8080",
  "http://localhost:3000",
];

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

export default {
  async fetch(request, env) {
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

    const payload = {
      email,
      name,
      company,
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
  },
};
