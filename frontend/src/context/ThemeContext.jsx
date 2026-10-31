import { createContext, useContext, useEffect, useState } from "react";

const ThemeCtx = createContext({ dark: true, toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem("cj_theme") !== "light");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("cj_theme", dark ? "dark" : "light");
  }, [dark]);
  return <ThemeCtx.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>{children}</ThemeCtx.Provider>;
}
