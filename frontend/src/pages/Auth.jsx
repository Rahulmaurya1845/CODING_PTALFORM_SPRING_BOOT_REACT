import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { errMsg } from "../api/client";
import { Logo, Spinner } from "../components/ui";

function Shell({ title, subtitle, children, footer }) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md animate-rise">
        <Logo size={40} />
        <h1 className="mt-6 text-3xl font-extrabold">{title}</h1>
        <p className="mt-2 text-slate-500">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-6 text-sm text-slate-500">{footer}</p>
      </div>
      <div className="relative hidden h-[520px] overflow-hidden rounded-3xl bg-ink-800 p-10 lg:block">
        <pre className="font-mono text-[13px] leading-7 text-slate-400">
{`def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return seen[target - x], i
        seen[x] = i`}
        </pre>
        <div className="mt-10 inline-block animate-stamp rounded-md border-4 border-mint-500 px-5 py-2 font-display text-4xl font-extrabold uppercase tracking-wider text-mint-500">
          Accepted
        </div>
        <p className="mt-6 font-mono text-sm text-slate-500">5 / 5 test cases &middot; 41 ms</p>
        <p className="absolute bottom-10 left-10 right-10 text-sm leading-6 text-slate-400">
          Practice with real test cases, then take on timed contests with your friends.
        </p>
      </div>
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input className="input pr-10" type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} required />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Show password">
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const from = useLocation().state?.from || "/problems";
  const [f, setF] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { const u = await login(f.email, f.password); toast.success(`Welcome back, ${u.username}`); nav(from, { replace: true }); }
    catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <Shell title="Log in" subtitle="Pick up where you left off." footer={<>New here? <Link className="link" to="/register">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Email or username</label>
          <input className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="username" required /></div>
        <div><label className="label">Password</label>
          <PasswordInput value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy && <Spinner />} Log in</button>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ username: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await register(f.username, f.email, f.password); toast.success("Account created"); nav("/problems", { replace: true }); }
    catch (err) { toast.error(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <Shell title="Create your account" subtitle="Free forever. No card needed." footer={<>Already have an account? <Link className="link" to="/login">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Username</label>
          <input className="input" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} minLength={3} maxLength={30} pattern="[A-Za-z0-9_]+" title="Letters, numbers and underscore" required />
          <p className="mt-1 text-xs text-slate-500">3-30 characters: letters, numbers, underscore.</p></div>
        <div><label className="label">Email</label>
          <input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" required /></div>
        <div><label className="label">Password</label>
          <PasswordInput value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p></div>
        <button className="btn-primary w-full" disabled={busy}>{busy && <Spinner />} Create account</button>
      </form>
    </Shell>
  );
}
