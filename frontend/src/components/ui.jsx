import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { ChevronLeft, ChevronRight, Loader2, Inbox } from "lucide-react";
import { DIFFICULTY, VERDICT } from "../utils/constants";

export const Spinner = ({ className = "" }) => <Loader2 className={`animate-spin ${className}`} size={18} />;

export const PageLoader = () => (
  <div className="flex justify-center py-24 text-brand-500"><Spinner className="!h-7 !w-7" /></div>
);

export const Empty = ({ title, hint, children }) => (
  <div className="flex flex-col items-center px-6 py-16 text-center">
    <Inbox className="mb-3 text-slate-400" size={34} />
    <p className="font-display text-lg font-semibold text-slate-800 dark:text-white">{title}</p>
    {hint && <p className="mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
    {children && <div className="mt-4">{children}</div>}
  </div>
);

export const ErrorBox = ({ error }) => (
  <div className="mx-auto my-16 max-w-md rounded-xl border border-coral-500/40 bg-coral-500/10 p-5 text-center text-sm text-coral-600 dark:text-coral-400">
    {error?.response?.data?.message || (error?.code === "ERR_NETWORK" ? "Cannot reach the server. Start the backend on port 8080." : error?.message) || "Something went wrong"}
  </div>
);

export const DifficultyBadge = ({ value }) => {
  const d = DIFFICULTY[value] || DIFFICULTY.EASY;
  return <span className={`chip ${d.cls}`}>{d.label}</span>;
};

export const VerdictBadge = ({ value, short }) => {
  const v = VERDICT[value] || VERDICT.INTERNAL_ERROR;
  return (
    <span className={`chip ${v.cls}`}>
      {value === "JUDGING" && <Spinner className="!h-3 !w-3" />}
      {short ? v.short : v.label}
    </span>
  );
};

export const Md = ({ children }) => (
  <div className="md"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{children || ""}</ReactMarkdown></div>
);

export const Avatar = ({ name, size = 36 }) => {
  const hues = [222, 265, 160, 30, 340, 190];
  const h = hues[(name?.charCodeAt(0) || 0) % hues.length];
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white"
          style={{ width: size, height: size, background: `hsl(${h} 65% 48%)`, fontSize: size * 0.42 }}>
      {(name || "?")[0].toUpperCase()}
    </span>
  );
};

export const Pager = ({ page, pages, onChange }) =>
  pages > 1 && (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm dark:border-ink-600">
      <span className="text-slate-500">Page {page + 1} of {pages}</span>
      <div className="flex gap-2">
        <button className="btn-ghost btn-sm" disabled={page === 0} onClick={() => onChange(page - 1)}><ChevronLeft size={14} /> Prev</button>
        <button className="btn-ghost btn-sm" disabled={page + 1 >= pages} onClick={() => onChange(page + 1)}>Next <ChevronRight size={14} /></button>
      </div>
    </div>
  );

export const Logo = ({ size = 30 }) => (
  <span className="inline-flex items-center justify-center rounded-lg bg-brand-500 text-white" style={{ width: size, height: size }}>
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l-4 5 4 5M23 11l4 5-4 5M18 8l-4 16" />
    </svg>
  </span>
);

export const Stat = ({ label, value, hint }) => (
  <div className="panel p-4">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-1 font-display text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
  </div>
);

export const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/70 p-4 backdrop-blur-sm" onClick={onClose}>
    <div className={`panel mt-12 w-full ${wide ? "max-w-4xl" : "max-w-xl"} p-5 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold">{title}</h3>
        <button className="btn-ghost btn-sm" onClick={onClose}>Close</button>
      </div>
      {children}
    </div>
  </div>
);
