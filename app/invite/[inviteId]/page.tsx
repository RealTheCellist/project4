"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import {
  FEEDBACK_TAG_OPTIONS,
  consumeInviteAccess,
  getInviteById,
  getPublicDraftById,
  submitFeedback,
} from "@/lib/firebase/firestore";
import { renderDraftContent } from "@/lib/rich-text";
import type { Draft, FeedbackTag, Invite } from "@/lib/types";

type InviteState = "loading" | "ready" | "invalid" | "submitted";

export default function InvitePage() {
  const params = useParams<{ inviteId: string }>();
  const inviteId = params.inviteId;
  const [state, setState] = useState<InviteState>("loading");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [nickname, setNickname] = useState("");
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<FeedbackTag[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const sessionKeys = useMemo(
    () => ({
      consumed: `invite-consumed-${inviteId}`,
      reviewer: `invite-reviewer-${inviteId}`,
      submitted: `invite-submitted-${inviteId}`,
    }),
    [inviteId],
  );

  const getReviewerId = () => {
    if (typeof window === "undefined") {
      return "";
    }

    const existingReviewerId =
      window.sessionStorage.getItem(sessionKeys.reviewer) ?? uuidv4();

    window.sessionStorage.setItem(sessionKeys.reviewer, existingReviewerId);
    return existingReviewerId;
  };

  useEffect(() => {
    const loadInvite = async () => {
      try {
        if (typeof window !== "undefined") {
          const alreadySubmitted =
            window.sessionStorage.getItem(sessionKeys.submitted) === "1";

          if (alreadySubmitted) {
            setState("submitted");
            return;
          }
        }

        const alreadyConsumed =
          typeof window !== "undefined" &&
          window.sessionStorage.getItem(sessionKeys.consumed) === "1";

        if (alreadyConsumed) {
          const existingInvite = await getInviteById(inviteId);

          if (!existingInvite) {
            setState("invalid");
            return;
          }

          const loadedDraft = await getPublicDraftById(existingInvite.draftId);

          if (!loadedDraft) {
            setState("invalid");
            return;
          }

          setInvite(existingInvite);
          setDraft(loadedDraft);
          setState("ready");
          return;
        }

        const loaded = await consumeInviteAccess(inviteId);
        setInvite(loaded.invite);
        setDraft(loaded.draft);

        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(sessionKeys.consumed, "1");
        }

        setState("ready");
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Invite load failed.",
        );
        setState("invalid");
      }
    };

    void loadInvite();
  }, [inviteId, sessionKeys.consumed, sessionKeys.submitted]);

  const toggleTag = (tag: FeedbackTag) => {
    setSelectedTags((previousTags) =>
      previousTags.includes(tag)
        ? previousTags.filter((currentTag) => currentTag !== tag)
        : [...previousTags, tag],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const reviewerId = getReviewerId();

    if (!draft || !invite || !reviewerId) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await submitFeedback({
        draftId: draft.id,
        inviteId: invite.id,
        reviewerId,
        nickname: nickname.trim() || "Anonymous reader",
        tags: selectedTags,
        comment,
      });

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(sessionKeys.submitted, "1");
      }

      setState("submitted");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Feedback submission failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (state === "loading") {
    return (
      <main className="container-mobile">
        <section className="card animate-pulse p-5">
          <div className="h-6 w-2/3 rounded-full bg-orange-100" />
          <div className="mt-4 h-40 rounded-3xl bg-orange-50" />
        </section>
      </main>
    );
  }

  if (state === "invalid" || !draft || !invite) {
    return (
      <main className="container-mobile">
        <section className="card p-5">
          <h1 className="text-2xl font-semibold">This invite is not available.</h1>
          <p className="mt-3 leading-7 subtle">
            It may be expired, inactive, or already used up.
          </p>
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <Link className="btn-secondary mt-5" href="/">
            Back to home
          </Link>
        </section>
      </main>
    );
  }

  if (state === "submitted") {
    return (
      <main className="container-mobile">
        <section className="card-soft p-5">
          <div className="pill bg-green-50 text-[var(--success)]">Submitted</div>
          <h1 className="mt-4 text-2xl font-semibold">
            Your reaction has been sent.
          </h1>
          <p className="mt-3 leading-7 subtle">
            Thanks for being part of this tiny audience. You can close this page
            now.
          </p>
          <Link className="btn-secondary mt-5" href="/">
            Visit home
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="container-mobile">
      <section className="card-soft p-5">
        <div className="eyebrow w-fit">
          <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          Tiny Audience Invite
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{draft.title}</h1>
        <p className="mt-2 subtle">
          Read first, then leave a few lightweight reactions for the writer.
        </p>
        <article
          className="draft-content mt-5 text-slate-700"
          dangerouslySetInnerHTML={{
            __html: renderDraftContent(draft.content),
          }}
        />
      </section>

      <section className="card mt-6 p-5">
        <div className="stack-sm">
          <h2 className="section-title">Leave a reaction</h2>
          <p className="section-copy">
            Pick the tags that fit and leave a short comment for the writer.
          </p>
        </div>

        <form className="mt-5 stack-md" onSubmit={handleSubmit}>
          <div>
            <label className="label" htmlFor="nickname">
              Nickname
            </label>
            <input
              id="nickname"
              className="input"
              maxLength={30}
              placeholder="Anonymous reader"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
            />
          </div>

          <div>
            <span className="label">Feedback tags</span>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {FEEDBACK_TAG_OPTIONS.map((tagOption) => {
                const active = selectedTags.includes(tagOption.value);

                return (
                  <button
                    key={tagOption.value}
                    className={`rounded-3xl border px-4 py-4 text-left transition ${
                      active
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "border-[var(--border)] bg-white text-slate-700"
                    }`}
                    type="button"
                    onClick={() => toggleTag(tagOption.value)}
                  >
                    <span className="text-sm font-semibold">{tagOption.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="comment">
              Comment
            </label>
            <textarea
              id="comment"
              className="input min-h-40 resize-y"
              placeholder="What stood out, what felt clear, or what needs more detail?"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <button className="btn-primary" disabled={submitting} type="submit">
            {submitting ? "Sending..." : "Send reaction"}
          </button>
        </form>
      </section>
    </main>
  );
}
