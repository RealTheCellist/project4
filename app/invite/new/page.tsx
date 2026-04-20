"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardHeader } from "@/components/dashboard-header";
import { useAuth } from "@/lib/auth-context";
import { createInvite, getDraftsByAuthor } from "@/lib/firebase/firestore";
import type { Draft } from "@/lib/types";

export default function InviteCreationPage() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState("");
  const [maxUses, setMaxUses] = useState("10");
  const [expiresAt, setExpiresAt] = useState(
    format(addDays(new Date(), 7), "yyyy-MM-dd"),
  );
  const [createdLink, setCreatedLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDrafts = async () => {
      if (!user) {
        return;
      }

      try {
        setLoading(true);
        const ownedDrafts = await getDraftsByAuthor(user.uid);
        setDrafts(ownedDrafts);

        const requestedDraftId =
          typeof window === "undefined"
            ? ""
            : new URLSearchParams(window.location.search).get("draftId") ?? "";
        const nextDraftId = ownedDrafts.some((draft) => draft.id === requestedDraftId)
          ? requestedDraftId
          : ownedDrafts[0]?.id ?? "";

        setSelectedDraftId(nextDraftId);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your drafts for invite creation.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadDrafts();
  }, [user]);

  const publicBaseUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.location.origin;
  }, []);

  const selectedDraft = drafts.find((draft) => draft.id === selectedDraftId) ?? null;

  const handleCheckboxChange = (draftId: string) => {
    setSelectedDraftId((current) => (current === draftId ? "" : draftId));
  };

  const handleCreateInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || !selectedDraftId) {
      setError("Choose one draft before creating an invite.");
      return;
    }

    setSubmitting(true);
    setError("");
    setCreatedLink("");

    try {
      const inviteId = await createInvite({
        draftId: selectedDraftId,
        creatorId: user.uid,
        expiresAtIso: new Date(`${expiresAt}T23:59:59`).toISOString(),
        maxUses: Number(maxUses),
      });

      setCreatedLink(`${publicBaseUrl}/invite/${inviteId}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not create the invite link.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <main className="mx-auto w-full max-w-5xl px-4 pb-8 pt-5 sm:px-6">
        <DashboardHeader />

        <section className="card-soft mt-6 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--accent)]">
                Invite Studio
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Create an invite
              </h1>
              <p className="mt-2 max-w-2xl subtle">
                Check one of your drafts, then generate an invite that opens only
                that piece for your small audience.
              </p>
            </div>
            <Link className="btn-secondary !w-auto px-5" href="/dashboard">
              Back to dashboard
            </Link>
          </div>
        </section>

        {error ? (
          <section className="card mt-6 p-5 text-sm text-red-600">
            {error}
          </section>
        ) : null}

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="card p-5">
            <div className="stack-sm">
              <h2 className="section-title">Choose your draft</h2>
              <p className="section-copy">
                Use the checkbox list below to choose the one draft this invite
                should point to.
              </p>
            </div>

            <div className="mt-5 stack-sm">
              {loading ? (
                <>
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="invite-draft-card animate-pulse">
                      <div className="h-5 w-5 rounded-md bg-orange-100" />
                      <div className="min-w-0 flex-1">
                        <div className="h-4 w-2/3 rounded-full bg-orange-100" />
                        <div className="mt-2 h-4 w-full rounded-full bg-orange-50" />
                      </div>
                    </div>
                  ))}
                </>
              ) : null}

              {!loading && drafts.length === 0 ? (
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
                  <p className="text-base font-semibold text-slate-900">
                    No drafts yet
                  </p>
                  <p className="mt-2 text-sm subtle">
                    Write a draft first, then come back to create an invite.
                  </p>
                  <Link className="btn-primary mt-4" href="/draft/new">
                    Write a draft
                  </Link>
                </div>
              ) : null}

              {drafts.map((draft) => {
                const isSelected = selectedDraftId === draft.id;

                return (
                  <label
                    key={draft.id}
                    className={`invite-draft-card ${isSelected ? "is-selected" : ""}`}
                  >
                    <input
                      checked={isSelected}
                      className="invite-draft-checkbox"
                      type="checkbox"
                      onChange={() => handleCheckboxChange(draft.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-slate-900">
                            {draft.title}
                          </p>
                          <p className="mt-1 text-sm subtle">
                            Updated{" "}
                            {format(draft.updatedAt.toDate(), "yyyy.MM.dd HH:mm")}
                          </p>
                        </div>
                        <div className="invite-draft-metrics">
                          <span>{draft.viewCount} views</span>
                          <span>{draft.feedbackCount} feedback</span>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="card p-5">
            <div className="stack-sm">
              <h2 className="section-title">Invite settings</h2>
              <p className="section-copy">
                Set the limit and expiration for the draft you selected.
              </p>
            </div>

            <form className="mt-5 stack-md" onSubmit={handleCreateInvite}>
              <div className="rounded-3xl bg-[var(--accent-soft)] p-4">
                <p className="text-sm font-semibold text-[var(--accent)]">
                  Selected draft
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {selectedDraft?.title ?? "Choose one draft"}
                </p>
              </div>

              <div>
                <label className="label" htmlFor="maxUses">
                  Max uses
                </label>
                <input
                  id="maxUses"
                  className="input"
                  type="number"
                  min={1}
                  max={100}
                  value={maxUses}
                  onChange={(event) => setMaxUses(event.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="expiresAt">
                  Expires on
                </label>
                <input
                  id="expiresAt"
                  className="input"
                  type="date"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  required
                />
              </div>

              <button
                className="btn-primary"
                disabled={submitting || !selectedDraft}
                type="submit"
              >
                {submitting ? "Creating..." : "Generate invite link"}
              </button>
            </form>

            {createdLink ? (
              <div className="mt-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <p className="text-sm font-semibold text-[var(--accent)]">
                  Link created
                </p>
                <p className="mt-2 break-all text-sm leading-6 text-slate-700">
                  {createdLink}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
