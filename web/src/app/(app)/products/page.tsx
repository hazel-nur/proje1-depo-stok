"use client";
import { CrudPage } from "@/components/crud-page";
import { Badge } from "@/components/ui";
import { ADMIN, SATINALMA, SUBE } from "@/lib/roles";
import { para, sayi } from "@/lib/format";

export default function ProductsPage() {
  return (
    <CrudPage
      title="Ürünler"
      desc="Ürün kartları. Stok miktarı sadece stok hareketleriyle değişir."
      endpoint="/products"
      singular="Ürün"
      writeRoles={[ADMIN, SUBE, SATINALMA]}
      deleteRoles={[ADMIN, SUBE]}
      columns={[
        { label: "Ürün", render: (r) => <div><div className="font-medium text-slate-900">{r.ad}</div><div className="text-xs text-slate-400">{r.sku}</div></div> },
        { label: "Kategori", render: (r) => r.category?.ad },
        { label: "Fiyat", render: (r) => para(r.fiyat) },
        { label: "Toplam stok", render: (r) => <>{sayi(r.stokMiktari)} {r.birim} {r.stokMiktari < r.minStokSeviyesi && <Badge tone="REDDEDILDI">düşük</Badge>}</> },
        { label: "Min. seviye", render: (r) => sayi(r.minStokSeviyesi) },
      ]}
      fields={[
        { name: "ad", label: "Ürün adı", required: true },
        { name: "sku", label: "Stok kodu (SKU)", required: true, placeholder: "ELK-001" },
        { name: "categoryId", label: "Kategori", type: "select", required: true, optionsFrom: { url: "/categories", label: (r) => r.ad } },
        { name: "fiyat", label: "Fiyat (TL)", type: "number", step: "0.01", min: 0, required: true },
        { name: "birim", label: "Birim", placeholder: "adet" },
        { name: "minStokSeviyesi", label: "Minimum stok seviyesi", type: "number", min: 0 },
        { name: "aciklama", label: "Açıklama", type: "textarea" },
      ]}
    />
  );
}
