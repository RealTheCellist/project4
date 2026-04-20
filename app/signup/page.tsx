"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signUpUser } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/auth-context";

export default function SignUpPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await signUpUser(name, email, password);
      router.replace("/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while creating the account.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container-mobile">
      <section className="card-soft p-5">
        <div className="stack-sm">
          <div className="eyebrow w-fit">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            Get started
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Create account</h1>
          <p className="section-copy">
            Start writing drafts and share them with a tiny, trusted audience.
          </p>
        </div>

        <form className="mt-6 stack-md" onSubmit={handleSubmit}>
          <div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              className="input"
              type="text"
              autoComplete="name"
              placeholder="Your display name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          </div>

          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <button className="btn-primary" disabled={submitting} type="submit">
            {submitting ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-sm subtle">
          Already have an account?{" "}
          <Link className="font-semibold text-[var(--accent)]" href="/login">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
