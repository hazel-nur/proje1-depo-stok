import axios, { AxiosError } from "axios";

// Tüm istekler Next.js sunucusundaki /api/proxy üzerinden gider; token cookie'de kalır.
export const api = axios.create({ baseURL: "/api/proxy" });

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      if (window.location.pathname !== "/login") {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/login"); // tam sayfa yenileme: önbellekteki kullanıcı verisi temizlensin
      }
    }
    return Promise.reject(err);
  },
);

// Backend hata gövdesi: { error, code }
export function hataMesaji(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data as { error?: string } | undefined;
    if (d?.error) return d.error;
    if (e.code === "ERR_NETWORK") return "Sunucuya ulaşılamadı.";
  }
  return e instanceof Error ? e.message : "Beklenmeyen bir hata oluştu.";
}
