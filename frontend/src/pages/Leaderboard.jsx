import { Link } from "react-router-dom";
import api from "../api/client";
import { useFetch } from "../utils/hooks";
import { Avatar, Empty, ErrorBox, PageLoader } from "../components/ui";

const medal = ["border-signal-500 bg-signal-500/10", "border-slate-400 bg-slate-400/10", "border-orange-500 bg-orange-500/10"];

export default function Leaderboard() {
  const { data, loading, error } = useFetch(() => api.get("/leaderboard", { params: { size: 100 } }).then((r) => r.data), []);
  if (loading) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Leaderboard</h1>
      <p className="mb-8 mt-1 text-slate-500">Ranked by the number of different problems solved.</p>
      {data.length === 0 ? <div className="panel"><Empty title="Nobody is ranked yet" hint="Get an Accepted verdict to claim the first place." /></div> : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            {data.slice(0, 3).map((r, i) => (
              <Link key={r.username} to={`/u/${r.username}`} className={`rounded-xl border-2 p-5 text-center transition hover:-translate-y-0.5 ${medal[i]}`}>
                <p className="font-mono text-sm font-bold text-slate-500">#{r.rank}</p>
                <div className="my-3 flex justify-center"><Avatar name={r.username} size={52} /></div>
                <p className="font-display text-lg font-bold text-slate-900 dark:text-white">{r.username}</p>
                <p className="text-sm text-slate-500">{r.solved} solved</p>
              </Link>
            ))}
          </div>
          <div className="panel overflow-hidden">
            <table className="w-full">
              <tbody className="divide-y divide-slate-100 dark:divide-ink-700">
                {data.slice(3).map((r) => (
                  <tr key={r.username} className="hover:bg-slate-50 dark:hover:bg-ink-700/40">
                    <td className="td w-14 font-mono text-slate-500">{r.rank}</td>
                    <td className="td"><Link to={`/u/${r.username}`} className="flex items-center gap-3 font-semibold hover:text-brand-500"><Avatar name={r.username} size={28} />{r.username}</Link></td>
                    <td className="td text-right font-mono">{r.solved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
