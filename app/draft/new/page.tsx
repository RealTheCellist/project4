"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardHeader } from "@/components/dashboard-header";
import { useAuth } from "@/lib/auth-context";
import { createDraft } from "@/lib/firebase/firestore";

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
        content,
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
      <main className="container-mobile">
        <DashboardHeader />

        <section className="card-soft mt-6 p-5">
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
              <textarea
                id="content"
                className="input min-h-64 resize-y"
                placeholder="Write the version you want a few trusted people to read."
                value={content}
                onChange={(event) => setContent(event.target.value)}
                required
              />
              <p className="mt-2 text-sm subtle">
                Tip: shorter drafts usually get better responses on mobile.
              </p>
            </div>

            {error ? (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            ) : null}

            <button className="btn-primary" disabled={submitting} type="submit">
              {submitting ? "Saving..." : "Save draft"}
            </button>
          </form>
        </section>
      </main>
    </AuthGuard>
  );
}
