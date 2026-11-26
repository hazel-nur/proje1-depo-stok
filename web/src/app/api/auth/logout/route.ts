import { BACKEND_URL, clearTokens, readTokens } from "@/lib/server/session";

export async function POST() {
  const { access } = await readTokens();
  if (access) {
    // Backend'de refresh token'ı geçersiz kıl (hata olursa yine de cookie'leri sileriz)
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    }).catch(() => null);
  }
  await clearTokens();
  return Response.json({ ok: true });
}
