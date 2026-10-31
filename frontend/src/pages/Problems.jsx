import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, CircleDashed, Search, Sparkles } from "lucide-react";
import api from "../api/client";
import { useDebounce, useFetch } from "../utils/hooks";
import { DIFFICULTY } from "../utils/constants";
import { DifficultyBadge, Empty, ErrorBox, PageLoader, Pager } from "../components/ui";

export default function Problems() {
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(0);
  const dq = useDebounce(q);

  useEffect(() => setPage(0), [dq, difficulty, tag]);

  const list = useFetch(
    () => api.get("/problems", { params: { q: dq || undefined, difficulty: difficulty || undefined, tag: tag || undefined, page, size: 15 } }).then((r) => r.data),
    [dq, difficulty, tag, page]
  );
  const tags = useFetch(() => api.get("/problems/tags").then((r) => r.data), []);
  const daily = useFetch(() => api.get("/problems/daily").then((r) => r.data).catch(() => null), []);

  const d = list.data;
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Problems</h1>
          <p className="mt-1 text-slate-500">Pick one, write a solution, and see how it holds up against hidden tests.</p>
        </div>
        {daily.data && (
          <Link to={`/problems/${daily.data.slug}`} className="flex items-center gap-3 rounded-xl border border-signal-500/40 bg-signal-500/10 px-4 py-2.5 transition hover:bg-signal-500/20">
            <Sparkles className="text-signal-500" size={20} />
            <div><p className="text-xs font-semibold text-signal-600 dark:text-signal-400">Today's problem</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{daily.data.title}</p></div>
          </Link>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input className="input pl-9" placeholder="Search problems" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {["", "EASY", "MEDIUM", "HARD"].map((v) => (
            <button key={v} onClick={() => setDifficulty(v)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${difficulty === v ? "border-brand-500 bg-brand-500 text-white" : "border-slate-300 hover:bg-slate-100 dark:border-ink-600 dark:hover:bg-ink-700"}`}>
              {v ? DIFFICULTY[v].label : "All"}
            </button>
          ))}
        </div>
      </div>

      {tags.data?.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {tag && <button onClick={() => setTag("")} className="chip bg-brand-500 text-white">{tag} &times;</button>}
          {tags.data.filter((t) => t !== tag).map((t) => (
            <button key={t} onClick={() => setTag(t)} className="chip bg-slate-200/70 text-slate-600 hover:bg-brand-500/15 hover:text-brand-600 dark:bg-ink-700 dark:text-slate-300">{t}</button>
          ))}
        </div>
      )}

      <div className="panel overflow-hidden">
        {list.loading && !d ? <PageLoader /> : list.error ? <ErrorBox error={list.error} /> : d.items.length === 0 ? (
          <Empty title="No problems match" hint="Try a different search or clear the filters." />
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-ink-600 dark:bg-ink-900/40">
              <tr><th className="th w-12"></th><th className="th">Title</th><th className="th hidden md:table-cell">Tags</th>
                <th className="th hidden text-right sm:table-cell">Acceptance</th><th className="th text-right">Difficulty</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-ink-700">
              {d.items.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50 dark:hover:bg-ink-700/40">
                  <td className="td">
                    {p.status === "SOLVED" ? <CheckCircle2 className="text-mint-500" size={18} />
                      : p.status === "ATTEMPTED" ? <CircleDashed className="text-signal-500" size={18} /> : null}
                  </td>
                  <td className="td"><Link to={`/problems/${p.slug}`} className="font-semibold text-slate-900 hover:text-brand-500 dark:text-white">{p.title}</Link></td>
                  <td className="td hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">{p.tags.slice(0, 3).map((t) => <span key={t} className="chip bg-slate-100 text-slate-500 dark:bg-ink-700">{t}</span>)}</div>
                  </td>
                  <td className="td hidden text-right font-mono text-slate-500 sm:table-cell">{p.submissions ? `${p.acceptance}%` : "-"}</td>
                  <td className="td text-right"><DifficultyBadge value={p.difficulty} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {d && <Pager page={d.page} pages={d.pages} onChange={setPage} />}
      </div>
    </div>
  );
}
