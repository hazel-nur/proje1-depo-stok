"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Field, Input } from "@/components/ui";

const DEMO = [
  ["Admin", "admin@depo.com", "Admin123!"],
  ["Şube Yöneticisi", "sube@depo.com", "Sube123!"],
  ["Satın Alma Sorumlusu", "satinalma@depo.com", "Satin123!"],
  ["Depo Personeli", "depo@depo.com", "Depo123!"],
];

export default function LoginPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [bekle, setBekle] = useState(false);

  async function gonder(e: FormEvent) {
    e.preventDefault();
    setBekle(true);
    setHata(null);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, sifre }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setHata(j.error ?? "Giriş yapılamadı.");
        return;
      }
      qc.clear();
      router.replace("/");
    } catch {
      setHata("Sunucuya ulaşılamadı.");
    } finally {
      setBekle(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <h1 className="text-2xl font-semibold tracking-tight">Depo / Stok Yönetim Sistemi</h1>
          <p className="mt-1 text-sm text-slate-300">Devam etmek için giriş yapın</p>
        </div>
        <form onSubmit={gonder} className="space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
          {hata && <Alert>{hata}</Alert>}
          <Field label="E-posta">
            <Input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@depo.com" />
          </Field>
          <Field label="Şifre">
            <Input type="password" required autoComplete="current-password" value={sifre} onChange={(e) => setSifre(e.target.value)} />
          </Field>
          <Button type="submit" disabled={bekle} className="w-full">{bekle ? "Giriş yapılıyor..." : "Giriş yap"}</Button>
        </form>
        <div className="mt-4 rounded-xl bg-white/10 p-4 text-xs text-slate-200">
          <div className="mb-2 font-medium">Örnek hesaplar (seed verisi) - tıklayıp doldurun</div>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {DEMO.map(([rol, m, s]) => (
              <button key={m} type="button" onClick={() => { setEmail(m); setSifre(s); }} className="rounded-md bg-white/10 px-2 py-1.5 text-left hover:bg-white/20">
                {rol}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
