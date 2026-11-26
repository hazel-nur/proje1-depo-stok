"use client";
import { useState } from "react";
import { useList } from "@/lib/hooks";
import { Alert, Badge, Card, Empty, PageHeader, Select, Spinner, Table, Td } from "@/components/ui";
import { sayi } from "@/lib/format";

export default function StockPage() {
  const [tab, setTab] = useState<"depo" | "dusuk">("depo");
  const [wid, setWid] = useState("");
  const depolar = useList<any[]>("/warehouses");
  const stok = useList<any[]>(`/warehouse-stocks${wid ? `?warehouseId=${wid}` : ""}`, tab === "depo");
  const dusuk = useList<any[]>("/warehouse-stocks/low", tab === "dusuk");

  const tabBtn = (k: "depo" | "dusuk", t: string) => (
    <button onClick={() => setTab(k)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === k ? "bg-indigo-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>{t}</button>
  );

  return (
    <>
      <PageHeader title="Stok Durumu" desc="Depo başına stok miktarları ve düşük stok uyarıları." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tabBtn("depo", "Depo bazında")}
        {tabBtn("dusuk", `Düşük stok${dusuk.data ? ` (${dusuk.data.length})` : ""}`)}
        {tab === "depo" && (
          <Select className="ml-auto max-w-xs" value={wid} onChange={(e) => setWid(e.target.value)} aria-label="Depo filtresi">
            <option value="">Tüm depolar</option>
            {depolar.data?.map((d) => <option key={d.id} value={d.id}>{d.ad}</option>)}
          </Select>
        )}
      </div>

      {tab === "depo" ? (
        stok.isLoading ? <Spinner /> : stok.isError ? <Alert>Yüklenemedi.</Alert> : !stok.data?.length ? <Card><Empty>Stok kaydı yok.</Empty></Card> : (
          <Table head={["Depo", "Ürün", "SKU", "Miktar"]}>
            {stok.data.map((s) => (
              <tr key={s.id}>
                <Td>{s.warehouse.ad}</Td>
                <Td className="font-medium text-slate-900">{s.product.ad}</Td>
                <Td className="text-slate-400">{s.product.sku}</Td>
                <Td>{sayi(s.miktar)} {s.product.birim}</Td>
              </tr>
            ))}
          </Table>
        )
      ) : dusuk.isLoading ? <Spinner /> : dusuk.isError ? <Alert>Yüklenemedi.</Alert> : !dusuk.data?.length ? <Card><Empty>Düşük stoklu ürün yok.</Empty></Card> : (
        <Table head={["Ürün", "Toplam stok", "Minimum", "Eksik", "Depolardaki dağılım"]}>
          {dusuk.data.map((u) => (
            <tr key={u.id}>
              <Td><div className="font-medium text-slate-900">{u.ad}</div><div className="text-xs text-slate-400">{u.sku}</div></Td>
              <Td><Badge tone="REDDEDILDI">{sayi(u.stokMiktari)}</Badge></Td>
              <Td>{sayi(u.minStokSeviyesi)}</Td>
              <Td className="font-medium text-rose-600">{sayi(u.eksikMiktar)}</Td>
              <Td className="text-xs">{u.depolar.length ? u.depolar.map((d: any) => `${d.depoAdi}: ${d.miktar}`).join(" · ") : "—"}</Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
