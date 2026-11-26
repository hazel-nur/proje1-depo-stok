export const DEPO = "Depo Personeli";
export const SATINALMA = "Satın Alma Sorumlusu";
export const SUBE = "Şube Yöneticisi";
export const ADMIN = "Admin";
export const ROLLER = [DEPO, SATINALMA, SUBE, ADMIN];

export type User = {
  id: string;
  ad: string;
  email: string;
  role: string;
  createdAt?: string;
  deletedAt?: string | null;
};

export type NavItem = { href: string; label: string; roles: string[]; admin?: boolean };

const HEPSI = ROLLER;

// Rol bazlı menü: kullanıcı sadece yetkisi olan sayfaları görür
export const NAV: NavItem[] = [
  { href: "/", label: "Panel", roles: HEPSI },
  { href: "/products", label: "Ürünler", roles: HEPSI },
  { href: "/categories", label: "Kategoriler", roles: HEPSI },
  { href: "/warehouses", label: "Depolar", roles: HEPSI },
  { href: "/suppliers", label: "Tedarikçiler", roles: [ADMIN, SUBE, SATINALMA] },
  { href: "/stock", label: "Stok Durumu", roles: HEPSI },
  { href: "/movements", label: "Stok Hareketleri", roles: HEPSI },
  { href: "/transfers", label: "Transferler", roles: [ADMIN, SUBE, DEPO] },
  { href: "/purchases", label: "Satın Alma", roles: HEPSI },
  { href: "/counts", label: "Sayımlar", roles: [ADMIN, SUBE, DEPO] },
  { href: "/admin/users", label: "Kullanıcılar", roles: [ADMIN], admin: true },
  { href: "/admin/deleted", label: "Silinenler", roles: [ADMIN], admin: true },
  { href: "/admin/stats", label: "İstatistikler", roles: [ADMIN], admin: true },
];
