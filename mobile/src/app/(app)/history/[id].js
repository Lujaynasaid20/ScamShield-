import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { api } from "@/api/client";
import { ResultForItem } from "@/components/results";
import { Button, ErrorState, Loading, Screen } from "@/components/ui";
import { KIND } from "@/lib/format";
import { useApi } from "@/lib/useApi";

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const valid = /^\d{1,18}$/.test(String(id));
  const { data, error, loading, refreshing, reload } = useApi(valid ? `/api/history/${id}` : null);
  const [deleting, setDeleting] = useState(false);
  const item = data?.item;

  const remove = () => {
    Alert.alert("Delete this check?", "It will be removed from your history on the app and the website. This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        setDeleting(true);
        try {
          await api(`/api/history/${id}`, { method: "DELETE" });
          router.back();
        } catch (requestError) {
          setDeleting(false);
          Alert.alert("Couldn't delete", requestError.message);
        }
      } }
    ]);
  };

  return (
    <Screen refreshing={refreshing} onRefresh={valid ? reload : undefined}>
      <Stack.Screen options={{ title: item ? `${KIND[item.kind]?.label || "Check"} result` : "Result" }} />
      {!valid && <ErrorState message="This result link isn't valid." />}
      {!!loading && <Loading />}
      {!!(error && !item) && <ErrorState message={error} onRetry={reload} />}
      {!!item && (
        <>
          <ResultForItem item={item} />
          <Button title="Delete from history" icon="trash-outline" variant="danger" busy={deleting} onPress={remove} />
        </>
      )}
    </Screen>
  );
}
