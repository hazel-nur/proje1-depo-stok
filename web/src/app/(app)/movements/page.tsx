"use client";
import { useState, type FormEvent } from "react";
import { useAction, useList, useMe } from "@/lib/hooks";
import { Alert, Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Select, Spinner, Table, Td } from "@/components/ui";
import { ADMIN, DEPO, SUBE } from "@/lib/roles";
import { sayi, tarih } from "@/lib/format";

type Tip = "entry" | "exit" | "transfer";
const BASLIK: Record<Tip, string> = { entry: "Stok girişi", exit: "Stok çıkışı", transfer: "Depolar arası transfer" };

export default function MovementsPage() {
  const me = useMe().data;
  const [tip, setTip] = useState("");
  const list = useList<any[]>(`/stock-movements${tip ? `?tip=${tip}` : ""}`);
  const urunler = useList<any[]>("/products");
  const depolar = useList<any[]>("/warehouses");
  const act = useAction(["/stock-movements", "/warehouse-stocks", "/products", "/admin/stats"]);
  const [modal, setModal] = useState<Tip | null>(null);
  const [f, setF] = useState({ productId: "", warehouseId: "", targetWarehouseId: "", miktar: "1", aciklama: "" });

  const girisCikis = !!me && [ADMIN, SUBE, DEPO].includes(me.role);
  const dogrudanTransfer = !!me && [ADMIN, SUBE].includes(me.role);

  function ac(t: Tip) {
    act.clear();
    setF({ productId: "", warehouseId: "", targetWarehouseId: "", miktar: "1", aciklama: "" });
    setModal(t);
  }

  async function gonder(e: FormEvent) {
    e.preventDefault();
    const data =
      modal === "transfer"
        ? { productId: f.productId, sourceWarehouseId: f.warehouseId, targetWarehouseId: f.targetWarehouseId, miktar: Number(f.miktar), aciklama: f.aciklama || undefined }
        : { productId: f.productId, warehouseId: f.warehouseId, miktar: Number(f.miktar), aciklama: f.aciklama || undefined };
    const ok = await act.run({ method: "post", url: `/stock-movements/${modal}`, data, ok: `${BASLIK[modal!]} kaydedildi.` });
    if (ok) setModal(null);
  }

  return (
    <>
      <PageHeader title="Stok Hareketleri" desc="Tüm giriş, çıkış ve transferler (silinmez, denetim kaydıdır).">
        {girisCikis && <Button variant="success" onClick={() => ac("entry")}>+ Giriş</Button>}
        {girisCikis && <Button variant="danger" onClick={() => ac("exit")}>− Çıkış</Button>}
        {dogrudanTransfer && <Button onClick={() => ac("transfer")}>⇄ Transfer</Button>}
      </PageHeader>
      {!dogrudanTransfer && me && me.role === DEPO && (
        <Alert kind="info">Depo Personeli doğrudan transfer yapamaz; &quot;Transferler&quot; sayfasından talep açın, Şube Yöneticisi onaylar.</Alert>
      )}
      {act.ok && !modal && <Alert kind="ok">{act.ok}</Alert>}

      <div className="mb-3 max-w-xs">
        <Select value={tip} onChange={(e) => setTip(e.target.value)} aria-label="Tür filtresi">
          <option value="">Tüm türler</option>
          <option value="GIRIS">Giriş</option>
          <option value="CIKIS">Çıkış</option>
          <option value="TRANSFER">Transfer</option>
        </Select>
      </div>

      {list.isLoading ? <Spinner /> : list.isError ? <Alert>Yüklenemedi.</Alert> : !list.data?.length ? <Card><Empty /></Card> : (
        <Table head={["Tarih", "Tür", "Ürün", "Miktar", "Kaynak", "Hedef", "Kullanıcı", "Not"]}>
          {list.data.map((m) => (
            <tr key={m.id}>
              <Td className="whitespace-nowrap text-xs">{tarih(m.createdAt)}</Td>
              <Td><Badge>{m.tip}</Badge></Td>
              <Td className="font-medium text-slate-900">{m.product.ad}</Td>
              <Td>{sayi(m.miktar)}</Td>
              <Td>{m.sourceWarehouse?.ad ?? "—"}</Td>
              <Td>{m.targetWarehouse?.ad ?? "—"}</Td>
              <Td>{m.user?.ad}</Td>
              <Td className="max-w-[16rem] truncate text-xs text-slate-500">{m.aciklama ?? ""}</Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={!!modal} title={modal ? BASLIK[modal] : ""} onClose={() => setModal(null)}>
        <form onSubmit={gonder} className="space-y-3">
          {act.error && <Alert>{act.error}</Alert>}
          <Field label="Ürün *">
            <Select required value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })}>
              <option value="">Seçin...</option>
              {urunler.data?.map((u) => <option key={u.id} value={u.id}>{u.ad} ({u.sku})</option>)}
            </Select>
          </Field>
          <Field label={modal === "transfer" ? "Kaynak depo *" : "Depo *"}>
            <Select required value={f.warehouseId} onChange={(e) => setF({ ...f, warehouseId: e.target.value })}>
              <option value="">Seçin...</option>
              {depolar.data?.map((d) => <option key={d.id} value={d.id}>{d.ad}</option>)}
            </Select>
          </Field>
          {modal === "transfer" && (
            <Field label="Hedef depo *">
              <Select required value={f.targetWarehouseId} onChange={(e) => setF({ ...f, targetWarehouseId: e.target.value })}>
                <option value="">Seçin...</option>
                {depolar.data?.filter((d) => d.id !== f.warehouseId).map((d) => <option key={d.id} value={d.id}>{d.ad}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Miktar *"><Input type="number" min={1} step={1} required value={f.miktar} onChange={(e) => setF({ ...f, miktar: e.target.value })} /></Field>
          <Field label="Açıklama"><Input value={f.aciklama} onChange={(e) => setF({ ...f, aciklama: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModal(null)}>Vazgeç</Button>
            <Button type="submit" disabled={act.pending}>{act.pending ? "Kaydediliyor..." : "Kaydet"}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
