import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import toast from "react-hot-toast";
import { Clock, Cpu, Play, RotateCcw, Send, Trophy } from "lucide-react";
import api, { errMsg } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useFetch } from "../utils/hooks";
import { LANGS, STARTER, VERDICT, isFinal, sleep, timeAgo } from "../utils/constants";
import { DifficultyBadge, Empty, ErrorBox, Md, PageLoader, Spinner, VerdictBadge } from "../components/ui";

const Confetti = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {Array.from({ length: 26 }).map((_, i) => (
      <span key={i} className="absolute top-0 h-2 w-1.5 rounded-sm"
            style={{ left: `${(i * 37) % 100}%`, background: ["#4c6fff", "#2fd3a3", "#ffb547", "#ff6b6b"][i % 4],
              animation: `rise 1.6s ease-in ${(i % 7) * 0.08}s both reverse`, transform: `rotate(${i * 25}deg)` }} />
    ))}
  </div>
);

export default function ProblemDetail() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const contestId = params.get("contest");
  const { user } = useAuth();
  const { dark } = useTheme();
  const { data: p, loading, error } = useFetch(() => api.get(`/problems/${slug}`).then((r) => r.data), [slug]);

  const [lang, setLang] = useState(() => localStorage.getItem("cj_lang") || "PYTHON");
  const [code, setCode] = useState("");
  const [tab, setTab] = useState("description");
  const [consoleTab, setConsoleTab] = useState("input");
  const [customInput, setCustomInput] = useState("");
  const [runRes, setRunRes] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(null); // "run" | "submit"
  const [history, setHistory] = useState([]);
  const alive = useRef(true);

  // React StrictMode mounts twice in dev, so the flag must be set back to true on every mount
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  // restore the last draft for this problem + language
  useEffect(() => {
    setCode(localStorage.getItem(`cj_code_${slug}_${lang}`) ?? STARTER[lang]);
  }, [slug, lang]);
  useEffect(() => { if (p?.samples?.length && !customInput) setCustomInput(p.samples[0].input); }, [p]); // eslint-disable-line
  useEffect(() => { setResult(null); setRunRes(null); }, [slug]);

  const onCode = (v) => { setCode(v || ""); localStorage.setItem(`cj_code_${slug}_${lang}`, v || ""); };
  const changeLang = (l) => { setLang(l); localStorage.setItem("cj_lang", l); };
  const reset = () => { if (confirm("Reset your code to the starter template?")) { localStorage.removeItem(`cj_code_${slug}_${lang}`); setCode(STARTER[lang]); } };

  const loadHistory = useCallback(() => {
    if (!user) return;
    api.get("/submissions/mine", { params: { problem: slug, size: 20 } }).then((r) => setHistory(r.data.items)).catch(() => {});
  }, [slug, user]);
  useEffect(() => { if (tab === "submissions") loadHistory(); }, [tab, loadHistory]);

  const needLogin = () => { toast.error("Log in to run or submit code"); };

  const run = async () => {
    if (!user) return needLogin();
    setBusy("run"); setConsoleTab("output"); setRunRes(null);
    try { setRunRes((await api.post("/submissions/run", { language: lang, code, input: customInput })).data); }
    catch (e) { toast.error(errMsg(e)); setConsoleTab("input"); }
    finally { setBusy(null); }
  };

  const submit = async () => {
    if (!user) return needLogin();
    setBusy("submit"); setConsoleTab("result"); setResult(null);
    try {
      let s = (await api.post("/submissions", { problemSlug: slug, language: lang, code, contestId: contestId ? Number(contestId) : null })).data;
      setResult(s);
      for (let i = 0; i < 150 && alive.current && !isFinal(s.verdict); i++) {
        await sleep(900);
        s = (await api.get(`/submissions/${s.id}`)).data;
        setResult(s);
      }
      if (s.verdict === "ACCEPTED") toast.success("Accepted!");
      loadHistory();
    } catch (e) { toast.error(errMsg(e)); setConsoleTab("input"); }
    finally { setBusy(null); }
  };

  const verdict = result && VERDICT[result.verdict];
  const lines = useMemo(() => (code.match(/\n/g) || []).length + 1, [code]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox error={error} />;

  return (
    <div className="grid h-[calc(100vh-4rem)] gap-3 p-3 lg:grid-cols-2">
      {/* ---------------- left: statement ---------------- */}
      <section className="panel flex min-h-0 flex-col overflow-hidden">
        <div className="flex gap-1 border-b border-slate-200 px-3 pt-2 dark:border-ink-600">
          {[["description", "Description"], ["submissions", "My submissions"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
                    className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${tab === k ? "border-brand-500 text-brand-600 dark:text-brand-400" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}>{l}</button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === "description" ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="mr-2 text-2xl font-extrabold">{p.title}</h1>
                <DifficultyBadge value={p.difficulty} />
                {contestId && <Link to={`/contests/${contestId}`} className="chip bg-signal-500/15 text-signal-600 dark:text-signal-400"><Trophy size={12} /> Contest mode</Link>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Clock size={13} /> {p.timeLimitMs} ms</span>
                <span className="flex items-center gap-1"><Cpu size={13} /> {p.memoryLimitMb} MB</span>
                <span>{p.submissions ? `${p.acceptance}% accepted of ${p.submissions}` : "No submissions yet"}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">{p.tags.map((t) => <span key={t} className="chip bg-slate-100 text-slate-500 dark:bg-ink-700">{t}</span>)}</div>
              <Md>{p.description}</Md>
              {p.samples.length > 0 && (
                <div className="mt-6 space-y-4">
                  {p.samples.map((s, i) => (
                    <div key={i}>
                      <p className="mb-1.5 text-sm font-semibold text-slate-900 dark:text-white">Sample {i + 1}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[["Input", s.input], ["Output", s.output]].map(([l, v]) => (
                          <div key={l}><p className="mb-1 text-xs text-slate-500">{l}</p>
                            <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 font-mono text-[13px] dark:bg-ink-900">{v}</pre></div>
                        ))}
                      </div>
                      <button className="link mt-1 text-xs" onClick={() => { setCustomInput(s.input); setConsoleTab("input"); }}>Use as custom input</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : !user ? <Empty title="Log in to see your submissions" /> : history.length === 0 ? (
            <Empty title="No submissions yet" hint="Submit your first solution and it will show up here." />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-ink-700">
              {history.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                  <div><VerdictBadge value={s.verdict} /><p className="mt-1 text-xs text-slate-500">{LANGS[s.language]?.label} &middot; {timeAgo(s.createdAt)}</p></div>
                  <div className="text-right font-mono text-xs text-slate-500">{s.passed}/{s.total} tests<br />{s.runtimeMs != null ? `${s.runtimeMs} ms` : ""}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ---------------- right: editor + console ---------------- */}
      <section className="flex min-h-0 flex-col gap-3">
        <div className="panel flex min-h-[320px] flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 dark:border-ink-600">
            <select value={lang} onChange={(e) => changeLang(e.target.value)} className="input !w-auto !py-1.5">
              {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-slate-400 sm:block">{lines} lines &middot; autosaved</span>
              <button className="btn-ghost btn-sm" onClick={reset}><RotateCcw size={13} /> Reset</button>
              <button className="btn-ghost btn-sm" onClick={run} disabled={!!busy}>{busy === "run" ? <Spinner /> : <Play size={13} />} Run</button>
              <button className="btn-success btn-sm" onClick={submit} disabled={!!busy}>{busy === "submit" ? <Spinner /> : <Send size={13} />} Submit</button>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <Editor height="100%" language={LANGS[lang].monaco} theme={dark ? "vs-dark" : "light"} value={code} onChange={onCode}
                    loading={<Spinner className="text-brand-500" />}
                    options={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 12 }, automaticLayout: true, tabSize: 4 }} />
          </div>
        </div>

        <div className="panel relative flex h-[260px] shrink-0 flex-col overflow-hidden">
          <div className="flex gap-1 border-b border-slate-200 px-3 pt-1.5 dark:border-ink-600">
            {[["input", "Custom input"], ["output", "Run output"], ["result", "Verdict"]].map(([k, l]) => (
              <button key={k} onClick={() => setConsoleTab(k)}
                      className={`-mb-px border-b-2 px-3 py-1.5 text-sm font-semibold ${consoleTab === k ? "border-brand-500 text-brand-600 dark:text-brand-400" : "border-transparent text-slate-500"}`}>{l}</button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {consoleTab === "input" && (
              <textarea className="input h-full resize-none font-mono text-[13px]" value={customInput} onChange={(e) => setCustomInput(e.target.value)} placeholder="Type input for your program, then press Run" spellCheck={false} />
            )}
            {consoleTab === "output" && (
              busy === "run" ? <p className="flex items-center gap-2 text-sm text-slate-500"><Spinner /> Running in sandbox... (the first run downloads the Docker image)</p>
              : !runRes ? <p className="text-sm text-slate-500">Press Run to execute your code with the custom input.</p> : (
                <div className="font-mono text-[13px]">
                  <p className="mb-2 flex items-center gap-2 font-sans text-xs text-slate-500">
                    <VerdictBadge value={runRes.status === "OK" ? "ACCEPTED" : runRes.status} /> {runRes.status === "OK" ? "Finished" : ""} in {runRes.timeMs} ms</p>
                  {runRes.stdout && <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 dark:bg-ink-900">{runRes.stdout}</pre>}
                  {runRes.stderr && <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-coral-500/10 p-3 text-coral-600 dark:text-coral-400">{runRes.stderr}</pre>}
                  {!runRes.stdout && !runRes.stderr && <p className="font-sans text-sm text-slate-500">(no output)</p>}
                </div>
              )
            )}
            {consoleTab === "result" && (
              !result ? <p className="text-sm text-slate-500">Press Submit to judge your solution against all test cases.</p> : (
                <div className="relative">
                  {result.verdict === "ACCEPTED" && <Confetti />}
                  <div className="flex flex-wrap items-center gap-4">
                    <span className={`inline-block rounded-md border-[3px] px-3 py-1 font-display text-xl font-extrabold uppercase ${verdict.ring} ${verdict.cls} ${isFinal(result.verdict) ? "animate-stamp" : ""}`}>
                      {isFinal(result.verdict) ? verdict.label : <span className="flex items-center gap-2"><Spinner /> {verdict.label}</span>}
                    </span>
                    {isFinal(result.verdict) && <span className="font-mono text-sm text-slate-500">{result.passed}/{result.total} tests &middot; {result.runtimeMs ?? 0} ms</span>}
                  </div>
                  {result.message && <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 font-mono text-[13px] dark:bg-ink-900">{result.message}</pre>}
                </div>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
