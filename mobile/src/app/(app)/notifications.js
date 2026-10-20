import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "@/api/client";
import PagedList from "@/components/PagedList";
import { Body, Button, Segmented } from "@/components/ui";
import { NOTIFICATION_TYPES } from "@/lib/constants";
import { appRoute, timeAgo } from "@/lib/format";
import { usePaged } from "@/lib/usePaged";
import { colors, space } from "@/theme";

const FILTERS = [["", "All"], ["unread", "Unread"]];

export default function NotificationsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const list = usePaged("/api/notifications", { filter }, { pageSize: 20 });
  const unread = list.extra.unread ?? 0;

  const markRead = async (ids, all = false) => {
    try {
      await api("/api/notifications", { method: "PATCH", body: all ? { all: true } : { ids } });
      const now = new Date().toISOString();
      list.update(items => items.map(item => (all || ids.includes(item.id) ? { ...item, read_at: item.read_at || now } : item)));
      if (all || filter === "unread") list.reload();
    } catch (error) {
      Alert.alert("Couldn't update notifications", error.message);
    }
  };

  const open = item => {
    if (!item.read_at) markRead([item.id]);
    const route = appRoute(item.link);
    if (route && item.link !== "/notifications") router.push(route);
  };

  return (
    <PagedList
      list={list}
      loadingLabel="Loading notifications…"
      header={<>
        <Segmented options={FILTERS} value={filter} onChange={setFilter} />
        {unread > 0 && <Button small variant="outline" icon="checkmark-done-outline" title={`Mark all ${unread} as read`} onPress={() => markRead([], true)} />}
      </>}
      renderItem={item => {
        const type = NOTIFICATION_TYPES[item.type] || { icon: "notifications-outline", label: "Notification" };
        const isAlert = item.type === "threat_alert";
        return (
          <Pressable onPress={() => open(item)} accessibilityRole="button" accessibilityLabel={`${item.read_at ? "" : "Unread. "}${item.title}`} style={({ pressed }) => [s.row, pressed && { opacity: 0.75 }]}>
            <View style={[s.icon, isAlert && s.alertIcon]}><Ionicons name={type.icon} size={18} color={isAlert ? colors.dangerText : colors.blue700} /></View>
            <View style={s.flex}>
              <Text style={[s.title, !item.read_at && s.unread]}>{item.title}</Text>
              {!!item.body && <Body small>{item.body}</Body>}
              <Body small muted>{type.label} · {timeAgo(item.created_at)}</Body>
            </View>
            {!item.read_at && <View style={s.dot} accessibilityElementsHidden />}
          </Pressable>
        );
      }}
      empty={filter ? { icon: "notifications-outline", title: "You're all caught up" } : { icon: "notifications-outline", title: "No notifications yet", body: "Results, report updates and confirmed scam alerts will appear here." }}
    />
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, minWidth: 0, gap: 2 },
  row: { flexDirection: "row", gap: space.md, paddingVertical: space.md, alignItems: "flex-start" },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.blue50, alignItems: "center", justifyContent: "center" },
  alertIcon: { backgroundColor: colors.dangerBg },
  title: { fontSize: 15, color: colors.ink, fontWeight: "500" },
  unread: { fontWeight: "800" },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue600, marginTop: 6 }
});
