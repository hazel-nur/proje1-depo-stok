import type { NextRequest } from "next/server";
import { backendFetch } from "@/lib/server/session";

// Tarayıcı -> /api/proxy/* -> backend. Cookie'deki token Authorization başlığına çevrilir.
async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const hedef = "/" + path.map(encodeURIComponent).join("/");

  // Giriş/çıkış kendi route'larında yapılır; token uçları tarayıcıya açılmaz
  if (path[0] === "auth") {
    return Response.json({ error: "Bulunamadı.", code: "NOT_FOUND" }, { status: 404 });
  }

  // Basit CSRF koruması: değiştiren isteklerde Origin, sitenin kendisi olmalı
  if (req.method !== "GET") {
    const origin = req.headers.get("origin");
    if (origin && new URL(origin).host !== req.headers.get("host")) {
      return Response.json({ error: "Geçersiz istek kaynağı.", code: "FORBIDDEN" }, { status: 403 });
    }
  }

  const body = req.method === "GET" || req.method === "DELETE" ? undefined : await req.text();
  const r = await backendFetch(hedef + req.nextUrl.search, {
    method: req.method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body || undefined,
  }).catch(() => null);

  if (!r) {
    return Response.json({ error: "Sunucuya ulaşılamadı.", code: "BACKEND_DOWN" }, { status: 502 });
  }
  const text = await r.text();
  return new Response(text || null, {
    status: r.status,
    headers: { "Content-Type": r.headers.get("content-type") ?? "application/json" },
  });
}

export { handle as GET, handle as POST, handle as PATCH, handle as PUT, handle as DELETE };
