"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardHeader } from "@/components/dashboard-header";
import { RichDraftEditor } from "@/components/rich-draft-editor";
import { useAuth } from "@/lib/auth-context";
import {
  getDraftById,
  getInvitesByDraftId,
  updateDraft,
} from "@/lib/firebase/firestore";
import { renderDraftContent, sanitizeRichHtml } from "@/lib/rich-text";
import type { Draft, Invite } from "@/lib/types";

export default function DraftDetailPage() {
  const params = useParams<{ draftId: string }>();
  const draftId = params.draftId;
  const { user } = useAuth();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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
          setEditTitle(loadedDraft.title);
          setEditContent(loadedDraft.content);
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

  const handleSaveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft) {
      return;
    }

    setSavingEdit(true);
    setError("");

    try {
      await updateDraft(draft.id, {
        title: editTitle,
        content: sanitizeRichHtml(editContent),
      });

      const refreshedDraft = await getDraftById(draft.id);

      if (refreshedDraft) {
        setDraft(refreshedDraft);
        setEditTitle(refreshedDraft.title);
        setEditContent(refreshedDraft.content);
      }

      setEditing(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save the updated draft.",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const startEditing = () => {
    if (!draft) {
      return;
    }

    setEditTitle(draft.title);
    setEditContent(draft.content);
    setEditing(true);
  };

  const cancelEditing = () => {
    if (!draft) {
      return;
    }

    setEditTitle(draft.title);
    setEditContent(draft.content);
    setEditing(false);
  };

  return (
    <AuthGuard>
      <main className="mx-auto w-full max-w-5xl px-4 pb-8 pt-5 sm:px-6">
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
                    {editing ? "Edit your draft" : draft.title}
                  </h1>
                </div>
                {!editing ? (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      className="btn-secondary !w-auto px-4"
                      href={`/invite/new?draftId=${draft.id}`}
                    >
                      Create invite
                    </Link>
                    <button
                      className="btn-secondary !w-auto px-4"
                      type="button"
                      onClick={startEditing}
                    >
                      Edit draft
                    </button>
                    <Link
                      className="btn-secondary !w-auto px-4"
                      href={`/draft/${draft.id}/feedback`}
                    >
                      View feedback
                    </Link>
                  </div>
                ) : (
                  <button
                    className="btn-secondary !w-auto px-4"
                    type="button"
                    onClick={cancelEditing}
                  >
                    Cancel edit
                  </button>
                )}
              </div>

              {editing ? (
                <form className="mt-5 stack-md" onSubmit={handleSaveEdit}>
                  <div>
                    <label className="label" htmlFor="edit-title">
                      Title
                    </label>
                    <input
                      id="edit-title"
                      className="input"
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="edit-content">
                      Content
                    </label>
                    <RichDraftEditor value={editContent} onChange={setEditContent} />
                  </div>

                  <div className="flex justify-end">
                    <button
                      className="draft-save-button"
                      disabled={savingEdit}
                      type="submit"
                    >
                      {savingEdit ? "Saving..." : "Update Draft"}
                    </button>
                  </div>
                </form>
              ) : (
                <article
                  className="draft-content mt-5 text-slate-700"
                  dangerouslySetInnerHTML={{
                    __html: renderDraftContent(draft.content),
                  }}
                />
              )}
            </section>

            {!editing ? (
              <>
                <section className="card mt-6 p-5">
                  <div className="mt-0 grid grid-cols-2 gap-3">
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
                </section>

                <section className="card mt-6 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="section-title">Recent invites</h2>
                      <p className="mt-2 section-copy">
                        Create new ones from the invite menu and keep track of the
                        links already sent out for this draft.
                      </p>
                    </div>
                    <Link
                      className="btn-secondary !w-auto px-4"
                      href={`/invite/new?draftId=${draft.id}`}
                    >
                      New invite
                    </Link>
                  </div>

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
                            Used {invite.usedCount}/{invite.maxUses} 쨌 Expires{" "}
                            {format(invite.expiresAt.toDate(), "yyyy.MM.dd HH:mm")}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </>
            ) : null}
          </>
        ) : null}
      </main>
    </AuthGuard>
  );
}
