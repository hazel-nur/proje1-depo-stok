"use client";
import { useList, useMe } from "@/lib/hooks";
import { ADMIN } from "@/lib/roles";
import { Alert, Card, PageHeader, Spinner } from "@/components/ui";
import { para, sayi } from "@/lib/format";

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-xs text-slate-600"><span>{label}</span><span className="font-medium">{sayi(value)}</span></div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${max ? Math.max(3, (value / max) * 100) : 0}%` }} />
      </div>
    </div>
  );
}

export default function AdminStatsPage() {
  const me = useMe().data;
  const q = useList<any>("/admin/stats", me?.role === ADMIN);
  if (me && me.role !== ADMIN) return <Alert>Bu sayfa sadece Admin içindir.</Alert>;
  if (q.isLoading || !q.data) return q.isError ? <Alert>Yüklenemedi.</Alert> : <Spinner />;
  const s = q.data;
  const roller = Object.entries(s.kullanicilar.rolDagilimi) as [string, number][];
  const maxRol = Math.max(1, ...roller.map(([, n]) => n));
  const g = s.son7Gun;
  const maxH = Math.max(1, g.giris.miktar, g.cikis.miktar, g.transfer.miktar);

  return (
    <>
      <PageHeader title="İstatistikler" desc="Sistemin genel durumu (sadece Admin)." />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Genel sayılar</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            {[["Aktif kullanıcı", s.kullanicilar.aktif], ["Ürün", s.sayilar.urun], ["Kategori", s.sayilar.kategori], ["Depo", s.sayilar.depo], ["Tedarikçi", s.sayilar.tedarikci], ["Toplam stok hareketi", s.sayilar.stokHareketi], ["Toplam stok adedi", s.stok.toplamAdet], ["Düşük stoklu ürün", s.stok.dusukStokUrunSayisi]].map(([k, v]) => (
              <div key={k as string} className="contents"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium">{sayi(v as number)}</dd></div>
            ))}
            <dt className="text-slate-500">Stok değeri</dt><dd className="text-right font-medium">{para(s.stok.toplamDeger)}</dd>
          </dl>
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Kullanıcılar (role göre)</h2>
          {roller.map(([r, n]) => <Bar key={r} label={r} value={n} max={maxRol} color="bg-indigo-500" />)}
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Son 7 günün stok hareketleri (adet)</h2>
          <Bar label={`Giriş (${g.giris.adet} işlem)`} value={g.giris.miktar} max={maxH} color="bg-emerald-500" />
          <Bar label={`Çıkış (${g.cikis.adet} işlem)`} value={g.cikis.miktar} max={maxH} color="bg-rose-500" />
          <Bar label={`Transfer (${g.transfer.adet} işlem)`} value={g.transfer.miktar} max={maxH} color="bg-indigo-500" />
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Bekleyen işler</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Bekleyen transfer talebi</dt><dd className="text-right font-medium">{s.bekleyenIsler.transferTalebi}</dd>
            <dt className="text-slate-500">Onay bekleyen satın alma</dt><dd className="text-right font-medium">{s.bekleyenIsler.satinAlmaOnayBekleyen}</dd>
            <dt className="text-slate-500">Teslim bekleyen satın alma</dt><dd className="text-right font-medium">{s.bekleyenIsler.satinAlmaTeslimBekleyen}</dd>
            <dt className="text-slate-500">Açık (uygulanmamış) sayım</dt><dd className="text-right font-medium">{s.bekleyenIsler.acikSayim}</dd>
          </dl>
        </Card>
        <Card className="md:col-span-2">
          <h2 className="mb-3 text-sm font-semibold">Silinen kayıtlar (soft delete) — toplam {s.silinenler.toplam}</h2>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            {Object.entries(s.silinenler).filter(([k]) => k !== "toplam").map(([k, v]) => (
              <div key={k} className="rounded-lg bg-slate-50 p-2"><div className="text-xs text-slate-500">{k}</div><div className="font-semibold">{v as number}</div></div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
