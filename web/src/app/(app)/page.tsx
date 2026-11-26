"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useList, useMe } from "@/lib/hooks";
import { ADMIN, DEPO, SUBE } from "@/lib/roles";
import { Alert, Badge, Card, Empty, PageHeader, Spinner } from "@/components/ui";
import { para, sayi, tarih } from "@/lib/format";

function Stat({ label, value, href, tone }: { label: string; value: ReactNode; href?: string; tone?: "warn" | "ok" }) {
  const body = (
    <Card className={`h-full transition ${href ? "hover:border-indigo-300 hover:shadow" : ""}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${tone === "warn" ? "text-rose-600" : tone === "ok" ? "text-emerald-600" : "text-slate-900"}`}>{value}</div>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function DashboardPage() {
  const me = useMe().data;
  const admin = me?.role === ADMIN;
  const transferGorur = !!me && [ADMIN, SUBE, DEPO].includes(me.role);

  // Admin: tek çağrıda /admin/stats. Diğer roller: yetkili oldukları listelerden özet.
  const stats = useList<any>("/admin/stats", admin);
  const urunler = useList<any[]>("/products", !admin);
  const depolar = useList<any[]>("/warehouses", !admin);
  const dusuk = useList<any[]>("/warehouse-stocks/low");
  const bekTransfer = useList<any[]>("/transfer-requests?durum=BEKLIYOR", !admin && transferGorur);
  const bekSatin = useList<any[]>("/purchase-requests?durum=BEKLIYOR", !admin);
  const hareket = useList<any[]>("/stock-movements?limit=6", !admin);

  if (!me) return <Spinner />;
  const s = stats.data;

  return (
    <>
      <PageHeader title={`Hoş geldiniz, ${me.ad}`} desc={`Rol: ${me.role}`} />

      {admin && stats.isLoading && <Spinner />}
      {admin && stats.isError && <Alert>İstatistikler yüklenemedi.</Alert>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {admin && s && (
          <>
            <Stat label="Ürün" value={sayi(s.sayilar.urun)} href="/products" />
            <Stat label="Depo" value={sayi(s.sayilar.depo)} href="/warehouses" />
            <Stat label="Toplam stok adedi" value={sayi(s.stok.toplamAdet)} href="/stock" />
            <Stat label="Stok değeri" value={para(s.stok.toplamDeger)} />
            <Stat label="Düşük stoklu ürün" value={sayi(s.stok.dusukStokUrunSayisi)} href="/stock" tone={s.stok.dusukStokUrunSayisi ? "warn" : "ok"} />
            <Stat label="Bekleyen transfer" value={sayi(s.bekleyenIsler.transferTalebi)} href="/transfers" />
            <Stat label="Onay bekleyen satın alma" value={sayi(s.bekleyenIsler.satinAlmaOnayBekleyen)} href="/purchases" />
            <Stat label="Teslim bekleyen satın alma" value={sayi(s.bekleyenIsler.satinAlmaTeslimBekleyen)} href="/purchases" />
          </>
        )}
        {!admin && (
          <>
            <Stat label="Ürün" value={urunler.data ? sayi(urunler.data.length) : "…"} href="/products" />
            <Stat label="Depo" value={depolar.data ? sayi(depolar.data.length) : "…"} href="/warehouses" />
            <Stat label="Düşük stoklu ürün" value={dusuk.data ? sayi(dusuk.data.length) : "…"} href="/stock" tone={dusuk.data?.length ? "warn" : "ok"} />
            <Stat label="Onay bekleyen satın alma" value={bekSatin.data ? sayi(bekSatin.data.length) : "…"} href="/purchases" />
            {transferGorur && <Stat label="Bekleyen transfer" value={bekTransfer.data ? sayi(bekTransfer.data.length) : "…"} href="/transfers" />}
          </>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Düşük stok uyarıları</h2>
          {dusuk.isLoading ? <Spinner /> : !dusuk.data?.length ? <Empty>Düşük stoklu ürün yok.</Empty> : (
            <ul className="divide-y divide-slate-100 text-sm">
              {dusuk.data.slice(0, 6).map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="truncate">{u.ad}</span>
                  <span className="whitespace-nowrap text-xs text-slate-500">{sayi(u.stokMiktari)} / min {sayi(u.minStokSeviyesi)} <Badge tone="REDDEDILDI">−{u.eksikMiktar}</Badge></span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Son stok hareketleri</h2>
          {(() => {
            const rows: any[] | undefined = admin ? s?.sonHareketler : hareket.data;
            if (!rows) return <Spinner />;
            if (!rows.length) return <Empty />;
            return (
              <ul className="divide-y divide-slate-100 text-sm">
                {rows.slice(0, 6).map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="truncate"><Badge>{m.tip}</Badge> <span className="ml-1">{m.product?.ad}</span></span>
                    <span className="whitespace-nowrap text-xs text-slate-500">{sayi(m.miktar)} · {tarih(m.createdAt)}</span>
                  </li>
                ))}
              </ul>
            );
          })()}
        </Card>
      </div>
    </>
  );
}
