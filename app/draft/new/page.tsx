"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardHeader } from "@/components/dashboard-header";
import { RichDraftEditor } from "@/components/rich-draft-editor";
import { useAuth } from "@/lib/auth-context";
import { createDraft } from "@/lib/firebase/firestore";
import { sanitizeRichHtml } from "@/lib/rich-text";

export default function NewDraftPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const draftId = await createDraft({
        authorId: user.uid,
        title,
        content: sanitizeRichHtml(content),
      });

      router.replace(`/draft/${draftId}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while saving the draft.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <main className="mx-auto w-full max-w-5xl px-4 pb-8 pt-5 sm:px-6">
        <DashboardHeader />

        <section className="card-soft mt-6 p-5 sm:p-6">
          <div className="stack-sm">
            <div className="eyebrow w-fit">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              New draft
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Write a draft</h1>
            <p className="section-copy">
              Keep it light, unfinished, and easy for a small group to respond to.
            </p>
          </div>

          <form className="mt-6 stack-md" onSubmit={handleSubmit}>
            <div>
              <label className="label" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                className="input"
                placeholder="A clear title for your draft"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="content">
                Content
              </label>
              <RichDraftEditor value={content} onChange={setContent} />
              <p className="mt-2 text-sm subtle">
                Use the toolbar above the writing area to shape tone, size, color,
                and rhythm before you share the draft.
              </p>
            </div>

            {error ? (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            ) : null}

          </form>
        </section>

        <div className="draft-save-bar">
          <div className="draft-save-meta">
            <span className="draft-save-dot" />
            Ready to keep this draft
          </div>
          <button
            className="draft-save-button"
            disabled={submitting}
            type="button"
            onClick={() => {
              const form = document.querySelector("form");
              if (form) {
                form.requestSubmit();
              }
            }}
          >
            {submitting ? "Saving..." : "Save Draft"}
          </button>
        </div>
      </main>
    </AuthGuard>
  );
}
