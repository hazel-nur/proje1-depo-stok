import { BACKEND_URL, istemciIpBasligi, setTokens } from "@/lib/server/session";

export async function POST(request: Request) {
  const body = await request.text();
  const r = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await istemciIpBasligi()) },
    body,
    cache: "no-store",
  }).catch(() => null);

  if (!r) {
    return Response.json({ error: "Sunucuya ulaşılamadı.", code: "BACKEND_DOWN" }, { status: 502 });
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return Response.json(j, { status: r.status });

  await setTokens({ access_token: j.access_token, refresh_token: j.refresh_token });
  return Response.json({ user: j.user });
}
