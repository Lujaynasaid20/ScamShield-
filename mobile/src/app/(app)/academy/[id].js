import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "@/api/client";
import { Badge, Body, Button, Card, ErrorState, Heading, Loading, Notice, Screen } from "@/components/ui";
import { useApi } from "@/lib/useApi";
import { colors, radius, space } from "@/theme";

function Bullets({ items, iconName, tone }) {
  return items.map(item => (
    <View key={item} style={s.bullet}>
      <Ionicons name={iconName} size={18} color={tone} style={s.bulletIcon} />
      <Body style={s.flex}>{item}</Body>
    </View>
  ));
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams();
  const { data, error, loading, refreshing, reload, setData } = useApi(`/api/academy/${encodeURIComponent(String(id))}`);
  const [answers, setAnswers] = useState({});
  const [grade, setGrade] = useState(null);
  const [busy, setBusy] = useState("");
  const [actionError, setActionError] = useState("");
  const module = data?.module;
  const progress = data?.progress;

  const markRead = async () => {
    setBusy("lesson"); setActionError("");
    try { const result = await api(`/api/academy/${module.id}`, { method: "POST", body: { action: "lesson" } }); setData({ ...data, progress: result.progress }); }
    catch (requestError) { setActionError(requestError.message); }
    finally { setBusy(""); }
  };

  // Answers are graded on the server, which stores the score and best score.
  const submitQuiz = async () => {
    setActionError("");
    if (Object.keys(answers).length !== module.quiz.length) { setActionError("Answer every question before submitting."); return; }
    setBusy("quiz");
    try {
      const result = await api(`/api/academy/${module.id}`, { method: "POST", body: { action: "quiz", answers: module.quiz.map((_, index) => answers[index]) } });
      setGrade(result.grade);
      setData({ ...data, progress: result.progress });
    } catch (requestError) { setActionError(requestError.message); }
    finally { setBusy(""); }
  };

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Stack.Screen options={{ title: module?.title || "Lesson" }} />
      {!!loading && <Loading label="Loading the lesson…" />}
      {!!(error && !data) && <ErrorState message={error} onRetry={reload} />}
      {!!module && (
        <>
          <Card>
            <Heading level={1} style={s.title}>{module.title}</Heading>
            <Body muted>{module.minutes}-minute lesson · {module.summary}</Body>
            {progress.completed && <Badge tone="safe" icon="checkmark-circle" label="Module completed" />}
            {module.lesson.map(paragraph => <Body key={paragraph}>{paragraph}</Body>)}
          </Card>
          <Card>
            <Heading level={2}>Examples</Heading>
            <Body small muted>Written for teaching, not real reported messages.</Body>
            {module.examples.map(example => (
              <View key={example.text} style={s.example}>
                <Text style={s.channel}>{example.channel}</Text>
                <Text style={s.exampleText}>{example.text}</Text>
                <Body small><Text style={s.bold}>Why it's suspicious: </Text>{example.note}</Body>
              </View>
            ))}
          </Card>
          <Card>
            <Heading level={2}>Warning signs</Heading>
            <Bullets items={module.warningSigns} iconName="alert-circle-outline" tone={colors.dangerText} />
          </Card>
          <Card>
            <Heading level={2}>Stay safe</Heading>
            <Bullets items={module.tips} iconName="checkmark-circle-outline" tone={colors.safeText} />
          </Card>
          {progress.lesson_completed
            ? <Notice tone="safe" icon="checkmark-circle">Lesson read. Now take the quiz to complete the module.</Notice>
            : <Button title="I've read this lesson" icon="book-outline" variant="outline" busy={busy === "lesson"} onPress={markRead} />}

          <Card>
            <Heading level={2}>Quiz</Heading>
            <Body small muted>Get {data.passMark} of {module.quiz.length} right to complete the module.{progress.best_score !== null ? ` Your best score: ${progress.best_score}/${module.quiz.length}.` : ""}</Body>
            {module.quiz.map((question, qIndex) => {
              const result = grade?.results[qIndex];
              return (
                <View key={question.question} style={s.question} accessibilityRole="radiogroup" accessibilityLabel={question.question}>
                  <Text style={s.questionText}>{qIndex + 1}. {question.question}</Text>
                  {question.options.map((option, oIndex) => {
                    const selected = answers[qIndex] === oIndex;
                    const correct = result && oIndex === result.answer;
                    const wrong = result && selected && !result.correct;
                    return (
                      <Pressable key={option} disabled={Boolean(grade)} onPress={() => setAnswers(current => ({ ...current, [qIndex]: oIndex }))}
                        accessibilityRole="radio" accessibilityState={{ checked: selected, disabled: Boolean(grade) }}
                        style={[s.option, selected && s.optionSelected, correct && s.optionCorrect, wrong && s.optionWrong]}>
                        <Ionicons name={correct ? "checkmark-circle" : wrong ? "close-circle" : selected ? "radio-button-on" : "radio-button-off"} size={20}
                          color={correct ? colors.safeText : wrong ? colors.dangerText : selected ? colors.blue600 : colors.muted} />
                        <Text style={s.optionText}>{option}</Text>
                      </Pressable>
                    );
                  })}
                  {!!result && <Body small style={s.explanation}>{question.explanation}</Body>}
                </View>
              );
            })}
            {!!grade && (
              <Notice tone={grade.passed ? "safe" : "warn"} icon={grade.passed ? "trophy-outline" : "refresh"}>
                {grade.passed ? `You scored ${grade.score}/${grade.total}. Module completed!` : `You scored ${grade.score}/${grade.total}. Review the lesson and try again.`}
              </Notice>
            )}
            {!!actionError && <Notice tone="danger" icon="alert-circle">{actionError}</Notice>}
            {grade
              ? <Button title="Try the quiz again" icon="refresh" variant="outline" onPress={() => { setGrade(null); setAnswers({}); }} />
              : <Button title="Submit answers" icon="checkmark-done-outline" busy={busy === "quiz"} onPress={submitQuiz} />}
          </Card>
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  title: { fontSize: 22 },
  bold: { fontWeight: "700" },
  bullet: { flexDirection: "row", gap: space.sm, alignItems: "flex-start" },
  bulletIcon: { marginTop: 2 },
  example: { backgroundColor: colors.surface2, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.line, padding: space.md, gap: 6 },
  channel: { fontSize: 12, fontWeight: "800", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  exampleText: { fontSize: 15, lineHeight: 22, color: colors.ink, fontStyle: "italic" },
  question: { gap: space.sm, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  questionText: { fontSize: 15, fontWeight: "700", color: colors.ink, lineHeight: 21 },
  option: { flexDirection: "row", alignItems: "center", gap: space.sm, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: radius.sm, padding: space.md, minHeight: 48 },
  optionSelected: { borderColor: colors.blue600, backgroundColor: colors.blue50 },
  optionCorrect: { borderColor: colors.safeText, backgroundColor: colors.safeBg },
  optionWrong: { borderColor: colors.dangerText, backgroundColor: colors.dangerBg },
  optionText: { flex: 1, fontSize: 15, color: colors.ink },
  explanation: { color: colors.ink2 }
});
