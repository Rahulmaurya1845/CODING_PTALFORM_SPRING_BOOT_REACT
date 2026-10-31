export const LANGS = {
  PYTHON: { label: "Python 3", monaco: "python" },
  JAVA: { label: "Java 21", monaco: "java" },
  CPP: { label: "C++ 17", monaco: "cpp" },
  JAVASCRIPT: { label: "JavaScript", monaco: "javascript" },
};

export const STARTER = {
  PYTHON: `import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    # write your solution here\n    print(data)\n\nmain()\n`,
  JAVA: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // write your solution here\n    }\n}\n`,
  CPP: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // write your solution here\n    return 0;\n}\n`,
  JAVASCRIPT: `const input = require("fs").readFileSync(0, "utf8").split("\\n");\n// write your solution here\nconsole.log(input);\n`,
};

export const DIFFICULTY = {
  EASY: { label: "Easy", cls: "bg-mint-500/15 text-mint-600 dark:text-mint-400", bar: "bg-mint-500" },
  MEDIUM: { label: "Medium", cls: "bg-signal-500/15 text-signal-600 dark:text-signal-400", bar: "bg-signal-500" },
  HARD: { label: "Hard", cls: "bg-coral-500/15 text-coral-600 dark:text-coral-400", bar: "bg-coral-500" },
};

export const VERDICT = {
  PENDING: { label: "In queue", short: "Queued", cls: "bg-slate-500/15 text-slate-600 dark:text-slate-300", ring: "border-slate-400" },
  JUDGING: { label: "Judging", short: "Judging", cls: "bg-brand-500/15 text-brand-600 dark:text-brand-400", ring: "border-brand-500" },
  ACCEPTED: { label: "Accepted", short: "AC", cls: "bg-mint-500/15 text-mint-600 dark:text-mint-400", ring: "border-mint-500" },
  WRONG_ANSWER: { label: "Wrong Answer", short: "WA", cls: "bg-coral-500/15 text-coral-600 dark:text-coral-400", ring: "border-coral-500" },
  TIME_LIMIT_EXCEEDED: { label: "Time Limit Exceeded", short: "TLE", cls: "bg-signal-500/15 text-signal-600 dark:text-signal-400", ring: "border-signal-500" },
  MEMORY_LIMIT_EXCEEDED: { label: "Memory Limit Exceeded", short: "MLE", cls: "bg-signal-500/15 text-signal-600 dark:text-signal-400", ring: "border-signal-500" },
  RUNTIME_ERROR: { label: "Runtime Error", short: "RE", cls: "bg-coral-500/15 text-coral-600 dark:text-coral-400", ring: "border-coral-500" },
  COMPILATION_ERROR: { label: "Compilation Error", short: "CE", cls: "bg-slate-500/15 text-slate-600 dark:text-slate-300", ring: "border-slate-400" },
  INTERNAL_ERROR: { label: "Judge Error", short: "ERR", cls: "bg-slate-500/15 text-slate-600 dark:text-slate-300", ring: "border-slate-400" },
};

export const isFinal = (v) => v !== "PENDING" && v !== "JUDGING";

export const timeAgo = (iso) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const units = [["y", 31536000], ["mo", 2592000], ["d", 86400], ["h", 3600], ["m", 60]];
  for (const [u, n] of units) if (s >= n) return `${Math.floor(s / n)}${u} ago`;
  return `${s}s ago`;
};

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

// <input type="datetime-local"> <-> ISO instant
export const toLocalInput = (iso) => {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
export const fromLocalInput = (v) => new Date(v).toISOString();

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
