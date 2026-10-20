import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { api } from "@/api/client";

// Loads a GET endpoint when the screen gains focus. reload() keeps old data visible (pull-to-refresh).
export function useApi(path, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: "", loading: Boolean(path && enabled), refreshing: false });
  const requestId = useRef(0);

  const load = useCallback(async ({ refreshing = false } = {}) => {
    if (!path || !enabled) return;
    const id = ++requestId.current;
    setState(current => ({ ...current, error: "", loading: !current.data && !refreshing, refreshing }));
    try {
      const data = await api(path);
      if (id === requestId.current) setState({ data, error: "", loading: false, refreshing: false });
    } catch (error) {
      if (id === requestId.current) setState(current => ({ ...current, error: error.message, loading: false, refreshing: false }));
    }
  }, [path, enabled]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const reload = useCallback(() => load({ refreshing: true }), [load]);
  return { ...state, reload, setData: data => setState(current => ({ ...current, data })) };
}
