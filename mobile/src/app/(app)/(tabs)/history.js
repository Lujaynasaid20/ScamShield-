import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { api } from "@/api/client";
import { Body, EmptyState, ErrorState, Field, Loading, Row, Segmented, VerdictBadge } from "@/components/ui";
import { KIND, timeAgo } from "@/lib/format";
import { colors, space } from "@/theme";

const FILTERS = [["", "All"], ["message", "Messages"], ["url", "Links"], ["sender", "Senders"]];
const PAGE_SIZE = 20;

export default function HistoryScreen() {
  const router = useRouter();
  const [kind, setKind] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ items: [], page: 0, totalPages: 1, total: 0, loading: true, refreshing: false, loadingMore: false, error: "" });
  const requestId = useRef(0);

  useEffect(() => { const timer = setTimeout(() => setQuery(search.trim()), 350); return () => clearTimeout(timer); }, [search]);

  const load = useCallback(async (page, { refreshing = false } = {}) => {
    const id = ++requestId.current;
    setState(current => ({ ...current, error: "", loading: page === 1 && !refreshing && !current.items.length, refreshing, loadingMore: page > 1 }));
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (kind) params.set("kind", kind);
      if (query) params.set("q", query);
      const data = await api(`/api/history?${params}`);
      if (id !== requestId.current) return;
      setState(current => ({
        items: page === 1 ? data.items : [...current.items, ...data.items.filter(item => !current.items.some(existing => existing.id === item.id))],
        page: data.page, totalPages: data.totalPages, total: data.total, loading: false, refreshing: false, loadingMore: false, error: ""
      }));
    } catch (error) {
      if (id === requestId.current) setState(current => ({ ...current, loading: false, refreshing: false, loadingMore: false, error: error.message }));
    }
  }, [kind, query]);

  useFocusEffect(useCallback(() => { load(1); }, [load]));
  const loadMore = () => { if (!state.loadingMore && !state.loading && state.page < state.totalPages) load(state.page + 1); };

  return (
    <FlatList
      style={s.list}
      contentContainerStyle={s.content}
      data={state.items}
      keyExtractor={item => String(item.id)}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={() => load(1, { refreshing: true })} tintColor={colors.blue600} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={
        <View style={s.header}>
          <Field placeholder="Search your history" value={search} onChangeText={setSearch} returnKeyType="search" autoCorrect={false} accessibilityLabel="Search your history" />
          <Segmented options={FILTERS} value={kind} onChange={setKind} />
          {!state.loading && !state.error && state.total > 0 && <Body small muted>{state.total} saved check{state.total === 1 ? "" : "s"}. Only you can see them.</Body>}
          {!!state.loading && <Loading label="Loading your history…" />}
          {!!(state.error && !state.items.length) && <ErrorState message={state.error} onRetry={() => load(1)} />}
        </View>
      }
      renderItem={({ item }) => (
        <View style={s.rowWrap}>
          <Row icon={KIND[item.kind]?.icon} title={item.input} subtitle={`${KIND[item.kind]?.label} · ${timeAgo(item.created_at)}`}
            right={<VerdictBadge verdict={item.verdict} kind={item.kind} />} onPress={() => router.push({ pathname: "/history/[id]", params: { id: item.id } })} />
        </View>
      )}
      ListEmptyComponent={!state.loading && !state.error ? (
        <EmptyState icon="time-outline" title={query || kind ? "No matching checks" : "No history yet"} body={query || kind ? "Try a different search or filter." : "Messages, links and senders you check are saved here."} />
      ) : null}
      ListFooterComponent={state.loadingMore ? <ActivityIndicator style={{ margin: space.lg }} color={colors.blue600} /> : null}
    />
  );
}

const s = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingBottom: space.xl * 2 },
  header: { gap: space.md, marginBottom: space.md },
  rowWrap: { backgroundColor: colors.surface, paddingHorizontal: space.md, borderRadius: 12, marginBottom: space.sm, borderWidth: 1, borderColor: colors.line }
});
