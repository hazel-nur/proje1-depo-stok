"use client";
import { Fragment, useState, type FormEvent } from "react";
import { useAction, useList, useMe } from "@/lib/hooks";
import { Alert, Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Select, Spinner, Table, Td } from "@/components/ui";
import { ADMIN, SUBE } from "@/lib/roles";
import { sayi, tarih } from "@/lib/format";

type Kalem = { productId: string; sayilanMiktar: string };

export default function CountsPage() {
  const me = useMe().data;
  const list = useList<any[]>("/inventory-counts");
  const urunler = useList<any[]>("/products");
  const depolar = useList<any[]>("/warehouses");
  const act = useAction(["/inventory-counts", "/warehouse-stocks", "/stock-movements", "/products", "/admin/stats"]);
  const [open, setOpen] = useState(false);
  const [acik, setAcik] = useState<string | null>(null);
  const [f, setF] = useState({ warehouseId: "", aciklama: "" });
  const [kalemler, setKalemler] = useState<Kalem[]>([{ productId: "", sayilanMiktar: "0" }]);

  const uygulayabilir = !!me && [ADMIN, SUBE].includes(me.role);

  function setK(i: number, p: Partial<Kalem>) {
    setKalemler(kalemler.map((k, j) => (j === i ? { ...k, ...p } : k)));
  }
  async function olustur(e: FormEvent) {
    e.preventDefault();
    const ok = await act.run({
      method: "post",
      url: "/inventory-counts",
      data: {
        warehouseId: f.warehouseId,
        aciklama: f.aciklama || undefined,
        items: kalemler.map((k) => ({ productId: k.productId, sayilanMiktar: Number(k.sayilanMiktar) })),
      },
      ok: "Sayım kaydedildi. Uygulanana kadar stok değişmez.",
    });
    if (ok) setOpen(false);
  }

  return (
    <>
      <PageHeader title="Stok Sayımları" desc="Fark = sayılan (gerçek) − beklenen. Sayım uygulanınca fark kadar stok hareketi yazılır.">
        <Button onClick={() => { act.clear(); setF({ warehouseId: "", aciklama: "" }); setKalemler([{ productId: "", sayilanMiktar: "0" }]); setOpen(true); }}>+ Yeni sayım</Button>
      </PageHeader>
      {act.ok && !open && <Alert kind="ok">{act.ok}</Alert>}
      {act.error && !open && <Alert>{act.error}</Alert>}

      {list.isLoading ? <Spinner /> : list.isError ? <Alert>Yüklenemedi.</Alert> : !list.data?.length ? <Card><Empty /></Card> : (
        <Table head={["Tarih", "Depo", "Kalem", "Yapan", "Durum", ""]}>
          {list.data.map((c) => (
            <Fragment key={c.id}>
              <tr className="hover:bg-slate-50">
                <Td className="whitespace-nowrap text-xs">{tarih(c.createdAt)}</Td>
                <Td className="font-medium text-slate-900">{c.warehouse.ad}</Td>
                <Td>{c.items.length}</Td>
                <Td>{c.createdBy?.ad}</Td>
                <Td><Badge>{c.durum}</Badge></Td>
                <Td className="whitespace-nowrap text-right">
                  <Button size="sm" variant="ghost" onClick={() => setAcik(acik === c.id ? null : c.id)}>{acik === c.id ? "Gizle" : "Farklar"}</Button>{" "}
                  {c.durum === "ACIK" && uygulayabilir && (
                    <Button size="sm" disabled={act.pending} onClick={() => act.run({ method: "patch", url: `/inventory-counts/${c.id}/apply`, ok: "Sayım uygulandı, stoklar düzeltildi." })}>Uygula</Button>
                  )}
                </Td>
              </tr>
              {acik === c.id && (
                <tr className="bg-slate-50">
                  <td colSpan={6} className="px-4 py-3">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-slate-500"><tr><th className="text-left">Ürün</th><th className="text-right">Beklenen</th><th className="text-right">Sayılan</th><th className="text-right">Fark</th></tr></thead>
                      <tbody>
                        {c.items.map((i: any) => (
                          <tr key={i.id} className="border-t border-slate-200">
                            <td className="py-1">{i.product.ad}</td>
                            <td className="text-right">{sayi(i.beklenenMiktar)}</td>
                            <td className="text-right">{sayi(i.sayilanMiktar)}</td>
                            <td className={`text-right font-medium ${i.fark < 0 ? "text-rose-600" : i.fark > 0 ? "text-emerald-600" : "text-slate-400"}`}>{i.fark > 0 ? "+" : ""}{i.fark}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {c.aciklama && <p className="mt-2 text-xs text-slate-500">Not: {c.aciklama}</p>}
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </Table>
      )}

      <Modal open={open} wide title="Yeni sayım" onClose={() => setOpen(false)}>
        <form onSubmit={olustur} className="space-y-3">
          {act.error && <Alert>{act.error}</Alert>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Depo *">
              <Select required value={f.warehouseId} onChange={(e) => setF({ ...f, warehouseId: e.target.value })}>
                <option value="">Seçin...</option>
                {depolar.data?.map((d) => <option key={d.id} value={d.id}>{d.ad}</option>)}
              </Select>
            </Field>
            <Field label="Açıklama"><Input value={f.aciklama} onChange={(e) => setF({ ...f, aciklama: e.target.value })} /></Field>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-600">Sayılan ürünler *</div>
            {kalemler.map((k, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <Select aria-label="Ürün" required className="col-span-7 sm:col-span-8" value={k.productId} onChange={(e) => setK(i, { productId: e.target.value })}>
                  <option value="">Ürün seçin...</option>
                  {urunler.data?.map((u) => <option key={u.id} value={u.id}>{u.ad}</option>)}
                </Select>
                <Input aria-label="Sayılan miktar" className="col-span-3 sm:col-span-3" type="number" min={0} step={1} required value={k.sayilanMiktar} onChange={(e) => setK(i, { sayilanMiktar: e.target.value })} />
                <Button type="button" variant="ghost" className="col-span-2 sm:col-span-1" disabled={kalemler.length === 1} onClick={() => setKalemler(kalemler.filter((_, j) => j !== i))} aria-label="Kalemi sil">✕</Button>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={() => setKalemler([...kalemler, { productId: "", sayilanMiktar: "0" }])}>+ Ürün ekle</Button>
          </div>
          <div className="flex justify-end gap-2 border-t pt-3">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button type="submit" disabled={act.pending}>Sayımı kaydet</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
