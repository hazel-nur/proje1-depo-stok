"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import { useAction, useList, useMe } from "@/lib/hooks";
import { Alert, Button, Card, Empty, Field, Input, Modal, PageHeader, Select, Spinner, Table, Td } from "./ui";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "email" | "select";
  required?: boolean;
  step?: string;
  min?: number;
  options?: { value: string; label: string }[];
  optionsFrom?: { url: string; label: (r: any) => string };
  placeholder?: string;
};
export type ColumnDef = { label: string; render: (row: any) => ReactNode };

type Props = {
  title: string;
  desc: string;
  endpoint: string;
  singular: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  writeRoles: string[];
  deleteRoles: string[];
  invalidate?: string[];
};

function SelectInput({ f, value, onChange }: { f: FieldDef; value: string; onChange: (v: string) => void }) {
  const q = useList<any[]>(f.optionsFrom?.url ?? "/", !!f.optionsFrom);
  const opts = f.options ?? (q.data ?? []).map((r) => ({ value: r.id, label: f.optionsFrom!.label(r) }));
  return (
    <Select required={f.required} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Seçin...</option>
      {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </Select>
  );
}

export function CrudPage(p: Props) {
  const me = useMe().data;
  const list = useList<any[]>(p.endpoint);
  const act = useAction([p.endpoint, ...(p.invalidate ?? [])]);
  const [edit, setEdit] = useState<any | "new" | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [silinecek, setSilinecek] = useState<any | null>(null);

  const yazabilir = !!me && p.writeRoles.includes(me.role);
  const silebilir = !!me && p.deleteRoles.includes(me.role);

  function ac(row: any | "new") {
    act.clear();
    setEdit(row);
    const f: Record<string, string> = {};
    for (const fd of p.fields) f[fd.name] = row === "new" ? "" : String(row[fd.name] ?? "");
    setForm(f);
  }

  async function kaydet(e: FormEvent) {
    e.preventDefault();
    const data: Record<string, unknown> = {};
    for (const fd of p.fields) {
      const v = form[fd.name];
      if (v === "" || v === undefined) continue;
      data[fd.name] = fd.type === "number" ? Number(v) : v;
    }
    const yeni = edit === "new";
    const ok = await act.run({
      method: yeni ? "post" : "patch",
      url: yeni ? p.endpoint : `${p.endpoint}/${edit.id}`,
      data,
      ok: yeni ? `${p.singular} oluşturuldu.` : `${p.singular} güncellendi.`,
    });
    if (ok) setEdit(null);
  }

  async function sil() {
    const ok = await act.run({ method: "delete", url: `${p.endpoint}/${silinecek.id}`, ok: `${p.singular} silindi (soft delete). Admin "Silinenler" sayfasından geri alabilir.` });
    if (ok) setSilinecek(null);
  }

  return (
    <>
      <PageHeader title={p.title} desc={p.desc}>
        {yazabilir && <Button onClick={() => ac("new")}>+ Yeni {p.singular}</Button>}
      </PageHeader>
      {act.ok && !edit && <Alert kind="ok">{act.ok}</Alert>}
      {act.error && !edit && !silinecek && <Alert>{act.error}</Alert>}
      {list.isLoading ? (
        <Spinner />
      ) : list.isError ? (
        <Alert>Liste yüklenemedi.</Alert>
      ) : !list.data?.length ? (
        <Card><Empty>Henüz kayıt yok.</Empty></Card>
      ) : (
        <Table head={[...p.columns.map((c) => c.label), ""]}>
          {list.data.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50">
              {p.columns.map((c) => <Td key={c.label}>{c.render(row)}</Td>)}
              <Td className="whitespace-nowrap text-right">
                {yazabilir && <Button size="sm" variant="secondary" onClick={() => ac(row)}>Düzenle</Button>}{" "}
                {silebilir && <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => { act.clear(); setSilinecek(row); }}>Sil</Button>}
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={!!edit} title={edit === "new" ? `Yeni ${p.singular}` : `${p.singular} düzenle`} onClose={() => setEdit(null)}>
        <form onSubmit={kaydet} className="space-y-3">
          {act.error && <Alert>{act.error}</Alert>}
          {p.fields.map((f) => (
            <Field key={f.name} label={f.label + (f.required ? " *" : "")}>
              {f.type === "select" ? (
                <SelectInput f={f} value={form[f.name] ?? ""} onChange={(v) => setForm({ ...form, [f.name]: v })} />
              ) : f.type === "textarea" ? (
                <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200" rows={3} value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
              ) : (
                <Input type={f.type ?? "text"} step={f.step} min={f.min} required={f.required} placeholder={f.placeholder} value={form[f.name] ?? ""} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
              )}
            </Field>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEdit(null)}>Vazgeç</Button>
            <Button type="submit" disabled={act.pending}>{act.pending ? "Kaydediliyor..." : "Kaydet"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!silinecek} title={`${p.singular} sil`} onClose={() => setSilinecek(null)}>
        {act.error && <Alert>{act.error}</Alert>}
        <p className="text-sm text-slate-600">
          <b>{silinecek?.ad}</b> silinecek. Kayıt veritabanından kalkmaz (soft delete); Admin gerekirse geri alabilir.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setSilinecek(null)}>Vazgeç</Button>
          <Button variant="danger" disabled={act.pending} onClick={sil}>Evet, sil</Button>
        </div>
      </Modal>
    </>
  );
}
