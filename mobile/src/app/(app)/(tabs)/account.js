import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { API_URL } from "@/api/client";
import { useSession } from "@/auth/session";
import { Body, Button, Card, Heading, Notice, Row, Screen } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { colors, space } from "@/theme";

export default function AccountScreen() {
  const { profile, signOut, refreshProfile } = useSession();
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try { await refreshProfile(); } catch (error) { Alert.alert("Couldn't refresh", error.message); } finally { setRefreshing(false); }
  };

  // Opens our own website in an in-app browser tab (not a link from a message, so it's safe to open).
  const openWebsite = path => WebBrowser.openBrowserAsync(`${API_URL}${path}`).catch(() => Alert.alert("Couldn't open the website", "Check your connection and try again."));

  const confirmSignOut = () => Alert.alert("Log out?", "You'll need your email and password to log in again on this phone.", [
    { text: "Cancel", style: "cancel" },
    { text: "Log out", style: "destructive", onPress: async () => { setSigningOut(true); await signOut(); } }
  ]);

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Card>
        {profile ? (
          <View style={s.profile}>
            <View style={s.avatar}><Text style={s.avatarText}>{(profile.display_name || profile.email).slice(0, 1).toUpperCase()}</Text></View>
            <View style={s.flex}>
              <Heading level={2}>{profile.display_name}</Heading>
              <Body muted>{profile.email}</Body>
              <Body small muted>Member since {formatDate(profile.created_at, { time: false })}</Body>
            </View>
          </View>
        ) : <Notice tone="warn" icon="cloud-offline-outline">Your profile couldn't be loaded. Pull down to try again.</Notice>}
        {!!(profile && !profile.totp_enabled) && <Notice tone="warn" icon="lock-open-outline">Two-factor authentication is off. Turn it on from the website's security settings to protect your account.</Notice>}
      </Card>
      <Card>
        <Heading level={2}>Account and security</Heading>
        <Body small muted>Profile, password, two-factor authentication, signed-in devices and privacy settings are managed on the website for now. Log in there with the same account.</Body>
        <Row icon="settings-outline" title="Settings on the website" subtitle="Profile, password and preferences" onPress={() => openWebsite("/settings")} />
        <Row icon="phone-portrait-outline" title="Signed-in devices" subtitle="See or sign out this phone from the website" onPress={() => openWebsite("/settings#security")} />
      </Card>
      <Button title="Log out" icon="log-out-outline" variant="danger" busy={signingOut} onPress={confirmSignOut} />
      <Body small muted style={s.center}>ScamShield {Constants.expoConfig?.version} · {API_URL.replace(/^https?:\/\//, "")}</Body>
    </Screen>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  profile: { flexDirection: "row", gap: space.md, alignItems: "center" },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.blue600, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "800" },
  center: { textAlign: "center" }
});
