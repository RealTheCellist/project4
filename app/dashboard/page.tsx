"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardHeader } from "@/components/dashboard-header";
import { DraftCard } from "@/components/draft-card";
import { useAuth } from "@/lib/auth-context";
import { getDraftsByAuthor } from "@/lib/firebase/firestore";
import type { Draft } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDrafts = async () => {
      if (!user) {
        return;
      }

      try {
        setLoadingDrafts(true);
        setDrafts(await getDraftsByAuthor(user.uid));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your drafts.",
        );
      } finally {
        setLoadingDrafts(false);
      }
    };

    void loadDrafts();
  }, [user]);

  return (
    <AuthGuard>
      <main className="container-mobile">
        <DashboardHeader />

        <section className="hero-panel mt-6">
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--accent)]">
                Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Your drafts
              </h1>
              <p className="mt-2 subtle">
                {user?.email} · {format(new Date(), "yyyy.MM.dd")}
              </p>
            </div>
            <Link className="btn-primary !w-auto px-5" href="/draft/new">
              New draft
            </Link>
          </div>
        </section>

        {!loadingDrafts && drafts.length > 0 ? (
          <section className="mt-6 grid grid-cols-3 gap-3">
            <div className="metric-card">
              <p className="text-sm font-semibold text-[var(--accent)]">Drafts</p>
              <p className="metric-value">{drafts.length}</p>
            </div>
            <div className="metric-card">
              <p className="text-sm font-semibold text-[var(--accent)]">Views</p>
              <p className="metric-value">
                {drafts.reduce((sum, draft) => sum + draft.viewCount, 0)}
              </p>
            </div>
            <div className="metric-card">
              <p className="text-sm font-semibold text-[var(--accent)]">
                Feedback
              </p>
              <p className="metric-value">
                {drafts.reduce((sum, draft) => sum + draft.feedbackCount, 0)}
              </p>
            </div>
          </section>
        ) : null}

        <section className="mt-6 stack-md">
          {loadingDrafts ? <DraftSkeleton /> : null}
          {error ? (
            <div className="card p-5 text-sm text-red-600">{error}</div>
          ) : null}

          {!loadingDrafts && drafts.length === 0 ? (
            <div className="card p-5">
              <h2 className="section-title">No drafts yet</h2>
              <p className="section-copy">
                Start with a small draft and send it to a handful of trusted
                readers.
              </p>
              <Link className="btn-primary mt-4" href="/draft/new">
                Write your first draft
              </Link>
            </div>
          ) : null}

          {drafts.map((draft) => (
            <DraftCard key={draft.id} draft={draft} />
          ))}
        </section>
      </main>
    </AuthGuard>
  );
}

function DraftSkeleton() {
  return (
    <>
      {[1, 2, 3].map((item) => (
        <div key={item} className="card animate-pulse p-5">
          <div className="h-5 w-2/3 rounded-full bg-orange-100" />
          <div className="mt-3 h-4 w-full rounded-full bg-orange-50" />
          <div className="mt-2 h-4 w-5/6 rounded-full bg-orange-50" />
        </div>
      ))}
    </>
  );
}
