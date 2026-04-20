"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <main className="container-mobile">
        <section className="card animate-pulse p-5">
          <div className="h-6 w-1/2 rounded-full bg-orange-100" />
          <div className="mt-4 h-32 rounded-3xl bg-orange-50" />
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
