import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { API_URL } from "@/api/client";
import { useSession } from "@/auth/session";
import { Badge, Body, Button, Card, Heading, Notice, Row, Screen } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { colors, space } from "@/theme";

export default function AccountScreen() {
  const router = useRouter();
  const { profile, signOut, refreshProfile } = useSession();
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const go = path => () => router.push(path);

  const refresh = async () => {
    setRefreshing(true);
    try { await refreshProfile(); } catch (error) { Alert.alert("Couldn't refresh", error.message); } finally { setRefreshing(false); }
  };

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
      </Card>
      <Card>
        <Heading level={2}>Activity</Heading>
        <Row icon="time-outline" title="Scam history" subtitle="Messages, links and senders you've checked" onPress={go("/history")} />
        <Row icon="notifications-outline" title="Notifications" subtitle="Results, report updates and scam alerts" onPress={go("/notifications")} />
        <Row icon="school-outline" title="Scam Awareness Academy" subtitle="Short lessons and quizzes" onPress={go("/academy")} />
      </Card>
      <Card>
        <Heading level={2}>Account and security</Heading>
        <Row icon="person-outline" title="Profile" subtitle="Name and email" onPress={go("/settings/profile")} />
        <Row icon="key-outline" title="Change password" onPress={go("/settings/password")} />
        <Row icon="shield-checkmark-outline" title="Two-factor authentication"
          right={profile ? <Badge tone={profile.totp_enabled ? "safe" : "warn"} label={profile.totp_enabled ? "On" : "Off"} /> : null}
          onPress={go("/settings/two-factor")} />
        <Row icon="phone-portrait-outline" title="Signed-in devices" subtitle="App and website sessions" onPress={go("/settings/sessions")} />
      </Card>
      <Card>
        <Heading level={2}>Privacy</Heading>
        <Row icon="options-outline" title="Notification settings" onPress={go("/settings/notifications")} />
        <Row icon="lock-closed-outline" title="Privacy and data" subtitle="Security activity, clear history, delete account" onPress={go("/settings/privacy")} />
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
