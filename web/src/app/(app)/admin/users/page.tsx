"use client";
import { useState, type FormEvent } from "react";
import { useAction, useList, useMe } from "@/lib/hooks";
import { ADMIN, ROLLER, type User } from "@/lib/roles";
import { Alert, Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Select, Spinner, Table, Td } from "@/components/ui";
import { tarih } from "@/lib/format";

export default function AdminUsersPage() {
  const me = useMe().data;
  const list = useList<User[]>("/users", me?.role === ADMIN);
  const act = useAction(["/users", "/admin/stats"]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ ad: "", email: "", sifre: "", role: ROLLER[0] });
  const [silinecek, setSilinecek] = useState<User | null>(null);

  if (me && me.role !== ADMIN) return <Alert>Bu sayfa sadece Admin içindir.</Alert>;

  async function olustur(e: FormEvent) {
    e.preventDefault();
    const ok = await act.run({ method: "post", url: "/users", data: f, ok: "Kullanıcı oluşturuldu." });
    if (ok) setOpen(false);
  }

  return (
    <>
      <PageHeader title="Kullanıcılar" desc="Kullanıcı oluştur, rolünü değiştir, sil.">
        <Button onClick={() => { act.clear(); setF({ ad: "", email: "", sifre: "", role: ROLLER[0] }); setOpen(true); }}>+ Yeni kullanıcı</Button>
      </PageHeader>
      {act.ok && !open && <Alert kind="ok">{act.ok}</Alert>}
      {act.error && !open && !silinecek && <Alert>{act.error}</Alert>}

      {list.isLoading ? <Spinner /> : list.isError ? <Alert>Yüklenemedi.</Alert> : !list.data?.length ? <Card><Empty /></Card> : (
        <Table head={["Ad", "E-posta", "Rol", "Kayıt", ""]}>
          {list.data.map((u) => {
            const ben = u.id === me?.id;
            return (
              <tr key={u.id}>
                <Td className="font-medium text-slate-900">{u.ad} {ben && <Badge tone="ONAYLANDI">siz</Badge>}</Td>
                <Td>{u.email}</Td>
                <Td>
                  <Select
                    aria-label={`${u.ad} rolü`}
                    className="min-w-44 py-1.5"
                    value={u.role}
                    disabled={ben || act.pending}
                    title={ben ? "Kendi rolünüzü değiştiremezsiniz" : undefined}
                    onChange={(e) => act.run({ method: "patch", url: `/users/${u.id}/role`, data: { role: e.target.value }, ok: `${u.ad} artık "${e.target.value}".` })}
                  >
                    {ROLLER.map((r) => <option key={r}>{r}</option>)}
                  </Select>
                </Td>
                <Td className="whitespace-nowrap text-xs">{tarih(u.createdAt)}</Td>
                <Td className="text-right">
                  {!ben && <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => { act.clear(); setSilinecek(u); }}>Sil</Button>}
                </Td>
              </tr>
            );
          })}
        </Table>
      )}

      <Modal open={open} title="Yeni kullanıcı" onClose={() => setOpen(false)}>
        <form onSubmit={olustur} className="space-y-3">
          {act.error && <Alert>{act.error}</Alert>}
          <Field label="Ad soyad *"><Input required value={f.ad} onChange={(e) => setF({ ...f, ad: e.target.value })} /></Field>
          <Field label="E-posta *"><Input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Şifre * (en az 6 karakter)"><Input type="password" minLength={6} required autoComplete="new-password" value={f.sifre} onChange={(e) => setF({ ...f, sifre: e.target.value })} /></Field>
          <Field label="Rol *">
            <Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{ROLLER.map((r) => <option key={r}>{r}</option>)}</Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button type="submit" disabled={act.pending}>Oluştur</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!silinecek} title="Kullanıcıyı sil" onClose={() => setSilinecek(null)}>
        {act.error && <Alert>{act.error}</Alert>}
        <p className="text-sm text-slate-600"><b>{silinecek?.ad}</b> silinecek (soft delete) ve giriş yapamayacak. &quot;Silinenler&quot; sayfasından geri alınabilir.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setSilinecek(null)}>Vazgeç</Button>
          <Button variant="danger" disabled={act.pending} onClick={async () => { if (await act.run({ method: "delete", url: `/users/${silinecek!.id}`, ok: "Kullanıcı silindi." })) setSilinecek(null); }}>Evet, sil</Button>
        </div>
      </Modal>
    </>
  );
}
