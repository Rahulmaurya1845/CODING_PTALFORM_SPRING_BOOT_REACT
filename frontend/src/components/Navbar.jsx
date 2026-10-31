import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, Moon, Sun, X, LogOut, User, ListChecks, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Avatar, Logo } from "./ui";

const links = [
  ["/problems", "Problems"],
  ["/contests", "Contests"],
  ["/leaderboard", "Leaderboard"],
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const nav = useNavigate();

  const item = ({ isActive }) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${isActive ? "bg-brand-500/10 text-brand-600 dark:text-brand-400" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-ink-600 dark:bg-ink-900/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
        <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-extrabold text-slate-900 dark:text-white">
          <Logo /> CodeJudge
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(([to, label]) => <NavLink key={to} to={to} className={item}>{label}</NavLink>)}
          {isAdmin && <NavLink to="/admin" className={item}>Admin</NavLink>}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={toggle} className="btn-ghost btn-sm !px-2.5" aria-label="Toggle theme">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {user ? (
            <div className="relative">
              <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-slate-100 dark:hover:bg-ink-700">
                <Avatar name={user.username} size={30} />
                <span className="hidden text-sm font-semibold sm:block">{user.username}</span>
              </button>
              {menu && (
                <div className="panel absolute right-0 mt-2 w-52 p-1.5 shadow-xl" onMouseLeave={() => setMenu(false)}>
                  {[
                    [User, "My profile", `/u/${user.username}`],
                    [ListChecks, "My submissions", "/submissions"],
                    ...(isAdmin ? [[ShieldCheck, "Admin panel", "/admin"]] : []),
                  ].map(([Icon, label, to]) => (
                    <button key={to} onClick={() => { setMenu(false); nav(to); }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-ink-700">
                      <Icon size={15} /> {label}
                    </button>
                  ))}
                  <button onClick={() => { setMenu(false); logout(); nav("/"); }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-coral-600 hover:bg-coral-500/10">
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-ghost btn-sm hidden sm:inline-flex">Log in</Link>
              <Link to="/register" className="btn-primary btn-sm">Sign up</Link>
            </>
          )}
          <button className="btn-ghost btn-sm !px-2.5 md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-slate-200 p-3 dark:border-ink-600 md:hidden" onClick={() => setOpen(false)}>
          {links.map(([to, label]) => <NavLink key={to} to={to} className={item}>{label}</NavLink>)}
          {isAdmin && <NavLink to="/admin" className={item}>Admin</NavLink>}
        </nav>
      )}
    </header>
  );
}
