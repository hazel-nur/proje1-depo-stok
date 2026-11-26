"use client";
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { api, hataMesaji } from "./api";
import { useState } from "react";
import type { User } from "./roles";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const r = await fetch("/api/auth/me", { cache: "no-store" });
      if (!r.ok) throw new Error("Oturum yok");
      return (await r.json()) as User;
    },
    staleTime: 60_000,
  });
}

export function useList<T = any>(url: string, enabled = true) {
  return useQuery({
    queryKey: [url],
    enabled,
    queryFn: async () => (await api.get<T>(url)).data,
  });
}

// Bir işlem (POST/PATCH/DELETE) çalıştırır, başarıda ilgili listeleri yeniler, hata/başarı mesajı tutar
export function useAction(invalidatePrefixes: string[]) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: async (a: { method: "post" | "patch" | "delete"; url: string; data?: unknown; ok?: string }) => {
      const r = await api.request({ method: a.method, url: a.url, data: a.data });
      return { data: r.data, ok: a.ok };
    },
    onMutate: () => {
      setError(null);
      setOk(null);
    },
    onSuccess: (r) => {
      setOk(r.ok ?? "İşlem başarılı.");
      qc.invalidateQueries({
        predicate: (q: { queryKey: QueryKey }) =>
          typeof q.queryKey[0] === "string" && invalidatePrefixes.some((p) => (q.queryKey[0] as string).startsWith(p)),
      });
    },
    onError: (e) => setError(hataMesaji(e)),
  });
  return {
    run: (a: { method: "post" | "patch" | "delete"; url: string; data?: unknown; ok?: string }) => m.mutateAsync(a).then(() => true, () => false),
    pending: m.isPending,
    error,
    ok,
    clear: () => {
      setError(null);
      setOk(null);
    },
  };
}
