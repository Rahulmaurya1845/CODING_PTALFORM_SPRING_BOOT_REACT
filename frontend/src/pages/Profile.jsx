import { Link, useParams } from "react-router-dom";
import { Flame, Target, Trophy } from "lucide-react";
import api from "../api/client";
import { useFetch } from "../utils/hooks";
import { DIFFICULTY, LANGS, fmtDateTime, timeAgo } from "../utils/constants";
import { Avatar, ErrorBox, PageLoader, Stat, VerdictBadge } from "../components/ui";
import Heatmap from "../components/Heatmap";

export default function Profile() {
  const { username } = useParams();
  const { data: p, loading, error } = useFetch(() => api.get(`/users/${username}`).then((r) => r.data), [username]);
  if (loading) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;

  const totalAvail = Object.values(p.available).reduce((a, b) => a + b, 0);
  const maxLang = Math.max(1, ...Object.values(p.languages));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-5">
        <Avatar name={p.username} size={72} />
        <div>
          <h1 className="text-3xl font-extrabold">{p.username}</h1>
          <p className="text-sm text-slate-500">Joined {fmtDateTime(p.joinedAt).split(",").slice(0, 2).join(",")}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Global rank" value={p.rank ? `#${p.rank}` : "-"} hint={p.rank ? "by problems solved" : "solve a problem to get ranked"} />
        <Stat label="Solved" value={`${p.totalSolved} / ${totalAvail}`} />
        <Stat label="Acceptance" value={`${p.acceptanceRate}%`} hint={`${p.accepted} of ${p.totalSubmissions} submissions`} />
        <Stat label="Streak" value={<span className="flex items-center gap-1.5"><Flame size={20} className={p.streak ? "text-signal-500" : "text-slate-400"} />{p.streak}d</span>} hint={`longest ${p.longestStreak}d`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="panel p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold"><Target size={16} className="text-brand-500" /> Progress by difficulty</h2>
          <div className="space-y-4">
            {Object.keys(DIFFICULTY).map((k) => {
              const s = p.solved[k] || 0, a = p.available[k] || 0;
              return (
                <div key={k}>
                  <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">{DIFFICULTY[k].label}</span><span className="font-mono text-slate-500">{s} / {a}</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-ink-700"><div className={`h-full rounded-full ${DIFFICULTY[k].bar}`} style={{ width: `${a ? (s / a) * 100 : 0}%` }} /></div>
                </div>
              );
            })}
          </div>
          <h2 className="mb-4 mt-8 flex items-center gap-2 text-base font-bold"><Trophy size={16} className="text-brand-500" /> Languages</h2>
          {Object.keys(p.languages).length === 0 ? <p className="text-sm text-slate-500">No submissions yet.</p> : (
            <div className="space-y-3">
              {Object.entries(p.languages).map(([l, n]) => (
                <div key={l}>
                  <div className="mb-1 flex justify-between text-sm"><span>{LANGS[l]?.label || l}</span><span className="font-mono text-slate-500">{n}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-ink-700"><div className="h-full rounded-full bg-brand-500" style={{ width: `${(n / maxLang) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="panel p-5"><Heatmap data={p.heatmap} /></div>
          <div className="panel p-5">
            <h2 className="mb-3 text-base font-bold">Recent submissions</h2>
            {p.recent.length === 0 ? <p className="text-sm text-slate-500">Nothing yet.</p> : (
              <ul className="divide-y divide-slate-100 dark:divide-ink-700">
                {p.recent.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                    <Link to={`/problems/${s.problemSlug}`} className="truncate font-medium hover:text-brand-500">{s.problemTitle}</Link>
                    <div className="flex shrink-0 items-center gap-3"><VerdictBadge value={s.verdict} short /><span className="w-16 text-right text-xs text-slate-500">{timeAgo(s.createdAt)}</span></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
