"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { signOutUser } from "@/lib/firebase/firestore";

export function DashboardHeader() {
  const router = useRouter();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOutUser();
    router.replace("/login");
  };

  return (
    <header className="flex items-center justify-between gap-3">
      <Link href="/dashboard">
        <div className="eyebrow">
          <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          The Tiny Audience
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <div className="hidden rounded-full bg-white px-3 py-2 text-xs text-slate-500 shadow-sm sm:block">
          {user?.email}
        </div>
        <button
          className="btn-secondary !w-auto px-4"
          type="button"
          onClick={handleSignOut}
        >
          Log out
        </button>
      </div>
    </header>
  );
}
