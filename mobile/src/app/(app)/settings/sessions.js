import { Alert } from "react-native";
import { api } from "@/api/client";
import { Badge, Body, Button, Card, ErrorState, Loading, Row, Screen } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import { useApi } from "@/lib/useApi";

export default function SessionsScreen() {
  const { data, error, loading, refreshing, reload } = useApi("/api/settings/sessions");
  const sessions = data?.sessions || [];
  const others = sessions.filter(session => !session.current);

  const confirm = (title, body, action) => Alert.alert(title, body, [
    { text: "Cancel", style: "cancel" },
    { text: "Sign out", style: "destructive", onPress: async () => {
      try { await action(); reload(); } catch (requestError) { Alert.alert("Couldn't sign out", requestError.message); }
    } }
  ]);

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Body muted>Places where your account is signed in, on the app and the website. Sign out any device you don't recognise, then change your password.</Body>
      {!!loading && <Loading />}
      {!!(error && !data) && <ErrorState message={error} onRetry={reload} />}
      {!!data && (
        <Card>
          {sessions.map(session => (
            <Row key={session.id} icon={session.device.includes("app") ? "phone-portrait-outline" : "desktop-outline"}
              title={session.device}
              subtitle={`Signed in ${timeAgo(session.created_at)} · active ${timeAgo(session.last_seen_at)}`}
              right={session.current
                ? <Badge tone="safe" label="This phone" />
                : <Button small variant="danger" title="Sign out" accessibilityLabel={`Sign out ${session.device}`}
                    onPress={() => confirm("Sign out this device?", `${session.device} will need to log in again.`, () => api(`/api/settings/sessions/${session.id}`, { method: "DELETE" }))} />} />
          ))}
        </Card>
      )}
      {others.length > 1 && (
        <Button title={`Sign out all ${others.length} other devices`} icon="log-out-outline" variant="danger"
          onPress={() => confirm("Sign out all other devices?", "Only this phone will stay signed in.", () => api("/api/settings/sessions", { method: "DELETE" }))} />
      )}
    </Screen>
  );
}
