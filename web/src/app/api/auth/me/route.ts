import { backendFetch } from "@/lib/server/session";

export async function GET() {
  const r = await backendFetch("/auth/me").catch(() => null);
  if (!r) {
    return Response.json({ error: "Sunucuya ulaşılamadı.", code: "BACKEND_DOWN" }, { status: 502 });
  }
  const j = await r.json().catch(() => ({}));
  return Response.json(j, { status: r.status });
}
