import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api, { errMsg } from "../../api/client";
import { fromLocalInput, toLocalInput } from "../../utils/constants";
import { DifficultyBadge, PageLoader, Spinner } from "../../components/ui";

const inHours = (h) => toLocalInput(new Date(Date.now() + h * 3600000).toISOString());

export default function ContestForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [f, setF] = useState({ title: "", description: "", startTime: inHours(1), endTime: inHours(3) });
  const [selected, setSelected] = useState([]);
  const [problems, setProblems] = useState(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/admin/problems").then((r) => setProblems(r.data));
    if (id) {
      Promise.all([api.get("/contests"), api.get(`/admin/contests/${id}/problem-ids`)]).then(([c, ids]) => {
        const x = c.data.find((k) => String(k.id) === id);
        if (x) setF({ title: x.title, description: x.description || "", startTime: toLocalInput(x.startTime), endTime: toLocalInput(x.endTime) });
        setSelected(ids.data);
      });
    }
  }, [id]);

  const toggle = (pid) => setSelected((s) => (s.includes(pid) ? s.filter((x) => x !== pid) : [...s, pid]));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const body = { title: f.title, description: f.description, startTime: fromLocalInput(f.startTime), endTime: fromLocalInput(f.endTime), problemIds: selected };
    try {
      id ? await api.put(`/admin/contests/${id}`, body) : await api.post("/admin/contests", body);
      toast.success("Contest saved");
      nav("/admin");
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };

  if (!problems) return <PageLoader />;
  return (
    <form onSubmit={save} className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between"><h1 className="text-3xl font-extrabold">{id ? "Edit contest" : "New contest"}</h1><Link to="/admin" className="link text-sm">Back to admin</Link></div>
      <div className="panel space-y-4 p-5">
        <div><label className="label">Title</label><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required /></div>
        <div><label className="label">Description</label><textarea className="input min-h-[80px]" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Starts</label><input type="datetime-local" className="input" value={f.startTime} onChange={(e) => setF({ ...f, startTime: e.target.value })} required /></div>
          <div><label className="label">Ends</label><input type="datetime-local" className="input" value={f.endTime} onChange={(e) => setF({ ...f, endTime: e.target.value })} required /></div>
        </div>
      </div>
      <div className="panel p-5">
        <h2 className="mb-1 text-base font-bold">Problems ({selected.length} selected)</h2>
        <p className="mb-3 text-xs text-slate-500">They are labelled A, B, C... in the order you tick them.</p>
        <input className="input mb-3" placeholder="Search problems" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto dark:divide-ink-700">
          {problems.filter((p) => selected.includes(p.id) || p.title.toLowerCase().includes(q.toLowerCase())).slice(0, 80).map((p) => (
            <li key={p.id}>
              <label className="flex cursor-pointer items-center gap-3 py-2.5">
                <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                <span className="flex-1 font-medium">{p.title}</span>
                {selected.includes(p.id) && <span className="font-mono text-xs text-brand-500">{String.fromCharCode(65 + selected.indexOf(p.id))}</span>}
                <DifficultyBadge value={p.difficulty} />
              </label>
            </li>
          ))}
        </ul>
      </div>
      <button className="btn-primary" disabled={busy}>{busy && <Spinner />} Save contest</button>
    </form>
  );
}
