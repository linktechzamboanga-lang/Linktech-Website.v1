/* LinkTech Ticket Number API bridge
 * Deploy as a Cloudflare Worker.
 * Worker variables:
 *   GAS_WEB_APP_URL = deployed Apps Script URL ending /exec
 *   ALLOWED_ORIGINS = comma-separated exact frontend origins
 */
const ALLOWED_METHODS = new Set(["POST"]);

function corsHeaders(origin, allowedOrigin) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin || origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, headers || {})
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = String(env.ALLOWED_ORIGINS || "")
      .split(",").map(v => v.trim()).filter(Boolean);
    const originAllowed = !origin || allowed.includes(origin);
    const allowOrigin = origin && originAllowed ? origin : (origin ? "" : "*");
    const cors = corsHeaders(origin, allowOrigin);

    if (request.method === "OPTIONS") {
      if (origin && !originAllowed) return new Response("Origin not allowed", { status: 403 });
      return new Response(null, { status: 204, headers: cors });
    }

    if (!ALLOWED_METHODS.has(request.method)) {
      return json({ ok: false, message: "Method not allowed." }, 405, cors);
    }
    if (origin && !originAllowed) {
      return json({ ok: false, message: "Origin not allowed." }, 403);
    }
    if (!env.GAS_WEB_APP_URL || !/\/exec(?:\?|$)/.test(env.GAS_WEB_APP_URL)) {
      return json({ ok: false, message: "Worker is missing a valid GAS_WEB_APP_URL ending in /exec." }, 500, cors);
    }

    const length = Number(request.headers.get("Content-Length") || 0);
    if (length > 60000) return json({ ok: false, message: "Request is too large." }, 413, cors);

    let payload;
    try {
      const raw = await request.text();
      if (raw.length > 60000) return json({ ok: false, message: "Request is too large." }, 413, cors);
      payload = JSON.parse(raw);
    } catch (_) {
      return json({ ok: false, message: "Invalid JSON request." }, 400, cors);
    }
    if (!payload || typeof payload.action !== "string" || !payload.data || typeof payload.data !== "object") {
      return json({ ok: false, message: "Request must contain action and data." }, 400, cors);
    }

    try {
      const upstream = await fetch(env.GAS_WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        redirect: "follow"
      });
      const body = await upstream.text();
      let parsed;
      try { parsed = JSON.parse(body); }
      catch (_) {
        return json({ ok: false, message: "Apps Script did not return JSON. Check that the Web App is deployed for access by anyone and that its URL is correct." }, 502, cors);
      }
      return json(parsed, upstream.ok ? 200 : 502, cors);
    } catch (error) {
      return json({ ok: false, message: "Unable to reach Google Apps Script: " + (error.message || "upstream error") }, 502, cors);
    }
  }
};
