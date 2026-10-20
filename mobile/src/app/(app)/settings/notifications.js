import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { api } from "@/api/client";
import { Body, Card, ErrorState, Loading, Notice, Screen } from "@/components/ui";
import { NOTIFICATION_TYPES } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { colors, space } from "@/theme";

export default function NotificationSettingsScreen() {
  const { data, error, loading, refreshing, reload, setData } = useApi("/api/settings/preferences");
  const [saveError, setSaveError] = useState("");

  // Optimistic toggle; reverts if the server rejects it.
  const toggle = async (field, value) => {
    setSaveError("");
    const previous = data.preferences;
    setData({ preferences: { ...previous, [field]: value } });
    try { setData(await api("/api/settings/preferences", { method: "PUT", body: { [field]: value } })); }
    catch (requestError) { setData({ preferences: previous }); setSaveError(requestError.message); }
  };

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Body muted>Choose what appears in your ScamShield notifications, on the app and the website.</Body>
      {!!loading && <Loading />}
      {!!(error && !data) && <ErrorState message={error} onRetry={reload} />}
      {!!saveError && <Notice tone="danger" icon="alert-circle">{saveError}</Notice>}
      {!!data && (
        <Card>
          {Object.entries(NOTIFICATION_TYPES).map(([type, info]) => (
            <View key={type} style={s.row}>
              <Ionicons name={info.icon} size={20} color={colors.blue700} />
              <View style={s.flex}>
                <Text style={s.title}>{info.label}</Text>
                <Body small muted>{info.description}</Body>
              </View>
              <Switch value={Boolean(data.preferences[info.field])} onValueChange={value => toggle(info.field, value)}
                accessibilityLabel={info.label} trackColor={{ true: colors.blue600 }} />
            </View>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  title: { fontSize: 15, fontWeight: "700", color: colors.ink }
});
