"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMe } from "@/lib/hooks";
import { NAV } from "@/lib/roles";
import { Spinner } from "./ui";

export function AppShell({ children }: { children: ReactNode }) {
  const me = useMe();
  const path = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  if (me.isError) {
    if (typeof window !== "undefined") {
      fetch("/api/auth/logout", { method: "POST" }).finally(() => router.replace("/login"));
    }
    return <Spinner label="Oturum sonlandı, yönlendiriliyorsunuz..." />;
  }
  if (!me.data) return <Spinner />;

  const user = me.data;
  const menu = NAV.filter((n) => n.roles.includes(user.role));
  const normal = menu.filter((n) => !n.admin);
  const admin = menu.filter((n) => n.admin);

  async function cikis() {
    await fetch("/api/auth/logout", { method: "POST" });
    qc.clear();
    router.replace("/login");
  }

  const aktif = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const Link2 = ({ n }: { n: { href: string; label: string } }) => (
    <Link
      href={n.href}
      onClick={() => setOpen(false)}
      aria-current={aktif(n.href) ? "page" : undefined}
      className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
        aktif(n.href) ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {n.label}
    </Link>
  );

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-3" aria-label="Ana menü">
      <div className="mb-3 px-3 pt-2">
        <div className="text-base font-semibold text-white">Depo / Stok</div>
        <div className="text-xs text-slate-400">Yönetim Sistemi</div>
      </div>
      {normal.map((n) => <Link2 key={n.href} n={n} />)}
      {admin.length > 0 && (
        <>
          <div className="mt-4 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Admin Paneli</div>
          {admin.map((n) => <Link2 key={n.href} n={n} />)}
        </>
      )}
      <div className="mt-auto rounded-lg bg-slate-800 p-3 text-xs text-slate-300">
        <div className="truncate font-medium text-white">{user.ad}</div>
        <div className="truncate text-slate-400">{user.role}</div>
        <button onClick={cikis} className="mt-2 w-full rounded-md bg-slate-700 px-2 py-1.5 text-xs font-medium text-white hover:bg-slate-600">
          Çıkış yap
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-60 shrink-0 bg-slate-900 lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">{sidebar}</div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-slate-900 px-4 py-3 text-white lg:hidden">
        <span className="font-semibold">Depo / Stok</span>
        <button onClick={() => setOpen(true)} aria-label="Menüyü aç" className="rounded-md bg-slate-800 px-3 py-1.5 text-sm">☰ Menü</button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/50" />
          <div className="absolute inset-y-0 left-0 w-64 overflow-y-auto bg-slate-900" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
