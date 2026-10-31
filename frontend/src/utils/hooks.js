import { useEffect, useState } from "react";

export function useDebounce(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/** Returns the time left until `target` as {d,h,m,s,done}. */
export function useCountdown(target) {
  const calc = () => Math.max(0, new Date(target).getTime() - Date.now());
  const [ms, setMs] = useState(calc);
  useEffect(() => {
    setMs(calc());
    const t = setInterval(() => setMs(calc()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [target]);
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60, done: ms === 0 };
}

export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn().then((data) => alive && setState({ data, loading: false, error: null }))
        .catch((error) => alive && setState({ data: null, loading: false, error }));
    return () => { alive = false; };
    // eslint-disable-next-line
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}
