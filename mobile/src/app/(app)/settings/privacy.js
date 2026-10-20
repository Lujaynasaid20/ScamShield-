import { useState } from "react";
import { Alert } from "react-native";
import { api } from "@/api/client";
import { useSession } from "@/auth/session";
import { Body, Button, Card, ErrorState, Field, Heading, Loading, Notice, Row, Screen } from "@/components/ui";
import { confirmClearHistory } from "@/lib/actions";
import { formatDate } from "@/lib/format";
import { useApi } from "@/lib/useApi";

export default function PrivacyScreen() {
  const { signOut } = useSession();
  const { data, error, loading, refreshing, reload } = useApi("/api/settings/account");
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Permanent: the server deletes the account with its history, reports, evidence and notifications.
  const deleteAccount = () => {
    setDeleteError("");
    if (confirmText !== "DELETE") { setDeleteError("Type DELETE in capital letters to confirm."); return; }
    if (!password) { setDeleteError("Enter your password."); return; }
    Alert.alert("Delete your account permanently?", "This can't be undone. You'll be signed out on every device.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete account", style: "destructive", onPress: async () => {
        setDeleting(true);
        try {
          await api("/api/settings/account", { method: "DELETE", body: { password, confirm: "DELETE" } });
          await signOut();
        } catch (requestError) {
          setDeleting(false);
          setDeleteError(requestError.message);
        }
      } }
    ]);
  };

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Card>
        <Heading level={2}>Recent security activity</Heading>
        <Body small muted>Sign-ins and changes to your account. Message contents are never logged.</Body>
        {!!loading && <Loading />}
        {!!(error && !data) && <ErrorState message={error} onRetry={reload} />}
        {data?.events.map(event => <Row key={event.id} icon={event.event === "login_failed" ? "warning-outline" : "time-outline"} title={event.label} subtitle={formatDate(event.created_at)} />)}
        {data?.events.length === 0 && <Body muted>No activity yet.</Body>}
      </Card>
      <Card>
        <Heading level={2}>Scam history</Heading>
        <Body small muted>Delete every saved message, link and sender check. Your scam reports are kept.</Body>
        <Button title="Clear all history" icon="trash-outline" variant="outline" onPress={() => confirmClearHistory(() => Alert.alert("History cleared"))} />
      </Card>
      <Card>
        <Heading level={2}>Delete account</Heading>
        <Body small muted>Permanently deletes your account and everything in it: history, reports and evidence, notifications and lesson progress, on the app and the website.</Body>
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
        <Field label="Type DELETE to confirm" value={confirmText} onChangeText={setConfirmText} autoCapitalize="characters" autoCorrect={false} />
        {!!deleteError && <Notice tone="danger" icon="alert-circle">{deleteError}</Notice>}
        <Button title="Delete my account" icon="trash" variant="danger" busy={deleting} onPress={deleteAccount} />
      </Card>
    </Screen>
  );
}
