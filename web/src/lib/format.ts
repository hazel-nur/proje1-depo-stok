export const para = (n: number | null | undefined) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n ?? 0);

export const sayi = (n: number | null | undefined) => new Intl.NumberFormat("tr-TR").format(n ?? 0);

export const tarih = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })
    : "—";

export const DURUM_ETIKET: Record<string, string> = {
  BEKLIYOR: "Bekliyor",
  ONAYLANDI: "Onaylandı",
  REDDEDILDI: "Reddedildi",
  IPTAL: "İptal",
  TESLIM_ALINDI: "Teslim alındı",
  ACIK: "Açık",
  UYGULANDI: "Uygulandı",
  GIRIS: "Giriş",
  CIKIS: "Çıkış",
  TRANSFER: "Transfer",
};
