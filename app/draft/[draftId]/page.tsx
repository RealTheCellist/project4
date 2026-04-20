"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { addDays, format } from "date-fns";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardHeader } from "@/components/dashboard-header";
import { useAuth } from "@/lib/auth-context";
import {
  createInvite,
  getDraftById,
  getInvitesByDraftId,
} from "@/lib/firebase/firestore";
import type { Draft, Invite } from "@/lib/types";

export default function DraftDetailPage() {
  const params = useParams<{ draftId: string }>();
  const draftId = params.draftId;
  const { user } = useAuth();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [maxUses, setMaxUses] = useState("10");
  const [expiresAt, setExpiresAt] = useState(
    format(addDays(new Date(), 7), "yyyy-MM-dd"),
  );
  const [createdLink, setCreatedLink] = useState("");

  useEffect(() => {
    const loadDraft = async () => {
      if (!user) {
        return;
      }

      try {
        setLoading(true);
        const [loadedDraft, loadedInvites] = await Promise.all([
          getDraftById(draftId),
          getInvitesByDraftId(draftId),
        ]);

        if (!loadedDraft || loadedDraft.authorId !== user.uid) {
          setError("You do not have access to this draft.");
          setDraft(null);
        } else {
          setDraft(loadedDraft);
          setInvites(loadedInvites);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load the draft details.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadDraft();
  }, [draftId, user]);

  const publicBaseUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.location.origin;
  }, []);

  const handleCreateInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || !draft) {
      return;
    }

    setSubmitting(true);
    setError("");
    setCreatedLink("");

    try {
      const inviteId = await createInvite({
        draftId: draft.id,
        creatorId: user.uid,
        expiresAtIso: new Date(`${expiresAt}T23:59:59`).toISOString(),
        maxUses: Number(maxUses),
      });

      const refreshInvites = await getInvitesByDraftId(draft.id);
      setInvites(refreshInvites);
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
      <main className="container-mobile">
        <DashboardHeader />

        {loading ? (
          <section className="card mt-6 animate-pulse p-5">
            <div className="h-6 w-2/3 rounded-full bg-orange-100" />
            <div className="mt-4 h-4 w-full rounded-full bg-orange-50" />
            <div className="mt-2 h-4 w-5/6 rounded-full bg-orange-50" />
          </section>
        ) : null}

        {error ? (
          <section className="card mt-6 p-5 text-sm text-red-600">
            {error}
          </section>
        ) : null}

        {draft ? (
          <>
            <section className="card-soft mt-6 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--accent)]">
                    Draft
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                    {draft.title}
                  </h1>
                </div>
                <Link
                  className="btn-secondary !w-auto px-4"
                  href={`/draft/${draft.id}/feedback`}
                >
                  View feedback
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="metric-card">
                  <p className="text-sm font-semibold text-[var(--accent)]">Views</p>
                  <p className="metric-value">{draft.viewCount}</p>
                </div>
                <div className="metric-card">
                  <p className="text-sm font-semibold text-[var(--accent)]">
                    Feedback
                  </p>
                  <p className="metric-value">{draft.feedbackCount}</p>
                </div>
              </div>

              <article className="mt-5 whitespace-pre-wrap leading-7 text-slate-700">
                {draft.content}
              </article>
            </section>

            <section className="card mt-6 p-5">
              <div className="stack-sm">
                <h2 className="section-title">Create an invite</h2>
                <p className="section-copy">
                  Set a usage limit and expiration date, then share the generated
                  link with your small audience.
                </p>
              </div>

              <form className="mt-5 stack-md" onSubmit={handleCreateInvite}>
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

                <button className="btn-primary" disabled={submitting} type="submit">
                  {submitting ? "Creating..." : "Generate invite link"}
                </button>
              </form>

              {createdLink ? (
                <div className="mt-5 rounded-3xl bg-[var(--accent-soft)] p-4">
                  <p className="text-sm font-semibold text-[var(--accent)]">
                    Link created
                  </p>
                  <p className="mt-2 break-all text-sm leading-6 text-slate-700">
                    {createdLink}
                  </p>
                </div>
              ) : null}
            </section>

            <section className="card mt-6 p-5">
              <h2 className="section-title">Recent invites</h2>
              <div className="mt-4 stack-sm">
                {invites.length === 0 ? (
                  <p className="subtle">No invite links created yet.</p>
                ) : (
                  invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        /invite/{invite.id}
                      </p>
                      <p className="mt-2 text-sm subtle">
                        Used {invite.usedCount}/{invite.maxUses} · Expires{" "}
                        {format(invite.expiresAt.toDate(), "yyyy.MM.dd HH:mm")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </AuthGuard>
  );
}
