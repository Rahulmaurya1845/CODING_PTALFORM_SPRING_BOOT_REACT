import { useMemo } from "react";

const shade = (n) =>
  n === 0 ? "bg-slate-200/70 dark:bg-ink-700"
  : n === 1 ? "bg-brand-200 dark:bg-brand-700/60"
  : n <= 3 ? "bg-brand-400 dark:bg-brand-600"
  : "bg-brand-600 dark:bg-brand-400";

/** GitHub-style submission calendar for the last 53 weeks. */
export default function Heatmap({ data = {} }) {
  const { weeks, total } = useMemo(() => {
    const end = new Date();
    const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - 364));
    start.setUTCDate(start.getUTCDate() - start.getUTCDay()); // back to Sunday
    const cols = [];
    let total = 0;
    for (let w = 0; w < 53; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(start.getTime() + (w * 7 + d) * 86400000);
        const key = day.toISOString().slice(0, 10);
        const future = day.getTime() > end.getTime();
        const n = data[key] || 0;
        total += n;
        col.push({ key, n, future });
      }
      cols.push(col);
    }
    return { weeks: cols, total };
  }, [data]);

  return (
    <div>
      <p className="mb-3 text-sm text-slate-500"><b className="text-slate-900 dark:text-white">{total}</b> submissions in the last year</p>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-[3px]">
          {weeks.map((col, i) => (
            <div key={i} className="flex flex-col gap-[3px]">
              {col.map((c) => (
                <div key={c.key} title={`${c.n} submission${c.n === 1 ? "" : "s"} on ${c.key}`}
                     className={`h-[11px] w-[11px] rounded-[3px] ${c.future ? "opacity-0" : shade(c.n)}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5 text-xs text-slate-500">
        Less {[0, 1, 2, 4].map((n) => <span key={n} className={`h-[11px] w-[11px] rounded-[3px] ${shade(n)}`} />)} More
      </div>
    </div>
  );
}
