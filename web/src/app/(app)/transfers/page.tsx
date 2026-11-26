"use client";
import { useState, type FormEvent } from "react";
import { useAction, useList, useMe } from "@/lib/hooks";
import { Alert, Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Select, Spinner, Table, Td } from "@/components/ui";
import { ADMIN, DEPO, SUBE } from "@/lib/roles";
import { sayi, tarih } from "@/lib/format";

export default function TransfersPage() {
  const me = useMe().data;
  const [durum, setDurum] = useState("");
  const list = useList<any[]>(`/transfer-requests${durum ? `?durum=${durum}` : ""}`);
  const urunler = useList<any[]>("/products");
  const depolar = useList<any[]>("/warehouses");
  const act = useAction(["/transfer-requests", "/warehouse-stocks", "/stock-movements", "/products", "/admin/stats"]);
  const [open, setOpen] = useState(false);
  const [red, setRed] = useState<any | null>(null);
  const [redNedeni, setRedNedeni] = useState("");
  const [f, setF] = useState({ productId: "", sourceWarehouseId: "", targetWarehouseId: "", miktar: "1", aciklama: "" });

  const onaylayabilir = !!me && [ADMIN, SUBE].includes(me.role);

  async function olustur(e: FormEvent) {
    e.preventDefault();
    const ok = await act.run({
      method: "post",
      url: "/transfer-requests",
      data: { ...f, miktar: Number(f.miktar), aciklama: f.aciklama || undefined },
      ok: "Transfer talebi açıldı. Şube Yöneticisi onayını bekliyor.",
    });
    if (ok) setOpen(false);
  }
  async function reddet(e: FormEvent) {
    e.preventDefault();
    const ok = await act.run({ method: "patch", url: `/transfer-requests/${red.id}/reject`, data: { redNedeni: redNedeni || undefined }, ok: "Talep reddedildi." });
    if (ok) setRed(null);
  }

  return (
    <>
      <PageHeader title="Transfer Talepleri" desc="Depolar arası transfer: talep aç → yönetici onaylar → stok tek işlemde taşınır.">
        <Button onClick={() => { act.clear(); setF({ productId: "", sourceWarehouseId: "", targetWarehouseId: "", miktar: "1", aciklama: "" }); setOpen(true); }}>+ Transfer talebi</Button>
      </PageHeader>
      {act.ok && !open && !red && <Alert kind="ok">{act.ok}</Alert>}
      {act.error && !open && !red && <Alert>{act.error}</Alert>}

      <div className="mb-3 max-w-xs">
        <Select value={durum} onChange={(e) => setDurum(e.target.value)} aria-label="Durum filtresi">
          <option value="">Tüm durumlar</option>
          <option value="BEKLIYOR">Bekliyor</option>
          <option value="ONAYLANDI">Onaylandı</option>
          <option value="REDDEDILDI">Reddedildi</option>
          <option value="IPTAL">İptal</option>
        </Select>
      </div>

      {list.isLoading ? <Spinner /> : list.isError ? <Alert>Yüklenemedi.</Alert> : !list.data?.length ? <Card><Empty /></Card> : (
        <Table head={["Tarih", "Ürün", "Miktar", "Kaynak → Hedef", "Açan", "Durum", ""]}>
          {list.data.map((t) => {
            const bekliyor = t.durum === "BEKLIYOR";
            const iptalEdebilir = bekliyor && !!me && (me.role !== DEPO || t.requestedBy?.id === me.id);
            return (
              <tr key={t.id}>
                <Td className="whitespace-nowrap text-xs">{tarih(t.createdAt)}</Td>
                <Td className="font-medium text-slate-900">{t.product.ad}</Td>
                <Td>{sayi(t.miktar)}</Td>
                <Td>{t.sourceWarehouse.ad} → {t.targetWarehouse.ad}</Td>
                <Td>{t.requestedBy?.ad}</Td>
                <Td><Badge>{t.durum}</Badge>{t.redNedeni && <div className="mt-1 text-xs text-slate-400">{t.redNedeni}</div>}</Td>
                <Td className="whitespace-nowrap text-right">
                  {bekliyor && onaylayabilir && (
                    <>
                      <Button size="sm" variant="success" disabled={act.pending} onClick={() => act.run({ method: "patch", url: `/transfer-requests/${t.id}/approve`, ok: "Talep onaylandı, stok taşındı." })}>Onayla</Button>{" "}
                      <Button size="sm" variant="danger" onClick={() => { act.clear(); setRedNedeni(""); setRed(t); }}>Reddet</Button>{" "}
                    </>
                  )}
                  {iptalEdebilir && <Button size="sm" variant="secondary" disabled={act.pending} onClick={() => act.run({ method: "patch", url: `/transfer-requests/${t.id}/cancel`, ok: "Talep iptal edildi." })}>İptal</Button>}
                </Td>
              </tr>
            );
          })}
        </Table>
      )}

      <Modal open={open} title="Yeni transfer talebi" onClose={() => setOpen(false)}>
        <form onSubmit={olustur} className="space-y-3">
          {act.error && <Alert>{act.error}</Alert>}
          <Field label="Ürün *">
            <Select required value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })}>
              <option value="">Seçin...</option>
              {urunler.data?.map((u) => <option key={u.id} value={u.id}>{u.ad} ({u.sku})</option>)}
            </Select>
          </Field>
          <Field label="Kaynak depo *">
            <Select required value={f.sourceWarehouseId} onChange={(e) => setF({ ...f, sourceWarehouseId: e.target.value })}>
              <option value="">Seçin...</option>
              {depolar.data?.map((d) => <option key={d.id} value={d.id}>{d.ad}</option>)}
            </Select>
          </Field>
          <Field label="Hedef depo *">
            <Select required value={f.targetWarehouseId} onChange={(e) => setF({ ...f, targetWarehouseId: e.target.value })}>
              <option value="">Seçin...</option>
              {depolar.data?.filter((d) => d.id !== f.sourceWarehouseId).map((d) => <option key={d.id} value={d.id}>{d.ad}</option>)}
            </Select>
          </Field>
          <Field label="Miktar *"><Input type="number" min={1} step={1} required value={f.miktar} onChange={(e) => setF({ ...f, miktar: e.target.value })} /></Field>
          <Field label="Açıklama"><Input value={f.aciklama} onChange={(e) => setF({ ...f, aciklama: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button type="submit" disabled={act.pending}>Talebi aç</Button>
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
