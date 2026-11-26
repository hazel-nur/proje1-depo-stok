"use client";
import { useState } from "react";
import { useAction, useList, useMe } from "@/lib/hooks";
import { ADMIN } from "@/lib/roles";
import { Alert, Badge, Button, Card, Empty, Modal, PageHeader, Spinner, Table, Td } from "@/components/ui";
import { tarih } from "@/lib/format";

type Tur = { key: string; label: string; url: string; ad: (r: any) => string; ek?: (r: any) => string };

const TURLER: Tur[] = [
  { key: "users", label: "Kullanıcılar", url: "/users", ad: (r) => r.ad, ek: (r) => `${r.email} · ${r.role}` },
  { key: "products", label: "Ürünler", url: "/products", ad: (r) => r.ad, ek: (r) => r.sku },
  { key: "categories", label: "Kategoriler", url: "/categories", ad: (r) => r.ad },
  { key: "warehouses", label: "Depolar", url: "/warehouses", ad: (r) => r.ad, ek: (r) => r.sehir ?? "" },
  { key: "suppliers", label: "Tedarikçiler", url: "/suppliers", ad: (r) => r.ad, ek: (r) => r.email ?? "" },
  { key: "transfers", label: "Transfer talepleri", url: "/transfer-requests", ad: (r) => `${r.product?.ad} × ${r.miktar}`, ek: (r) => `${r.sourceWarehouse?.ad} → ${r.targetWarehouse?.ad} (${r.durum})` },
  { key: "purchases", label: "Satın alma", url: "/purchase-requests", ad: (r) => `${r.supplier?.ad} (${r.items?.length ?? 0} kalem)`, ek: (r) => r.durum },
  { key: "counts", label: "Sayımlar", url: "/inventory-counts", ad: (r) => `${r.warehouse?.ad} sayımı`, ek: (r) => `${r.items?.length ?? 0} kalem · ${r.durum}` },
];

export default function DeletedPage() {
  const me = useMe().data;
  const [tur, setTur] = useState(TURLER[0]);
  const list = useList<any[]>(`${tur.url}/deleted`, me?.role === ADMIN);
  const act = useAction(["/users", "/products", "/categories", "/warehouses", "/suppliers", "/transfer-requests", "/purchase-requests", "/inventory-counts", "/admin/stats", "/warehouse-stocks"]);
  const [kalici, setKalici] = useState<any | null>(null);

  if (me && me.role !== ADMIN) return <Alert>Bu sayfa sadece Admin içindir.</Alert>;

  return (
    <>
      <PageHeader title="Silinenler" desc="Soft delete ile silinen kayıtlar. Geri alabilir (restore) ya da kalıcı silebilirsiniz (hard delete)." />
      <div className="mb-4 flex flex-wrap gap-2">
        {TURLER.map((t) => (
          <button key={t.key} onClick={() => { act.clear(); setTur(t); }} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${t.key === tur.key ? "bg-indigo-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {act.ok && !kalici && <Alert kind="ok">{act.ok}</Alert>}
      {act.error && !kalici && <Alert>{act.error}</Alert>}

      {list.isLoading ? <Spinner /> : list.isError ? <Alert>Yüklenemedi.</Alert> : !list.data?.length ? <Card><Empty>Silinmiş {tur.label.toLowerCase()} yok.</Empty></Card> : (
        <Table head={["Kayıt", "Detay", "Silinme", ""]}>
          {list.data.map((r) => (
            <tr key={r.id}>
              <Td className="font-medium text-slate-900">{tur.ad(r)}</Td>
              <Td className="text-xs text-slate-500">{tur.ek?.(r) ?? ""}</Td>
              <Td className="whitespace-nowrap text-xs"><Badge tone="IPTAL">{tarih(r.deletedAt)}</Badge></Td>
              <Td className="whitespace-nowrap text-right">
                <Button size="sm" variant="success" disabled={act.pending} onClick={() => act.run({ method: "patch", url: `${tur.url}/${r.id}/restore`, ok: "Kayıt geri alındı." })}>Geri al</Button>{" "}
                <Button size="sm" variant="danger" onClick={() => { act.clear(); setKalici(r); }}>Kalıcı sil</Button>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={!!kalici} title="Kalıcı silme (hard delete)" onClose={() => setKalici(null)}>
        {act.error && <Alert>{act.error}</Alert>}
        <p className="text-sm text-slate-600"><b>{kalici && tur.ad(kalici)}</b> veritabanından <b>tamamen silinecek</b>. Bu işlem geri alınamaz.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setKalici(null)}>Vazgeç</Button>
          <Button variant="danger" disabled={act.pending} onClick={async () => { if (await act.run({ method: "delete", url: `${tur.url}/${kalici.id}/hard`, ok: "Kayıt kalıcı olarak silindi." })) setKalici(null); }}>Kalıcı olarak sil</Button>
        </div>
      </Modal>
    </>
  );
}
