import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import PagedList from "@/components/PagedList";
import { Body, Field, Row, Segmented, VerdictBadge } from "@/components/ui";
import { KIND, timeAgo } from "@/lib/format";
import { usePaged } from "@/lib/usePaged";

const FILTERS = [["", "All"], ["message", "Messages"], ["url", "Links"], ["sender", "Senders"]];

export default function HistoryScreen() {
  const router = useRouter();
  const [kind, setKind] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => { const timer = setTimeout(() => setQuery(search.trim()), 350); return () => clearTimeout(timer); }, [search]);
  const list = usePaged("/api/history", { kind, q: query });

  return (
    <PagedList
      list={list}
      loadingLabel="Loading your history…"
      header={<>
        <Field placeholder="Search your history" value={search} onChangeText={setSearch} returnKeyType="search" autoCorrect={false} accessibilityLabel="Search your history" />
        <Segmented options={FILTERS} value={kind} onChange={setKind} />
        {!list.loading && !list.error && list.total > 0 && <Body small muted>{list.total} saved check{list.total === 1 ? "" : "s"}. Only you can see them.</Body>}
      </>}
      renderItem={item => (
        <Row icon={KIND[item.kind]?.icon} title={item.input} subtitle={`${KIND[item.kind]?.label} · ${timeAgo(item.created_at)}`}
          right={<VerdictBadge verdict={item.verdict} kind={item.kind} />} onPress={() => router.push({ pathname: "/history/[id]", params: { id: item.id } })} />
      )}
      empty={query || kind
        ? { icon: "time-outline", title: "No matching checks", body: "Try a different search or filter." }
        : { icon: "time-outline", title: "No history yet", body: "Messages, links and senders you check are saved here." }}
    />
  );
}
