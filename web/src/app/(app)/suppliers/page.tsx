"use client";
import { CrudPage } from "@/components/crud-page";
import { ADMIN, SATINALMA, SUBE } from "@/lib/roles";

export default function SuppliersPage() {
  return (
    <CrudPage
      title="Tedarikçiler"
      desc="Satın alma yapılan firmalar."
      endpoint="/suppliers"
      singular="Tedarikçi"
      writeRoles={[ADMIN, SUBE, SATINALMA]}
      deleteRoles={[ADMIN, SUBE]}
      columns={[
        { label: "Firma", render: (r) => <span className="font-medium text-slate-900">{r.ad}</span> },
        { label: "E-posta", render: (r) => r.email ?? "—" },
        { label: "Telefon", render: (r) => r.telefon ?? "—" },
        { label: "Adres", render: (r) => r.adres ?? "—" },
      ]}
      fields={[
        { name: "ad", label: "Firma adı", required: true },
        { name: "email", label: "E-posta", type: "email" },
        { name: "telefon", label: "Telefon" },
        { name: "adres", label: "Adres", type: "textarea" },
      ]}
    />
  );
}
