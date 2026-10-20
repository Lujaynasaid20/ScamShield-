import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { icon } from "@/components/results";
import { Badge, Body, Card, ErrorState, Heading, Loading, Row, Screen } from "@/components/ui";
import { useApi } from "@/lib/useApi";
import { colors, radius } from "@/theme";

export default function AcademyScreen() {
  const router = useRouter();
  const { data, error, loading, refreshing, reload } = useApi("/api/academy");
  const percent = data ? Math.round((data.completed / Math.max(1, data.total)) * 100) : 0;

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      {!!loading && <Loading label="Loading lessons…" />}
      {!!(error && !data) && <ErrorState message={error} onRetry={reload} />}
      {!!data && (
        <>
          <Card>
            <Heading level={2}>Your progress</Heading>
            <Body>{data.completed} of {data.total} modules completed. Read a lesson, then pass its short quiz.</Body>
            <View style={s.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }}>
              <View style={[s.fill, { width: `${percent}%` }]} />
            </View>
          </Card>
          <Card>
            {data.modules.map(module => (
              <Row key={module.id} icon={icon(module.icon)} title={module.title}
                subtitle={`${module.minutes} min · ${module.best_score !== null ? `best quiz score ${module.best_score}/${module.quiz_total}` : module.lesson_completed ? "lesson read" : module.summary}`}
                right={module.completed ? <Badge tone="safe" icon="checkmark" label="Done" /> : null}
                onPress={() => router.push({ pathname: "/academy/[id]", params: { id: module.id } })} />
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  track: { height: 10, borderRadius: radius.pill, backgroundColor: colors.neutralBg, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.blue600, borderRadius: radius.pill }
});
