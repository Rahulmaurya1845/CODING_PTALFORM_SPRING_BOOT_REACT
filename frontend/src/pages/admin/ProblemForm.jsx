import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";
import api, { errMsg } from "../../api/client";
import { Md, PageLoader, Spinner } from "../../components/ui";

const EMPTY = {
  title: "", description: "## Input\n\n## Output\n\n## Constraints\n\n## Example\n```\nInput:\n\nOutput:\n```\n",
  difficulty: "EASY", tags: "", timeLimitMs: 2000, memoryLimitMb: 256, published: true,
  testCases: [{ input: "", expectedOutput: "", sample: true }],
};

export default function ProblemForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [f, setF] = useState(EMPTY);
  const [loading, setLoading] = useState(!!id);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/admin/problems/${id}`).then((r) => setF({ ...r.data, tags: r.data.tags.join(", ") })).finally(() => setLoading(false));
  }, [id]);

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const setTc = (i, k, v) => setF((x) => ({ ...x, testCases: x.testCases.map((t, j) => (j === i ? { ...t, [k]: v } : t)) }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const body = { ...f, tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean), timeLimitMs: Number(f.timeLimitMs), memoryLimitMb: Number(f.memoryLimitMb),
      testCases: f.testCases.map(({ input, expectedOutput, sample }) => ({ input, expectedOutput, sample })) };
    try {
      id ? await api.put(`/admin/problems/${id}`, body) : await api.post("/admin/problems", body);
      toast.success("Problem saved");
      nav("/admin");
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  if (loading) return <PageLoader />;
  return (
    <form onSubmit={save} className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">{id ? "Edit problem" : "New problem"}</h1>
        <Link to="/admin" className="link text-sm">Back to admin</Link>
      </div>

      <div className="panel space-y-4 p-5">
        <div><label className="label">Title</label><input className="input" value={f.title} onChange={(e) => set("title", e.target.value)} required maxLength={150} /></div>
        <div className="grid gap-4 sm:grid-cols-4">
          <div><label className="label">Difficulty</label>
            <select className="input" value={f.difficulty} onChange={(e) => set("difficulty", e.target.value)}><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option></select></div>
          <div><label className="label">Time limit (ms)</label><input className="input" type="number" min={500} max={15000} value={f.timeLimitMs} onChange={(e) => set("timeLimitMs", e.target.value)} /></div>
          <div><label className="label">Memory (MB)</label><input className="input" type="number" min={64} max={1024} value={f.memoryLimitMb} onChange={(e) => set("memoryLimitMb", e.target.value)} /></div>
          <div><label className="label">Visibility</label>
            <select className="input" value={f.published ? "1" : "0"} onChange={(e) => set("published", e.target.value === "1")}><option value="1">Published</option><option value="0">Draft</option></select></div>
        </div>
        <div><label className="label">Tags (comma separated)</label><input className="input" value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="array, dp, graph" /></div>
        <div>
          <div className="mb-1.5 flex items-center justify-between"><label className="label !mb-0">Statement (Markdown)</label>
            <button type="button" className="link text-xs" onClick={() => setPreview((p) => !p)}>{preview ? "Edit" : "Preview"}</button></div>
          {preview ? <div className="rounded-lg border border-slate-200 p-4 dark:border-ink-600"><Md>{f.description}</Md></div>
            : <textarea className="input min-h-[260px] font-mono text-[13px]" value={f.description} onChange={(e) => set("description", e.target.value)} required />}
        </div>
      </div>

      <div className="panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <div><h2 className="text-base font-bold">Test cases</h2><p className="text-xs text-slate-500">Sample cases are shown to users. Hidden cases decide the verdict.</p></div>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setF((x) => ({ ...x, testCases: [...x.testCases, { input: "", expectedOutput: "", sample: false }] }))}><Plus size={14} /> Add</button>
        </div>
        <div className="space-y-4">
          {f.testCases.map((t, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3 dark:border-ink-600">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Case {i + 1}</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={t.sample} onChange={(e) => setTc(i, "sample", e.target.checked)} /> Sample</label>
                  <button type="button" className="text-coral-600 disabled:opacity-30" disabled={f.testCases.length === 1}
                          onClick={() => setF((x) => ({ ...x, testCases: x.testCases.filter((_, j) => j !== i) }))}><Trash2 size={15} /></button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <textarea className="input min-h-[90px] font-mono text-[13px]" placeholder="Input" value={t.input} onChange={(e) => setTc(i, "input", e.target.value)} />
                <textarea className="input min-h-[90px] font-mono text-[13px]" placeholder="Expected output" value={t.expectedOutput} onChange={(e) => setTc(i, "expectedOutput", e.target.value)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="btn-primary" disabled={busy}>{busy && <Spinner />} Save problem</button>
    </form>
  );
}
