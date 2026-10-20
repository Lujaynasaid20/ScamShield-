import { useRouter } from "expo-router";
import { useState } from "react";
import { api } from "@/api/client";
import { useSession } from "@/auth/session";
import { Body, Button, Card, Field, Notice, Screen } from "@/components/ui";

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useSession();
  const [form, setForm] = useState({ display_name: profile?.display_name || "", email: profile?.email || "", current_password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const emailChanged = form.email.trim().toLowerCase() !== (profile?.email || "");
  const set = key => value => setForm(current => ({ ...current, [key]: value }));

  const save = async () => {
    setError("");
    if (form.display_name.trim().length < 2) { setError("Enter a name between 2 and 120 characters."); return; }
    if (emailChanged && !form.current_password) { setError("Enter your current password to change your email address."); return; }
    setBusy(true);
    try {
      await api("/api/settings/profile", { method: "PATCH", body: { display_name: form.display_name.trim(), email: form.email.trim(), ...(emailChanged ? { current_password: form.current_password } : {}) } });
      await refreshProfile();
      router.back();
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Field label="Name" value={form.display_name} onChangeText={set("display_name")} maxLength={120} autoComplete="name" />
        <Field label="Email" value={form.email} onChangeText={set("email")} autoCapitalize="none" keyboardType="email-address" autoComplete="email" maxLength={254} />
        {emailChanged && <Field label="Current password" hint="Required to change your sign-in email." value={form.current_password} onChangeText={set("current_password")} secureTextEntry autoComplete="current-password" />}
        {!!error && <Notice tone="danger" icon="alert-circle">{error}</Notice>}
        <Button title="Save changes" icon="checkmark" busy={busy} onPress={save} />
      </Card>
      <Body small muted>Changes apply to the app and the website. If you change your email, you'll get a security notification.</Body>
    </Screen>
  );
}
