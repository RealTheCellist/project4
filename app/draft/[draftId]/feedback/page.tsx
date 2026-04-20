"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardHeader } from "@/components/dashboard-header";
import { useAuth } from "@/lib/auth-context";
import {
  FEEDBACK_TAG_OPTIONS,
  getDraftById,
  getFeedbacksByDraftId,
} from "@/lib/firebase/firestore";
import type { Draft, Feedback, FeedbackTag } from "@/lib/types";

export default function DraftFeedbackPage() {
  const params = useParams<{ draftId: string }>();
  const draftId = params.draftId;
  const { user } = useAuth();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user) {
        return;
      }

      try {
        setLoading(true);
        const loadedDraft = await getDraftById(draftId);

        if (!loadedDraft || loadedDraft.authorId !== user.uid) {
          setError("You do not have access to this feedback view.");
          setDraft(null);
          return;
        }

        setDraft(loadedDraft);
        setFeedbacks(await getFeedbacksByDraftId(draftId));
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load feedback.",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [draftId, user]);

  const tagCounts = useMemo(() => {
    return feedbacks.reduce<Record<FeedbackTag, number>>(
      (counts, feedback) => {
        feedback.tags.forEach((tag) => {
          counts[tag] += 1;
        });
        return counts;
      },
      {
        clear: 0,
        interesting: 0,
        confusing: 0,
        needs_detail: 0,
      },
    );
  }, [feedbacks]);

  return (
    <AuthGuard>
      <main className="container-mobile">
        <DashboardHeader />

        <section className="card mt-6 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Feedback overview</h1>
              <p className="mt-2 subtle">{draft?.title ?? "Loading draft..."}</p>
            </div>
            <Link
              className="btn-secondary !w-auto px-4"
              href={`/draft/${draftId}`}
            >
              Back to draft
            </Link>
          </div>
        </section>

        {loading ? (
          <section className="card mt-6 animate-pulse p-5">
            <div className="h-5 w-1/2 rounded-full bg-orange-100" />
            <div className="mt-3 h-20 rounded-3xl bg-orange-50" />
          </section>
        ) : null}

        {error ? (
          <section className="card mt-6 p-5 text-sm text-red-600">
            {error}
          </section>
        ) : null}

        {!loading && draft ? (
          <>
            <section className="card mt-6 p-5">
              <h2 className="section-title">Tag summary</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {FEEDBACK_TAG_OPTIONS.map((tagOption) => (
                  <div
                    key={tagOption.value}
                    className="rounded-3xl bg-[var(--accent-soft)] p-4"
                  >
                    <p className="text-sm font-semibold text-[var(--accent)]">
                      {tagOption.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {tagCounts[tagOption.value]}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 stack-md">
              {feedbacks.length === 0 ? (
                <div className="card p-5 subtle">No feedback has arrived yet.</div>
              ) : (
                feedbacks.map((feedback) => (
                  <article key={feedback.id} className="card p-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-slate-900">
                        {feedback.nickname}
                      </p>
                      <p className="text-xs subtle">
                        {feedback.createdAt.toDate().toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {feedback.tags.map((tag) => {
                        const label = FEEDBACK_TAG_OPTIONS.find(
                          (option) => option.value === tag,
                        )?.label;
                        return (
                          <span
                            key={`${feedback.id}-${tag}`}
                            className="pill bg-slate-100 text-slate-700"
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                    <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">
                      {feedback.comment}
                    </p>
                  </article>
                ))
              )}
            </section>
          </>
        ) : null}
      </main>
    </AuthGuard>
  );
}
