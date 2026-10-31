import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import api, { errMsg } from "../../api/client";
import { useFetch } from "../../utils/hooks";
import { VERDICT, fmtDateTime } from "../../utils/constants";
import { DifficultyBadge, ErrorBox, PageLoader, Spinner, Stat } from "../../components/ui";

/** Imports real Codeforces problems (with official tests) from the free open-r1/codeforces dataset. */
function ImportPanel({ onDone }) {
  const [f, setF] = useState({ count: 50, minRating: 800, maxRating: 1600 });
  const [st, setSt] = useState(null);

  useEffect(() => { api.get("/admin/import/status").then((r) => setSt(r.data)).catch(() => {}); }, []);
  useEffect(() => {
    if (!st?.running) return;
    const t = setInterval(async () => {
      try {
        const r = await api.get("/admin/import/status");
        setSt(r.data);
        if (!r.data.running) onDone();
      } catch { /* keep polling */ }
    }, 2000);
    return () => clearInterval(t);
  }, [st?.running]); // eslint-disable-line

  const start = async () => {
    try { setSt((await api.post("/admin/import", null, { params: f })).data); toast.success("Import started"); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const num = (k) => (e) => setF({ ...f, [k]: Number(e.target.value) });

  return (
    <div className="panel mt-6 p-5">
      <h2 className="flex items-center gap-2 text-base font-bold"><Download size={16} className="text-brand-500" /> Import problems from Codeforces</h2>
      <p className="mt-1 text-sm text-slate-500">
        Pulls real problems with their official test cases from the free open-r1/codeforces dataset (CC BY 4.0).
        Only problems this judge can grade exactly are kept. It needs internet and can take a few minutes.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div><label className="label">How many</label><input className="input !w-28" type="number" min={1} max={500} value={f.count} onChange={num("count")} /></div>
        <div><label className="label">Min rating</label><input className="input !w-28" type="number" step={100} min={800} max={3500} value={f.minRating} onChange={num("minRating")} /></div>
        <div><label className="label">Max rating</label><input className="input !w-28" type="number" step={100} min={800} max={3500} value={f.maxRating} onChange={num("maxRating")} /></div>
        <button className="btn-primary" onClick={start} disabled={st?.running}>{st?.running ? <Spinner /> : <Download size={15} />} {st?.running ? "Importing..." : "Start import"}</button>
      </div>
      {st && st.message !== "Idle" && (
        <p className={`mt-3 text-sm ${st.message.startsWith("Import failed") ? "text-coral-600" : "text-slate-600 dark:text-slate-300"}`}>{st.message}</p>
      )}
      <p className="mt-2 text-xs text-slate-500">Rating guide: 800-1100 Easy, 1200-1700 Medium, 1800+ Hard.</p>
    </div>
  );
}

export default function AdminDashboard() {
  const stats = useFetch(() => api.get("/admin/stats").then((r) => r.data), []);
  const probs = useFetch(() => api.get("/admin/problems").then((r) => r.data), []);
  const contests = useFetch(() => api.get("/contests").then((r) => r.data), []);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(50);

  if (stats.loading || probs.loading) return <PageLoader />;
  if (stats.error) return <ErrorBox error={stats.error} />;
  const s = stats.data;
  const maxDay = Math.max(1, ...Object.values(s.last7Days));
  const totalV = Math.max(1, Object.values(s.verdicts).reduce((a, b) => a + b, 0));

  const shown = (probs.data || []).filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));

  const del = async (kind, id, name, reload) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try { await api.delete(`/admin/${kind}/${id}`); toast.success("Deleted"); reload(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">Admin panel</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Users" value={s.users} /><Stat label="Problems" value={s.problems} />
        <Stat label="Submissions" value={s.submissions} /><Stat label="Contests" value={s.contests} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="mb-4 text-base font-bold">Submissions, last 7 days</h2>
          <div className="flex h-40 items-end gap-3">
            {Object.entries(s.last7Days).map(([d, n]) => (
              <div key={d} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="font-mono text-xs text-slate-500">{n}</span>
                <div className="w-full rounded-t bg-brand-500" style={{ height: `${(n / maxDay) * 100}%`, minHeight: 3 }} />
                <span className="text-[11px] text-slate-500">{d.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <h2 className="mb-4 text-base font-bold">Verdicts</h2>
          {Object.keys(s.verdicts).length === 0 ? <p className="text-sm text-slate-500">No submissions yet.</p> : (
            <div className="space-y-2.5">
              {Object.entries(s.verdicts).sort((a, b) => b[1] - a[1]).map(([v, n]) => (
                <div key={v} className="flex items-center gap-3 text-sm">
                  <span className="w-44 truncate">{VERDICT[v]?.label || v}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-ink-700"><div className={`h-full rounded-full ${v === "ACCEPTED" ? "bg-mint-500" : "bg-coral-500"}`} style={{ width: `${(n / totalV) * 100}%` }} /></div>
                  <span className="w-10 text-right font-mono text-slate-500">{n}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ImportPanel onDone={() => { probs.reload(); stats.reload(); }} />

      <div className="panel mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 dark:border-ink-600">
          <h2 className="text-base font-bold">Problems ({probs.data.length})</h2>
          <input className="input !w-56" placeholder="Search problems" value={q} onChange={(e) => { setQ(e.target.value); setLimit(50); }} />
          <Link to="/admin/problems/new" className="btn-primary btn-sm"><Plus size={14} /> New problem</Link>
        </div>
        <table className="w-full">
          <tbody className="divide-y divide-slate-100 dark:divide-ink-700">
            {shown.slice(0, limit).map((p) => (
              <tr key={p.id}>
                <td className="td font-semibold text-slate-900 dark:text-white">{p.title} {!p.published && <span className="chip ml-2 bg-slate-500/15 text-slate-500">Draft</span>}</td>
                <td className="td"><DifficultyBadge value={p.difficulty} /></td>
                <td className="td hidden text-slate-500 sm:table-cell">{p.testCases} tests</td>
                <td className="td text-right">
                  <Link to={`/admin/problems/${p.id}`} className="btn-ghost btn-sm mr-2"><Pencil size={13} /> Edit</Link>
                  <button className="btn-ghost btn-sm text-coral-600" onClick={() => del("problems", p.id, p.title, probs.reload)}><Trash2 size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length > limit && <button className="link w-full border-t border-slate-100 py-3 text-sm dark:border-ink-700" onClick={() => setLimit(limit + 50)}>Show more ({shown.length - limit} left)</button>}
      </div>

      <div className="panel mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-ink-600">
          <h2 className="text-base font-bold">Contests</h2>
          <Link to="/admin/contests/new" className="btn-primary btn-sm"><Plus size={14} /> New contest</Link>
        </div>
        {contests.data?.length === 0 ? <p className="p-5 text-sm text-slate-500">No contests yet.</p> : (
          <table className="w-full">
            <tbody className="divide-y divide-slate-100 dark:divide-ink-700">
              {contests.data?.map((c) => (
                <tr key={c.id}>
                  <td className="td font-semibold text-slate-900 dark:text-white">{c.title}</td>
                  <td className="td hidden text-slate-500 sm:table-cell">{fmtDateTime(c.startTime)}</td>
                  <td className="td text-slate-500">{c.status}</td>
                  <td className="td text-right">
                    <Link to={`/admin/contests/${c.id}`} className="btn-ghost btn-sm mr-2"><Pencil size={13} /> Edit</Link>
                    <button className="btn-ghost btn-sm text-coral-600" onClick={() => del("contests", c.id, c.title, contests.reload)}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
