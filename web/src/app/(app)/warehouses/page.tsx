"use client";
import { CrudPage } from "@/components/crud-page";
import { ADMIN, SUBE } from "@/lib/roles";

export default function WarehousesPage() {
  return (
    <CrudPage
      title="Depolar"
      desc="Şubelerdeki depolar. İçinde stok olan depo silinemez."
      endpoint="/warehouses"
      singular="Depo"
      writeRoles={[ADMIN, SUBE]}
      deleteRoles={[ADMIN, SUBE]}
      columns={[
        { label: "Depo", render: (r) => <span className="font-medium text-slate-900">{r.ad}</span> },
        { label: "Şehir", render: (r) => r.sehir ?? "—" },
        { label: "Adres", render: (r) => r.adres ?? "—" },
      ]}
      fields={[
        { name: "ad", label: "Depo adı", required: true },
        { name: "sehir", label: "Şehir" },
        { name: "adres", label: "Adres", type: "textarea" },
      ]}
    />
  );
}
