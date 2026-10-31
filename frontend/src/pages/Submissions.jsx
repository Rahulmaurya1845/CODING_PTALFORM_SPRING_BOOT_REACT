import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useFetch } from "../utils/hooks";
import { LANGS, timeAgo } from "../utils/constants";
import { Empty, ErrorBox, Modal, PageLoader, Pager, VerdictBadge } from "../components/ui";

export default function Submissions() {
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(null);
  const { data, loading, error } = useFetch(() => api.get("/submissions/mine", { params: { page, size: 15 } }).then((r) => r.data), [page]);

  const view = async (id) => setOpen((await api.get(`/submissions/${id}`)).data);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">My submissions</h1>
      <p className="mb-6 mt-1 text-slate-500">Everything you have sent to the judge. Click a row to see the code.</p>
      <div className="panel overflow-hidden">
        {loading && !data ? <PageLoader /> : error ? <ErrorBox error={error} /> : data.items.length === 0 ? (
          <Empty title="No submissions yet" hint="Solve your first problem and it will appear here."><Link to="/problems" className="btn-primary btn-sm">Browse problems</Link></Empty>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-ink-600 dark:bg-ink-900/40">
              <tr><th className="th">Problem</th><th className="th">Verdict</th><th className="th hidden sm:table-cell">Language</th>
                <th className="th hidden text-right md:table-cell">Tests</th><th className="th text-right">Runtime</th><th className="th text-right">When</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-ink-700">
              {data.items.map((s) => (
                <tr key={s.id} onClick={() => view(s.id)} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-ink-700/40">
                  <td className="td font-semibold text-slate-900 dark:text-white">{s.problemTitle}</td>
                  <td className="td"><VerdictBadge value={s.verdict} /></td>
                  <td className="td hidden sm:table-cell">{LANGS[s.language]?.label}</td>
                  <td className="td hidden text-right font-mono md:table-cell">{s.passed}/{s.total}</td>
                  <td className="td text-right font-mono">{s.runtimeMs != null ? `${s.runtimeMs} ms` : "-"}</td>
                  <td className="td text-right text-slate-500">{timeAgo(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data && <Pager page={data.page} pages={data.pages} onChange={setPage} />}
      </div>

      {open && (
        <Modal wide title={`${open.problemTitle} - ${LANGS[open.language]?.label}`} onClose={() => setOpen(null)}>
          <div className="mb-3 flex items-center gap-3"><VerdictBadge value={open.verdict} />
            <span className="font-mono text-sm text-slate-500">{open.passed}/{open.total} tests</span>
            <Link className="link ml-auto text-sm" to={`/problems/${open.problemSlug}`}>Open problem</Link></div>
          {open.message && <pre className="mb-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-mono text-xs dark:bg-ink-900">{open.message}</pre>}
          <pre className="max-h-[50vh] overflow-auto rounded-lg bg-slate-50 p-4 font-mono text-[13px] dark:bg-ink-900">{open.code}</pre>
        </Modal>
      )}
    </div>
  );
}
