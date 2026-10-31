import { Link } from "react-router-dom";
import { Logo } from "./ui";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 py-8 text-sm text-slate-500 dark:border-ink-600">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <div className="flex items-center gap-2.5"><Logo size={22} /> <span>CodeJudge &copy; {new Date().getFullYear()}</span></div>
        <div className="flex gap-5">
          <Link to="/problems" className="hover:text-brand-500">Problems</Link>
          <Link to="/contests" className="hover:text-brand-500">Contests</Link>
          <Link to="/leaderboard" className="hover:text-brand-500">Leaderboard</Link>
        </div>
      </div>
    </footer>
  );
}
