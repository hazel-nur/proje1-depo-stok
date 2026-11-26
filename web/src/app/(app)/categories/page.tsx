"use client";
import { CrudPage } from "@/components/crud-page";
import { ADMIN, SUBE } from "@/lib/roles";

export default function CategoriesPage() {
  return (
    <CrudPage
      title="Kategoriler"
      desc="Ürün kategorileri."
      endpoint="/categories"
      singular="Kategori"
      writeRoles={[ADMIN, SUBE]}
      deleteRoles={[ADMIN, SUBE]}
      columns={[
        { label: "Ad", render: (r) => <span className="font-medium text-slate-900">{r.ad}</span> },
        { label: "Açıklama", render: (r) => r.aciklama ?? "—" },
      ]}
      fields={[
        { name: "ad", label: "Kategori adı", required: true },
        { name: "aciklama", label: "Açıklama", type: "textarea" },
      ]}
    />
  );
}
