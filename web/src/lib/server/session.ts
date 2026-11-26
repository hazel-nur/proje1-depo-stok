import "server-only";
import { cookies, headers } from "next/headers";

// Sunucu tarafı oturum yardımcıları: token'lar sadece httpOnly cookie'de durur,
// tarayıcıdaki JavaScript onları asla göremez.
export const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Backend hız sınırı (throttler) gerçek kullanıcı IP'sini görebilsin diye, varsa ters vekilin
// (nginx vb.) X-Forwarded-For başlığı backend'e iletilir.
export async function istemciIpBasligi(): Promise<Record<string, string>> {
  const xff = (await headers()).get("x-forwarded-for");
  return xff ? { "X-Forwarded-For": xff } : {};
}

const ACCESS = "access_token";
const REFRESH = "refresh_token";
const secure = process.env.COOKIE_SECURE === "true";

export type Tokens = { access_token: string; refresh_token: string };

export async function setTokens(t: Tokens) {
  const jar = await cookies();
  const base = { httpOnly: true, sameSite: "lax" as const, secure, path: "/" };
  jar.set(ACCESS, t.access_token, { ...base, maxAge: 15 * 60 });
  jar.set(REFRESH, t.refresh_token, { ...base, maxAge: 7 * 24 * 60 * 60 });
}

export async function clearTokens() {
  const jar = await cookies();
  jar.delete(ACCESS);
  jar.delete(REFRESH);
}

export async function readTokens() {
  const jar = await cookies();
  return { access: jar.get(ACCESS)?.value, refresh: jar.get(REFRESH)?.value };
}

// Aynı anda birden çok istek access token süresi dolduğunda yenilemeye kalkarsa
// refresh token rotation yüzünden oturum kapanırdı. Bu yüzden yenileme tek seferde yapılır.
const bekleyenYenilemeler = new Map<string, Promise<Tokens | null>>();

async function yenile(refresh: string): Promise<Tokens | null> {
  const var_olan = bekleyenYenilemeler.get(refresh);
  if (var_olan) return var_olan;
  const p = (async () => {
    try {
      const r = await fetch(`${BACKEND_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
        cache: "no-store",
      });
      if (!r.ok) return null;
      const j = await r.json();
      return { access_token: j.access_token, refresh_token: j.refresh_token } as Tokens;
    } catch {
      return null;
    }
  })();
  bekleyenYenilemeler.set(refresh, p);
  // kısa süre sonra temizle (aynı token ile gelen geç istekler de sonucu kullanabilsin)
  setTimeout(() => bekleyenYenilemeler.delete(refresh), 10_000);
  return p;
}

/**
 * Backend'e oturum cookie'siyle istek atar. Access token yoksa/geçersizse refresh token ile
 * yeniler ve yeni cookie'leri yazar. Yenileme de başarısızsa cookie'ler silinir (401 döner).
 */
export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  let { access, refresh } = await readTokens();
  const ipBaslik = await istemciIpBasligi();

  const cagir = (token?: string) =>
    fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string>),
        ...ipBaslik,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

  if (!access && refresh) {
    const t = await yenile(refresh);
    if (t) {
      await setTokens(t);
      access = t.access_token;
      refresh = t.refresh_token;
    }
  }
  if (!access) {
    await clearTokens();
    return Response.json({ error: "Oturum bulunamadı.", code: "UNAUTHORIZED" }, { status: 401 });
  }

  let res = await cagir(access);
  if (res.status === 401 && refresh) {
    const t = await yenile(refresh);
    if (t) {
      await setTokens(t);
      res = await cagir(t.access_token);
    } else {
      await clearTokens();
    }
  }
  return res;
}
