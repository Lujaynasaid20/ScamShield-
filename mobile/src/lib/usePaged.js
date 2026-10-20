import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { api } from "@/api/client";

// Paged list endpoints ({ items, page, totalPages, total }). Reloads page 1 on focus and when `query` changes.
export function usePaged(path, query = {}, { pageSize = 20 } = {}) {
  const [state, setState] = useState({ items: [], page: 0, totalPages: 1, total: 0, extra: {}, loading: true, refreshing: false, loadingMore: false, error: "" });
  const requestId = useRef(0);
  const queryKey = JSON.stringify(query);

  const load = useCallback(async (page, { refreshing = false } = {}) => {
    const id = ++requestId.current;
    setState(current => ({ ...current, error: "", loading: page === 1 && !refreshing && !current.items.length, refreshing, loadingMore: page > 1 }));
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      for (const [key, value] of Object.entries(JSON.parse(queryKey))) if (value) params.set(key, value);
      const { items, page: current, totalPages, total, ...extra } = await api(`${path}?${params}`);
      if (id !== requestId.current) return;
      setState(previous => ({
        items: page === 1 ? items : [...previous.items, ...items.filter(item => !previous.items.some(existing => existing.id === item.id))],
        page: current, totalPages, total, extra, loading: false, refreshing: false, loadingMore: false, error: ""
      }));
    } catch (error) {
      if (id === requestId.current) setState(previous => ({ ...previous, loading: false, refreshing: false, loadingMore: false, error: error.message }));
    }
  }, [path, queryKey, pageSize]);

  useFocusEffect(useCallback(() => { load(1); }, [load]));
  return {
    ...state,
    reload: () => load(1, { refreshing: true }),
    retry: () => load(1),
    loadMore: () => { if (!state.loadingMore && !state.loading && state.page < state.totalPages) load(state.page + 1); },
    update: fn => setState(current => ({ ...current, items: fn(current.items) }))
  };
}
