import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Trophy, Terminal, Flame, Play, Layers } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Avatar, DifficultyBadge, VerdictBadge } from "../components/ui";

const DEMO = [
  ["asha", "Two Sum", "Python", "ACCEPTED", "41 ms"],
  ["leo_k", "Valid Parentheses", "Java", "ACCEPTED", "96 ms"],
  ["mina", "Trapping Rain Water", "C++", "TIME_LIMIT_EXCEEDED", "2000 ms"],
  ["dev99", "Maximum Subarray", "JavaScript", "WRONG_ANSWER", "58 ms"],
  ["rohan", "Fibonacci Number", "Python", "ACCEPTED", "37 ms"],
  ["zed", "Longest Common Subsequence", "Java", "RUNTIME_ERROR", "74 ms"],
  ["priya", "FizzBuzz", "C++", "ACCEPTED", "12 ms"],
];

/** A looping illustration of the judge queue. Example data only. */
function JudgeFeed() {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    let i = 0, alive = true;
    const timers = [];
    const push = () => {
      if (!alive) return;
      const d = DEMO[i++ % DEMO.length];
      const id = Date.now() + i;
      setRows((r) => [{ id, d, state: "JUDGING" }, ...r].slice(0, 6));
      timers.push(setTimeout(() => alive && setRows((r) => r.map((x) => (x.id === id ? { ...x, state: d[3] } : x))), 1100));
    };
    push();
    const t = setInterval(push, 2200);
    return () => { alive = false; clearInterval(t); timers.forEach(clearTimeout); };
  }, []);

  return (
    <div className="panel overflow-hidden shadow-xl shadow-brand-500/5">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-ink-600">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <span className="h-2 w-2 animate-pulseDot rounded-full bg-mint-500" /> Judge queue
        </div>
        <span className="text-xs text-slate-500">example data</span>
      </div>
      <ul className="min-h-[352px] divide-y divide-slate-100 dark:divide-ink-700">
        {rows.map(({ id, d, state }) => (
          <li key={id} className="flex animate-slideIn items-center gap-3 px-4 py-3">
            <Avatar name={d[0]} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{d[1]}</p>
              <p className="text-xs text-slate-500">{d[0]} &middot; {d[2]}</p>
            </div>
            <div className="text-right">
              <VerdictBadge value={state} />
              <p className="mt-1 font-mono text-[11px] text-slate-500">{state === "JUDGING" ? "..." : d[4]}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const STEPS = [
  ["Queued", "Your code is saved and placed in the judge queue."],
  ["Compiled", "Java and C++ are compiled once, in an isolated container."],
  ["Run", "Every test case runs in a fresh container with strict time and memory limits."],
  ["Verdict", "Output is compared and you see Accepted, Wrong Answer, TLE and more."],
];

const FEATURES = [
  [Terminal, "Run before you submit", "Try custom input in the editor and see stdout and stderr instantly."],
  [Trophy, "Live contests", "ICPC-style scoring: solved count first, then time penalty. The board refreshes while you play."],
  [Flame, "Streaks and heatmap", "Your profile tracks daily activity, solved problems by difficulty, and your global rank."],
  [Layers, "Four languages", "Python, Java, C++ and JavaScript with a real Monaco editor, the same one VS Code uses."],
];

export default function Landing() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [daily, setDaily] = useState(null);
  const [top, setTop] = useState([]);

  useEffect(() => {
    api.get("/stats").then((r) => setStats(r.data)).catch(() => {});
    api.get("/problems/daily").then((r) => setDaily(r.data)).catch(() => {});
    api.get("/leaderboard", { params: { size: 5 } }).then((r) => setTop(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 lg:grid-cols-[1.1fr_.9fr] lg:pt-24">
        <div className="animate-rise">
          <h1 className="text-5xl font-extrabold leading-[1.05] sm:text-6xl">
            Write it. Submit it.<br />Watch it get judged.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-400">
            Practice algorithm problems, run your code in a locked-down sandbox and compete in timed contests. Every verdict comes from real test cases.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/problems" className="btn-primary !px-5 !py-2.5 text-base">Start solving <ArrowRight size={18} /></Link>
            {!user && <Link to="/register" className="btn-ghost !px-5 !py-2.5 text-base">Create free account</Link>}
            {user && <Link to="/contests" className="btn-ghost !px-5 !py-2.5 text-base">Browse contests</Link>}
          </div>
          {stats && (
            <p className="mt-8 text-sm text-slate-500">
              {stats.problems} problems &middot; {stats.users} coders &middot; {stats.submissions} submissions judged
            </p>
          )}
        </div>
        <JudgeFeed />
      </section>

      <section className="border-y border-slate-200 bg-white py-16 dark:border-ink-600 dark:bg-ink-800/50">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">Your code runs in a locked box</h2>
            <p className="mt-3 max-w-lg leading-7 text-slate-600 dark:text-slate-400">
              Nobody's program can touch the server. Each test case gets a throw-away Docker container that is deleted the moment it finishes.
            </p>
            <pre className="mt-6 overflow-x-auto rounded-xl bg-ink-900 p-5 font-mono text-[13px] leading-6 text-slate-300">
{`docker run --rm
  `}<span className="text-signal-400">--network none</span>{`
  `}<span className="text-signal-400">--memory 256m</span>{`
  `}<span className="text-signal-400">--cpus 1</span>{`
  `}<span className="text-signal-400">--pids-limit 256</span>{`
  `}<span className="text-signal-400">--cap-drop ALL</span>{`
  -v code:/sandbox:ro  python:3.12-alpine`}
            </pre>
          </div>
          <ol className="space-y-5">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-500/40 font-mono text-sm font-bold text-brand-500">{i + 1}</span>
                <div><p className="font-display font-bold text-slate-900 dark:text-white">{t}</p><p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{d}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {FEATURES.map(([Icon, t, d]) => (
            <div key={t} className="flex gap-4">
              <Icon className="mt-1 shrink-0 text-brand-500" size={22} />
              <div><h3 className="text-lg font-bold">{t}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-8 lg:grid-cols-2">
        <div className="panel p-6">
          <h3 className="text-lg font-bold">Today's problem</h3>
          {daily ? (
            <Link to={`/problems/${daily.slug}`} className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 p-4 transition hover:border-brand-500 dark:border-ink-600">
              <div><p className="font-display text-lg font-bold text-slate-900 dark:text-white">{daily.title}</p>
                <div className="mt-1.5 flex items-center gap-2"><DifficultyBadge value={daily.difficulty} /><span className="text-xs text-slate-500">{daily.acceptance}% accepted</span></div></div>
              <Play className="text-brand-500" size={22} />
            </Link>
          ) : <p className="mt-4 text-sm text-slate-500">Start the backend to see the daily problem.</p>}
        </div>
        <div className="panel p-6">
          <div className="flex items-center justify-between"><h3 className="text-lg font-bold">Top solvers</h3><Link to="/leaderboard" className="link text-sm">Full leaderboard</Link></div>
          {top.length === 0 ? <p className="mt-4 text-sm text-slate-500">Nobody has solved a problem yet. Be the first.</p> : (
            <ul className="mt-3 divide-y divide-slate-100 dark:divide-ink-700">
              {top.map((r) => (
                <li key={r.username} className="flex items-center gap-3 py-2.5">
                  <span className="w-5 font-mono text-sm text-slate-400">{r.rank}</span>
                  <Avatar name={r.username} size={28} />
                  <Link to={`/u/${r.username}`} className="flex-1 font-semibold hover:text-brand-500">{r.username}</Link>
                  <span className="font-mono text-sm">{r.solved} solved</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
