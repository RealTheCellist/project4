import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container-mobile">
      <section className="hero-panel stack-lg">
        <div className="eyebrow relative z-10 w-fit">
          <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          The Tiny Audience
        </div>
        <div className="stack-md relative z-10">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
            Share unfinished writing with just a few trusted readers.
          </h1>
          <p className="text-base leading-7 subtle">
            Write a draft, create an invite link, and collect lightweight
            reactions without posting to everyone. Built for mobile, quick
            replies, and low-pressure feedback.
          </p>
        </div>
        <div className="stack-sm relative z-10">
          <Link className="btn-primary" href="/signup">
            Start for free
          </Link>
          <Link className="btn-secondary" href="/login">
            Log in
          </Link>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3">
        <div className="metric-card">
          <p className="text-sm font-semibold text-[var(--accent)]">Writers</p>
          <p className="metric-value">3 steps</p>
          <p className="mt-2 text-sm subtle">Write, invite, review feedback.</p>
        </div>
        <div className="metric-card">
          <p className="text-sm font-semibold text-[var(--accent)]">Readers</p>
          <p className="metric-value">No login</p>
          <p className="mt-2 text-sm subtle">Open link, react, and leave.</p>
        </div>
      </section>

      <section className="mt-6 stack-md">
        <div className="card p-5">
          <h2 className="section-title">Writer flow</h2>
          <p className="section-copy">
            Log in, create a draft, generate an invite link, and check replies in
            one place.
          </p>
        </div>
        <div className="card p-5">
          <h2 className="section-title">Reader flow</h2>
          <p className="section-copy">
            Open an invite, read the draft, choose tags, leave a comment, and
            you are done.
          </p>
        </div>
      </section>
    </main>
  );
}
