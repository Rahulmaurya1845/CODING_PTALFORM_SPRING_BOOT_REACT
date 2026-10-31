import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { PageLoader } from "./components/ui";
import Landing from "./pages/Landing";
import { Login, Register } from "./pages/Auth";
import Problems from "./pages/Problems";
import ProblemDetail from "./pages/ProblemDetail";
import Submissions from "./pages/Submissions";
import { ContestList, ContestDetail } from "./pages/Contests";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProblemForm from "./pages/admin/ProblemForm";
import ContestForm from "./pages/admin/ContestForm";

function Layout() {
  const { pathname } = useLocation();
  const workspace = pathname.startsWith("/problems/"); // full-height editor page: no footer
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      <Navbar />
      <main className={workspace ? "" : "min-h-[calc(100vh-4rem)]"}><Outlet /></main>
      {!workspace && <Footer />}
    </>
  );
}

function Guard({ admin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: pathname }} replace />;
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

const NotFound = () => (
  <div className="py-32 text-center">
    <p className="font-display text-7xl font-extrabold text-brand-500">404</p>
    <p className="mt-2 text-slate-500">This page does not exist.</p>
  </div>
);

export default function App() {
  const { dark } = useTheme();
  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { background: dark ? "#121a33" : "#fff", color: dark ? "#e2e8f0" : "#0f172a", border: `1px solid ${dark ? "#232e52" : "#e2e8f0"}` } }} />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/problems/:slug" element={<ProblemDetail />} />
          <Route path="/contests" element={<ContestList />} />
          <Route path="/contests/:id" element={<ContestDetail />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/u/:username" element={<Profile />} />
          <Route element={<Guard />}>
            <Route path="/submissions" element={<Submissions />} />
          </Route>
          <Route element={<Guard admin />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/problems/new" element={<ProblemForm />} />
            <Route path="/admin/problems/:id" element={<ProblemForm />} />
            <Route path="/admin/contests/new" element={<ContestForm />} />
            <Route path="/admin/contests/:id" element={<ContestForm />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
