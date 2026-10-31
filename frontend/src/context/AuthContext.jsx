import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem("cj_token"));

  useEffect(() => {
    if (!localStorage.getItem("cj_token")) return;
    api.get("/auth/me").then((r) => setUser(r.data)).catch(() => localStorage.removeItem("cj_token")).finally(() => setLoading(false));
  }, []);

  const finish = (data) => {
    localStorage.setItem("cj_token", data.token);
    setUser(data.user);
    return data.user;
  };
  const login = (email, password) => api.post("/auth/login", { email, password }).then((r) => finish(r.data));
  const register = (username, email, password) => api.post("/auth/register", { username, email, password }).then((r) => finish(r.data));
  const logout = () => { localStorage.removeItem("cj_token"); setUser(null); };

  return (
    <AuthCtx.Provider value={{ user, loading, isAdmin: user?.role === "ADMIN", login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
