import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Draft } from "@/lib/types";

export function DraftCard({ draft }: { draft: Draft }) {
  return (
    <article className="card p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-semibold text-slate-900">
            {draft.title}
          </h2>
          <p className="mt-2 line-clamp-3 leading-7 subtle">{draft.content}</p>
        </div>
        <Link className="btn-secondary !w-auto px-4" href={`/draft/${draft.id}`}>
          Open
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-sm">
        <span className="pill bg-[var(--accent-soft)] text-[var(--accent)]">
          Views {draft.viewCount}
        </span>
        <span className="pill bg-slate-100 text-slate-700">
          Feedback {draft.feedbackCount}
        </span>
        <span className="pill bg-slate-100 text-slate-500">
          {formatDistanceToNow(draft.updatedAt.toDate(), {
            addSuffix: true,
          })}
        </span>
      </div>
    </article>
  );
}
