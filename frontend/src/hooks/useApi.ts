import { useEffect, useRef, useState } from "react";
import { apiGet } from "../api/client";

interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  isFallback: boolean;
  refresh: () => Promise<void>;
}

export function useApi<T>(path: string): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const requestIdRef = useRef(0);

  async function load() {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const next = await apiGet<T>(path);
      if (requestId !== requestIdRef.current) {
        return;
      }
      setData(next.data);
      setIsFallback(next.isFallback);
    } catch (caught) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      setError(caught instanceof Error ? caught.message : "Unknown error.");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void load();
  }, [path]);

  return { data, error, loading, isFallback, refresh: load };
}
