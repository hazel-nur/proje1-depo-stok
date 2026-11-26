"use client";
import { Fragment, useState, type FormEvent } from "react";
import { useAction, useList, useMe } from "@/lib/hooks";
import { Alert, Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Select, Spinner, Table, Td } from "@/components/ui";
import { ADMIN, DEPO, SATINALMA, SUBE } from "@/lib/roles";
import { para, sayi, tarih } from "@/lib/format";

type Kalem = { productId: string; miktar: string; birimFiyat: string };
const bosKalem = (): Kalem => ({ productId: "", miktar: "1", birimFiyat: "" });

export default function PurchasesPage() {
  const me = useMe().data;
  const [durum, setDurum] = useState("");
  const list = useList<any[]>(`/purchase-requests${durum ? `?durum=${durum}` : ""}`);
  const urunler = useList<any[]>("/products");
  const depolar = useList<any[]>("/warehouses");
  const tedarikciler = useList<any[]>("/suppliers", !!me && me.role !== DEPO);
  const act = useAction(["/purchase-requests", "/warehouse-stocks", "/stock-movements", "/products", "/admin/stats"]);
  const [open, setOpen] = useState(false);
  const [acik, setAcik] = useState<string | null>(null);
  const [f, setF] = useState({ supplierId: "", warehouseId: "", aciklama: "" });
  const [kalemler, setKalemler] = useState<Kalem[]>([bosKalem()]);
  const [red, setRed] = useState<any | null>(null);
  const [redNedeni, setRedNedeni] = useState("");

  const olusturabilir = !!me && [ADMIN, SUBE, SATINALMA].includes(me.role);
  const onaylayabilir = !!me && [ADMIN, SUBE].includes(me.role);
  const teslimAlabilir = !!me && [ADMIN, SUBE, DEPO].includes(me.role);

  const toplam = kalemler.reduce((t, k) => t + (Number(k.miktar) || 0) * (Number(k.birimFiyat) || 0), 0);

  function setK(i: number, p: Partial<Kalem>) {
    setKalemler(kalemler.map((k, j) => (j === i ? { ...k, ...p } : k)));
  }
  function urunSec(i: number, id: string) {
    const u = urunler.data?.find((x) => x.id === id);
    setK(i, { productId: id, birimFiyat: u && !kalemler[i].birimFiyat ? String(u.fiyat) : kalemler[i].birimFiyat });
  }

  async function olustur(e: FormEvent) {
    e.preventDefault();
    const ok = await act.run({
      method: "post",
      url: "/purchase-requests",
      data: {
        supplierId: f.supplierId,
        warehouseId: f.warehouseId,
        aciklama: f.aciklama || undefined,
        items: kalemler.map((k) => ({ productId: k.productId, miktar: Number(k.miktar), birimFiyat: Number(k.birimFiyat) })),
      },
      ok: "Satın alma talebi oluşturuldu.",
    });
    if (ok) setOpen(false);
  }
  async function reddet(e: FormEvent) {
    e.preventDefault();
    const ok = await act.run({ method: "patch", url: `/purchase-requests/${red.id}/reject`, data: { redNedeni: redNedeni || undefined }, ok: "Talep reddedildi." });
    if (ok) setRed(null);
  }

  return (
    <>
      <PageHeader title="Satın Alma Talepleri" desc="Talep oluştur → yönetici onaylar → depo teslim alır → stok otomatik artar.">
        {olusturabilir && (
          <Button onClick={() => { act.clear(); setF({ supplierId: "", warehouseId: "", aciklama: "" }); setKalemler([bosKalem()]); setOpen(true); }}>+ Yeni talep</Button>
        )}
      </PageHeader>
      {act.ok && !open && !red && <Alert kind="ok">{act.ok}</Alert>}
      {act.error && !open && !red && <Alert>{act.error}</Alert>}

      <div className="mb-3 max-w-xs">
        <Select value={durum} onChange={(e) => setDurum(e.target.value)} aria-label="Durum filtresi">
          <option value="">Tüm durumlar</option>
          {["BEKLIYOR", "ONAYLANDI", "TESLIM_ALINDI", "REDDEDILDI", "IPTAL"].map((d) => <option key={d} value={d}>{d.replace("_", " ").toLowerCase()}</option>)}
        </Select>
      </div>

      {list.isLoading ? <Spinner /> : list.isError ? <Alert>Yüklenemedi.</Alert> : !list.data?.length ? <Card><Empty /></Card> : (
        <Table head={["Tarih", "Tedarikçi", "Teslim deposu", "Tutar", "Talep eden", "Durum", ""]}>
          {list.data.map((r) => {
            const iptal = (r.durum === "BEKLIYOR" || r.durum === "ONAYLANDI") && !!me && [ADMIN, SUBE].concat(SATINALMA).includes(me.role) && (me.role !== SATINALMA || r.requestedBy?.id === me.id);
            return (
              <Fragment key={r.id}>
                <tr className="hover:bg-slate-50">
                  <Td className="whitespace-nowrap text-xs">{tarih(r.createdAt)}</Td>
                  <Td className="font-medium text-slate-900">{r.supplier.ad}</Td>
                  <Td>{r.warehouse.ad}</Td>
                  <Td>{para(r.toplamTutar)}</Td>
                  <Td>{r.requestedBy?.ad}</Td>
                  <Td><Badge>{r.durum}</Badge>{r.redNedeni && <div className="mt-1 text-xs text-slate-400">{r.redNedeni}</div>}</Td>
                  <Td className="whitespace-nowrap text-right">
                    <Button size="sm" variant="ghost" onClick={() => setAcik(acik === r.id ? null : r.id)}>{acik === r.id ? "Gizle" : "Kalemler"}</Button>{" "}
                    {r.durum === "BEKLIYOR" && onaylayabilir && (
                      <>
                        <Button size="sm" variant="success" disabled={act.pending} onClick={() => act.run({ method: "patch", url: `/purchase-requests/${r.id}/approve`, ok: "Talep onaylandı." })}>Onayla</Button>{" "}
                        <Button size="sm" variant="danger" onClick={() => { act.clear(); setRedNedeni(""); setRed(r); }}>Reddet</Button>{" "}
                      </>
                    )}
                    {r.durum === "ONAYLANDI" && teslimAlabilir && (
                      <Button size="sm" disabled={act.pending} onClick={() => act.run({ method: "patch", url: `/purchase-requests/${r.id}/receive`, ok: "Teslim alındı, stok artırıldı." })}>Teslim al</Button>
                    )}{" "}
                    {iptal && <Button size="sm" variant="secondary" disabled={act.pending} onClick={() => act.run({ method: "patch", url: `/purchase-requests/${r.id}/cancel`, ok: "Talep iptal edildi." })}>İptal</Button>}
                  </Td>
                </tr>
                {acik === r.id && (
                  <tr className="bg-slate-50">
                    <td colSpan={7} className="px-4 py-3">
                      <ul className="space-y-1 text-sm">
                        {r.items.map((i: any) => (
                          <li key={i.id} className="flex flex-wrap justify-between gap-2">
                            <span>{i.product.ad} <span className="text-slate-400">({i.product.sku})</span></span>
                            <span>{sayi(i.miktar)} × {para(i.birimFiyat)} = <b>{para(i.miktar * i.birimFiyat)}</b></span>
                          </li>
                        ))}
                      </ul>
                      {r.aciklama && <p className="mt-2 text-xs text-slate-500">Not: {r.aciklama}</p>}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </Table>
      )}

      <Modal open={open} wide title="Yeni satın alma talebi" onClose={() => setOpen(false)}>
        <form onSubmit={olustur} className="space-y-3">
          {act.error && <Alert>{act.error}</Alert>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tedarikçi *">
              <Select required value={f.supplierId} onChange={(e) => setF({ ...f, supplierId: e.target.value })}>
                <option value="">Seçin...</option>
                {tedarikciler.data?.map((t) => <option key={t.id} value={t.id}>{t.ad}</option>)}
              </Select>
            </Field>
            <Field label="Teslim alınacak depo *">
              <Select required value={f.warehouseId} onChange={(e) => setF({ ...f, warehouseId: e.target.value })}>
                <option value="">Seçin...</option>
                {depolar.data?.map((d) => <option key={d.id} value={d.id}>{d.ad}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Açıklama"><Input value={f.aciklama} onChange={(e) => setF({ ...f, aciklama: e.target.value })} /></Field>

          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-600">Kalemler *</div>
            {kalemler.map((k, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <Select aria-label="Ürün" required className="col-span-12 sm:col-span-6" value={k.productId} onChange={(e) => urunSec(i, e.target.value)}>
                  <option value="">Ürün seçin...</option>
                  {urunler.data?.map((u) => <option key={u.id} value={u.id}>{u.ad}</option>)}
                </Select>
                <Input aria-label="Miktar" className="col-span-5 sm:col-span-2" type="number" min={1} step={1} required value={k.miktar} onChange={(e) => setK(i, { miktar: e.target.value })} />
                <Input aria-label="Birim fiyat" className="col-span-5 sm:col-span-3" type="number" min={0} step="0.01" required placeholder="Birim fiyat" value={k.birimFiyat} onChange={(e) => setK(i, { birimFiyat: e.target.value })} />
                <Button type="button" variant="ghost" className="col-span-2 sm:col-span-1" disabled={kalemler.length === 1} onClick={() => setKalemler(kalemler.filter((_, j) => j !== i))} aria-label="Kalemi sil">✕</Button>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={() => setKalemler([...kalemler, bosKalem()])}>+ Kalem ekle</Button>
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm text-slate-600">Toplam: <b>{para(toplam)}</b></span>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Vazgeç</Button>
              <Button type="submit" disabled={act.pending}>Talebi oluştur</Button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal open={!!red} title="Talebi reddet" onClose={() => setRed(null)}>
        <form onSubmit={reddet} className="space-y-3">
          {act.error && <Alert>{act.error}</Alert>}
          <Field label="Red nedeni (isteğe bağlı)"><Input value={redNedeni} onChange={(e) => setRedNedeni(e.target.value)} /></Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setRed(null)}>Vazgeç</Button>
            <Button type="submit" variant="danger" disabled={act.pending}>Reddet</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
