import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { api } from "@/api/client";
import { Body, Button, Card, Field, Notice, Screen } from "@/components/ui";

export default function PasswordScreen() {
  const router = useRouter();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = key => value => setForm(current => ({ ...current, [key]: value }));

  const save = async () => {
    setError("");
    if (!form.current) { setError("Enter your current password."); return; }
    if (form.next.length < 8) { setError("Your new password must be at least 8 characters."); return; }
    if (form.next !== form.confirm) { setError("The new passwords don't match."); return; }
    setBusy(true);
    try {
      const result = await api("/api/settings/password", { method: "POST", body: { current_password: form.current, new_password: form.next } });
      const others = result.other_sessions_revoked;
      Alert.alert("Password changed", others ? `${others} other device${others === 1 ? " was" : "s were"} signed out. This phone stays signed in.` : "This phone stays signed in.");
      router.back();
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Field label="Current password" value={form.current} onChangeText={set("current")} secureTextEntry autoComplete="current-password" textContentType="password" />
        <Field label="New password" hint="At least 8 characters." value={form.next} onChangeText={set("next")} secureTextEntry autoComplete="new-password" textContentType="newPassword" maxLength={200} />
        <Field label="Confirm new password" value={form.confirm} onChangeText={set("confirm")} secureTextEntry autoComplete="new-password" textContentType="newPassword" maxLength={200} />
        {!!error && <Notice tone="danger" icon="alert-circle">{error}</Notice>}
        <Button title="Change password" icon="key-outline" busy={busy} onPress={save} />
      </Card>
      <Body small muted>Changing your password signs out every other device, including the website, in case someone else knows the old one.</Body>
    </Screen>
  );
}
