import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Linking, StyleSheet, Text } from "react-native";
import { api } from "@/api/client";
import { useSession } from "@/auth/session";
import { Badge, Body, Button, Card, Field, Heading, Notice, Screen } from "@/components/ui";
import { colors, radius, space } from "@/theme";

export default function TwoFactorScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useSession();
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const enabled = Boolean(profile?.totp_enabled);

  const run = async (name, action) => {
    setError(""); setBusy(name);
    try { await action(); } catch (requestError) { setError(requestError.message); } finally { setBusy(""); }
  };

  const start = () => run("setup", async () => { setSetup(await api("/api/settings/two-factor", { method: "POST", body: { action: "setup" } })); });

  // A QR code can't be scanned on the same phone, so the app hands the setup link to the authenticator app instead.
  const openAuthenticator = async () => {
    try { await Linking.openURL(setup.uri); }
    catch { Alert.alert("No authenticator app found", "Install an authenticator app (such as Google Authenticator or Microsoft Authenticator), or copy the setup key and add it manually."); }
  };

  const enable = () => run("enable", async () => {
    if (!/^\d{6}$/.test(code.trim())) throw new Error("Enter the 6-digit code from your authenticator app.");
    await api("/api/settings/two-factor", { method: "POST", body: { action: "enable", code: code.trim() } });
    await refreshProfile();
    Alert.alert("Two-factor authentication is on", "You'll need a code from your authenticator app when you log in.");
    router.back();
  });

  const disable = () => run("disable", async () => {
    if (!password || !/^\d{6}$/.test(code.trim())) throw new Error("Enter your password and a current 6-digit code.");
    await api("/api/settings/two-factor", { method: "POST", body: { action: "disable", password, code: code.trim() } });
    await refreshProfile();
    router.back();
  });

  if (enabled) {
    return (
      <Screen>
        <Card>
          <Badge tone="safe" icon="shield-checkmark" label="On" />
          <Body>Your account asks for a code from your authenticator app when you log in, on the app and the website.</Body>
        </Card>
        <Card>
          <Heading level={2}>Turn off two-factor authentication</Heading>
          <Body small muted>This makes your account easier to take over if someone learns your password.</Body>
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
          <Field label="Current 6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} autoComplete="one-time-code" textContentType="oneTimeCode" />
          {!!error && <Notice tone="danger" icon="alert-circle">{error}</Notice>}
          <Button title="Turn off" icon="lock-open-outline" variant="danger" busy={busy === "disable"} onPress={disable} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <Badge tone="warn" icon="lock-open-outline" label="Off" />
        <Body>Two-factor authentication asks for a one-time code from an authenticator app when you log in, so a stolen password isn't enough to get into your account.</Body>
      </Card>
      {!setup ? (
        <>
          {!!error && <Notice tone="danger" icon="alert-circle">{error}</Notice>}
          <Button title="Set up two-factor authentication" icon="shield-checkmark-outline" busy={busy === "setup"} onPress={start} />
        </>
      ) : (
        <Card>
          <Heading level={2}>1. Add ScamShield to your authenticator app</Heading>
          <Button title="Open authenticator app" icon="open-outline" onPress={openAuthenticator} />
          <Body small muted>Or add it manually with this setup key:</Body>
          <Text style={s.secret} selectable accessibilityLabel={`Setup key ${setup.secret.split("").join(" ")}`}>{setup.secret.match(/.{1,4}/g).join(" ")}</Text>
          <Button small variant="outline" icon="copy-outline" title="Copy setup key" onPress={async () => { await Clipboard.setStringAsync(setup.secret); Alert.alert("Copied", "Paste it into your authenticator app. Don't share this key with anyone."); }} />
          <Heading level={2}>2. Enter the 6-digit code it shows</Heading>
          <Field value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} accessibilityLabel="6-digit code" autoComplete="one-time-code" textContentType="oneTimeCode" />
          {!!error && <Notice tone="danger" icon="alert-circle">{error}</Notice>}
          <Button title="Turn on" icon="checkmark" busy={busy === "enable"} onPress={enable} />
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  secret: { fontFamily: "monospace", fontSize: 18, letterSpacing: 1, color: colors.ink, backgroundColor: colors.surface2, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, padding: space.md, textAlign: "center" }
});
