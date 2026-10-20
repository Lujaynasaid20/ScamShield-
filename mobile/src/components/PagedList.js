import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { colors, space } from "@/theme";
import { EmptyState, ErrorState, Loading } from "./ui";

// FlatList wired to usePaged(): pull to refresh, infinite scroll, and loading/error/empty states.
export default function PagedList({ list, header, renderItem, empty, loadingLabel }) {
  return (
    <FlatList
      style={s.list}
      contentContainerStyle={s.content}
      data={list.items}
      keyExtractor={item => String(item.id)}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.reload} tintColor={colors.blue600} />}
      onEndReached={list.loadMore}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={
        <View style={s.header}>
          {header}
          {!!list.loading && <Loading label={loadingLabel} />}
          {!!(list.error && !list.items.length) && <ErrorState message={list.error} onRetry={list.retry} />}
        </View>
      }
      renderItem={({ item }) => <View style={s.item}>{renderItem(item)}</View>}
      ListEmptyComponent={!list.loading && !list.error ? <EmptyState {...empty} /> : null}
      ListFooterComponent={list.loadingMore ? <ActivityIndicator style={{ margin: space.lg }} color={colors.blue600} /> : null}
    />
  );
}

const s = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg, paddingBottom: space.xl * 2 },
  header: { gap: space.md, marginBottom: space.md },
  item: { backgroundColor: colors.surface, paddingHorizontal: space.md, borderRadius: 12, marginBottom: space.sm, borderWidth: 1, borderColor: colors.line }
});
