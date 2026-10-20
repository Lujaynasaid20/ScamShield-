import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSession } from "@/auth/session";
import { icon } from "@/components/results";
import { Body, Button, Card, EmptyState, ErrorState, Heading, Loading, Row, Screen, VerdictBadge } from "@/components/ui";
import { appRoute, KIND, timeAgo } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { colors, radius, space } from "@/theme";

function Stat({ label, value, tone = colors.ink }) {
  return (
    <View style={s.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={[s.statValue, { color: tone }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ title, iconName, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.quick, pressed && { opacity: 0.75 }]}>
      <Ionicons name={iconName} size={24} color={colors.blue700} />
      <Text style={s.quickText}>{title}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useSession();
  const { data, error, loading, refreshing, reload } = useApi("/api/overview");
  const recommendations = (data?.recommendations || []).map(item => ({ ...item, route: appRoute(item.href) })).filter(item => item.route);

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <View>
        <Heading level={1}>Hello{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}</Heading>
        <Body muted>Check anything suspicious before you click, pay or reply.</Body>
      </View>
      <View style={s.quickRow}>
        <QuickAction title="Scan a message" iconName="chatbox-ellipses-outline" onPress={() => router.push("/scan")} />
        <QuickAction title="Check a link" iconName="link-outline" onPress={() => router.push({ pathname: "/check", params: { mode: "url" } })} />
        <QuickAction title="Check a sender" iconName="call-outline" onPress={() => router.push({ pathname: "/check", params: { mode: "sender" } })} />
      </View>
      {!!loading && <Loading label="Loading your dashboard…" />}
      {!!(error && !data) && <ErrorState message={error} onRetry={reload} />}
      {!!data && (
        <>
          <Card>
            <Heading level={2}>Your security summary</Heading>
            <View style={s.stats}>
              <Stat label="Messages checked" value={data.totals.messages} />
              <Stat label="Likely scams" value={data.totals.scam} tone={colors.dangerText} />
              <Stat label="Suspicious" value={data.totals.suspicious} tone={colors.warnText} />
              <Stat label="Risky links" value={data.totals.risky_urls} tone={colors.dangerText} />
              <Stat label="Senders checked" value={data.totals.senders} />
              <Stat label="Open reports" value={data.reports.open} />
            </View>
          </Card>
          {recommendations.length > 0 && (
            <Card>
              <Heading level={2}>Recommended for you</Heading>
              {recommendations.map(item => <Row key={item.title} icon={icon(item.icon)} title={item.title} subtitle={item.body} onPress={() => router.push(item.route)} />)}
            </Card>
          )}
          <Card>
            <View style={s.titleRow}>
              <Heading level={2}>Recent checks</Heading>
              {data.recent.length > 0 && <Button small variant="outline" title="See all" onPress={() => router.push("/history")} />}
            </View>
            {data.recent.length
              ? data.recent.map(item => (
                <Row key={item.id} icon={KIND[item.kind]?.icon} title={item.input} subtitle={`${KIND[item.kind]?.label} · ${timeAgo(item.created_at)}`}
                  right={<VerdictBadge verdict={item.verdict} kind={item.kind} />} onPress={() => router.push({ pathname: "/history/[id]", params: { id: item.id } })} />
              ))
              : <EmptyState icon="shield-checkmark-outline" title="No checks yet" body="Scan a suspicious message, link or sender to see the result here." />}
          </Card>
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  quickRow: { flexDirection: "row", gap: space.sm },
  quick: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: space.md, alignItems: "center", gap: 6, minHeight: 88, justifyContent: "center" },
  quickText: { fontSize: 13, fontWeight: "700", color: colors.ink, textAlign: "center" },
  stats: { flexDirection: "row", flexWrap: "wrap", rowGap: space.md },
  stat: { width: "33.33%", paddingRight: space.sm },
  statValue: { fontSize: 24, fontWeight: "800" },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }
});
