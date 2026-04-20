"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInUser } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
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
      await signInUser(email, password);
      router.replace("/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while logging in.",
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
            Welcome back
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Log in</h1>
          <p className="section-copy">
            Return to your dashboard and keep your tiny audience close.
          </p>
        </div>

        <form className="mt-6 stack-md" onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <button className="btn-primary" disabled={submitting} type="submit">
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-5 text-sm subtle">
          Need an account?{" "}
          <Link className="font-semibold text-[var(--accent)]" href="/signup">
            Create one
          </Link>
        </p>
      </section>
    </main>
  );
}
