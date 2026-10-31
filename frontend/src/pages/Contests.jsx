import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2, Clock, Users } from "lucide-react";
import api, { errMsg } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCountdown, useFetch } from "../utils/hooks";
import { fmtDateTime } from "../utils/constants";
import { DifficultyBadge, Empty, ErrorBox, PageLoader, Spinner } from "../components/ui";

const STATUS = {
  RUNNING: ["Live", "bg-mint-500/15 text-mint-600 dark:text-mint-400"],
  UPCOMING: ["Upcoming", "bg-brand-500/15 text-brand-600 dark:text-brand-400"],
  ENDED: ["Ended", "bg-slate-500/15 text-slate-500"],
};
const StatusChip = ({ s }) => (
  <span className={`chip ${STATUS[s][1]}`}>{s === "RUNNING" && <span className="h-1.5 w-1.5 animate-pulseDot rounded-full bg-mint-500" />}{STATUS[s][0]}</span>
);

function Countdown({ target, label }) {
  const c = useCountdown(target);
  const box = (v, l) => (
    <div className="min-w-[58px] rounded-lg bg-slate-100 px-3 py-2 text-center dark:bg-ink-900">
      <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white">{String(v).padStart(2, "0")}</p>
      <p className="text-[11px] text-slate-500">{l}</p>
    </div>
  );
  return (
    <div>
      <p className="mb-2 text-sm text-slate-500">{label}</p>
      <div className="flex gap-2">{box(c.d, "days")}{box(c.h, "hours")}{box(c.m, "min")}{box(c.s, "sec")}</div>
    </div>
  );
}

export function ContestList() {
  const { isAdmin } = useAuth();
  const { data, loading, error } = useFetch(() => api.get("/contests").then((r) => r.data), []);
  if (loading) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  const order = { RUNNING: 0, UPCOMING: 1, ENDED: 2 };
  const list = [...data].sort((a, b) => order[a.status] - order[b.status]);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Contests</h1>
          <p className="mt-1 text-slate-500">Timed rounds ranked by problems solved, then by penalty time.</p>
        </div>
        {isAdmin && <Link to="/admin/contests/new" className="btn-primary">Create contest</Link>}
      </div>
      {list.length === 0 ? (
        <div className="panel"><Empty title="No contests yet" hint={isAdmin ? "Create the first one with the button above." : "An admin has not created a contest yet. Check back soon."} /></div>
      ) : (
        <div className="space-y-4">
          {list.map((c) => (
            <Link key={c.id} to={`/contests/${c.id}`} className="panel flex flex-wrap items-center justify-between gap-4 p-5 transition hover:border-brand-500">
              <div className="min-w-0">
                <div className="flex items-center gap-3"><h2 className="text-xl font-bold">{c.title}</h2><StatusChip s={c.status} /></div>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Clock size={14} /> {fmtDateTime(c.startTime)} to {fmtDateTime(c.endTime)}</span>
                  <span className="flex items-center gap-1"><Users size={14} /> {c.participants}</span>
                  <span>{c.problemCount} problems</span>
                </p>
              </div>
              {c.registered && <span className="chip bg-mint-500/15 text-mint-600 dark:text-mint-400"><CheckCircle2 size={13} /> Registered</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Board({ id, problems, running }) {
  const { data, loading, reload } = useFetch(() => api.get(`/contests/${id}/leaderboard`).then((r) => r.data), [id]);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(reload, 15000);
    return () => clearInterval(t);
  }, [running]); // eslint-disable-line
  if (loading && !data) return <PageLoader />;
  if (!data?.length) return <Empty title="No participants yet" hint="Register for the contest to appear on the board." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-slate-200 bg-slate-50 dark:border-ink-600 dark:bg-ink-900/40">
          <tr><th className="th w-12">#</th><th className="th">Coder</th><th className="th text-center">Solved</th><th className="th text-center">Penalty</th>
            {problems.map((p, i) => <th key={p.id} className="th text-center" title={p.title}>{String.fromCharCode(65 + i)}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-ink-700">
          {data.map((r) => (
            <tr key={r.username}>
              <td className="td font-mono">{r.rank}</td>
              <td className="td"><Link to={`/u/${r.username}`} className="font-semibold hover:text-brand-500">{r.username}</Link></td>
              <td className="td text-center font-mono font-bold">{r.solved}</td>
              <td className="td text-center font-mono text-slate-500">{r.penalty}</td>
              {problems.map((p) => {
                const x = r.results?.[p.id];
                return (
                  <td key={p.id} className="td text-center font-mono text-xs">
                    {x?.solved ? <span className="text-mint-600 dark:text-mint-400">+{x.attempts || ""}<br /><span className="text-slate-400">{x.minutes}m</span></span>
                      : x?.attempts ? <span className="text-coral-500">-{x.attempts}</span> : <span className="text-slate-300 dark:text-ink-500">.</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ContestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const { data: c, loading, error, reload } = useFetch(() => api.get(`/contests/${id}`).then((r) => r.data), [id, user?.id]);
  const [tab, setTab] = useState("problems");
  const [busy, setBusy] = useState(false);

  if (loading && !c) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;

  const register = async () => {
    if (!user) return nav("/login", { state: { from: `/contests/${id}` } });
    setBusy(true);
    try { await api.post(`/contests/${id}/register`); toast.success("You are registered"); reload(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-3"><h1 className="text-3xl font-extrabold">{c.title}</h1><StatusChip s={c.status} /></div>
            <p className="mt-2 text-sm text-slate-500">{fmtDateTime(c.startTime)} to {fmtDateTime(c.endTime)} &middot; {c.participants} registered</p>
            {c.description && <p className="mt-3 leading-7">{c.description}</p>}
            <p className="mt-3 text-xs text-slate-500">Scoring: most problems solved wins. Ties are broken by penalty = minutes to each solve + 20 for every wrong attempt before it.</p>
          </div>
          <div className="space-y-4">
            {c.status === "UPCOMING" && <Countdown target={c.startTime} label="Starts in" />}
            {c.status === "RUNNING" && <Countdown target={c.endTime} label="Ends in" />}
            {c.status !== "ENDED" && (c.registered
              ? <span className="chip bg-mint-500/15 text-mint-600 dark:text-mint-400"><CheckCircle2 size={13} /> You are registered</span>
              : <button className="btn-primary" onClick={register} disabled={busy}>{busy && <Spinner />} Register</button>)}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-1 border-b border-slate-200 dark:border-ink-600">
        {[["problems", "Problems"], ["leaderboard", "Leaderboard"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === k ? "border-brand-500 text-brand-600 dark:text-brand-400" : "border-transparent text-slate-500"}`}>{l}</button>
        ))}
      </div>

      <div className="panel mt-4 overflow-hidden">
        {tab === "problems" && c.status === "RUNNING" && !c.registered && (
          <p className="border-b border-signal-500/30 bg-signal-500/10 px-5 py-3 text-sm text-signal-600 dark:text-signal-400">
            Register for this contest (button at the top) so your submissions count on the leaderboard.
          </p>
        )}
        {tab === "problems" ? (
          c.problems.length === 0 ? <Empty title="Problems are hidden" hint="They appear here when the contest starts." /> : (
            <ul className="divide-y divide-slate-100 dark:divide-ink-700">
              {c.problems.map((p, i) => (
                <li key={p.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 font-mono font-bold text-brand-600 dark:text-brand-400">{String.fromCharCode(65 + i)}</span>
                  <Link to={`/problems/${p.slug}${c.status === "RUNNING" ? `?contest=${c.id}` : ""}`} className="flex-1 font-semibold text-slate-900 hover:text-brand-500 dark:text-white">{p.title}</Link>
                  {p.status === "SOLVED" && <CheckCircle2 className="text-mint-500" size={18} />}
                  <DifficultyBadge value={p.difficulty} />
                </li>
              ))}
            </ul>
          )
        ) : <Board id={id} problems={c.problems} running={c.status === "RUNNING"} />}
      </div>
    </div>
  );
}
