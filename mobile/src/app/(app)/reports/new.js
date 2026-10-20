import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "@/api/client";
import EvidencePicker from "@/components/EvidencePicker";
import { Body, Button, Card, Field, Notice, Screen, Segmented } from "@/components/ui";
import { CATEGORY_TO_REPORT, REPORT_CATEGORIES } from "@/lib/constants";
import { colors, radius, space } from "@/theme";

const SENDER_TYPES = [["phone", "Phone"], ["email", "Email"], ["name", "Name"]];
const SENDER_PLACEHOLDER = { phone: "+255 754 123 456", email: "name@example.com", name: "e.g. M-PESA Support" };

export default function NewReportScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const caseId = /^\d{1,18}$/.test(String(params.case || "")) ? String(params.case) : null;
  const [form, setForm] = useState({
    category: "", details: "", message_text: "", url: "",
    sender_type: ["phone", "email", "name"].includes(params.sender_type) ? params.sender_type : "phone",
    sender_value: params.sender_value ? String(params.sender_value) : "", claimed_identity: ""
  });
  const [files, setFiles] = useState([]);
  const [linked, setLinked] = useState(null);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = key => value => setForm(current => ({ ...current, [key]: value }));

  // Pre-fill from a check in the user's history, like the website.
  useEffect(() => {
    if (!caseId) return;
    api(`/api/history/${caseId}`).then(({ item }) => {
      setLinked(item);
      setForm(current => ({
        ...current,
        category: CATEGORY_TO_REPORT[item.category] || (item.kind === "url" ? "Phishing / fake link" : current.category),
        message_text: item.kind === "message" ? item.input : current.message_text,
        url: item.kind === "url" ? item.input : current.url,
        sender_type: item.kind === "sender" ? item.details.type : current.sender_type,
        sender_value: item.kind === "sender" ? item.input : current.sender_value,
        details: current.details || (item.kind === "message" ? `I received this message. ScamShield rated it ${item.verdictLabel} (${item.score}/100).` : item.kind === "url" ? `I received this link. ScamShield rated it ${item.score}/100.` : "")
      }));
    }).catch(() => setError("The linked check couldn't be loaded. You can still fill in the report."));
  }, [caseId]);

  const submit = async () => {
    setError("");
    const next = {};
    if (!form.category) next.category = "Choose a scam category.";
    if (!form.details.trim()) next.details = "Describe what happened.";
    setErrors(next);
    if (Object.keys(next).length) { setError("Please fix the highlighted fields."); return; }
    setBusy(true);
    const body = new FormData();
    for (const [key, value] of Object.entries(form)) if (key !== "sender_type" || form.sender_value.trim()) body.append(key, value);
    if (linked) body.append("case_id", String(linked.id));
    for (const file of files) body.append("evidence", { uri: file.uri, name: file.name, type: file.type });
    try {
      const { item } = await api("/api/reports", { method: "POST", body });
      router.replace({ pathname: "/reports/[id]", params: { id: item.id, submitted: "1" } });
    } catch (requestError) {
      setBusy(false);
      if (requestError.data?.report_id) {
        Alert.alert("Already reported", requestError.message, [
          { text: "Stay here", style: "cancel" },
          { text: "View report", onPress: () => router.replace({ pathname: "/reports/[id]", params: { id: requestError.data.report_id } }) }
        ]);
      } else setError(requestError.message);
    }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={100}>
      <Screen>
        {!!linked && <Notice icon="link-outline">{`Linked to your ${linked.kind === "url" ? "link scan" : linked.kind === "sender" ? "sender check" : "message check"} from your history.`}</Notice>}
        <Notice tone="warn" icon="shield-outline">Never include passwords, PINs, one-time codes or full card numbers, even in a report.</Notice>
        <Card>
          <Text style={s.label}>Scam category *</Text>
          <View style={s.chips} accessibilityRole="radiogroup">
            {REPORT_CATEGORIES.map(category => {
              const selected = form.category === category;
              return (
                <Pressable key={category} onPress={() => set("category")(category)} accessibilityRole="radio" accessibilityState={{ checked: selected }} style={[s.chip, selected && s.chipSelected]}>
                  <Text style={[s.chipText, selected && s.chipTextSelected]}>{category}</Text>
                </Pressable>
              );
            })}
          </View>
          {!!errors.category && <Text style={s.error}>{errors.category}</Text>}
          <Field label="What happened? *" multiline value={form.details} onChangeText={set("details")} maxLength={2000} error={errors.details}
            placeholder="When did it happen, how were you contacted, and what were you asked to do?" hint={`${form.details.length} / 2000`} />
        </Card>
        <Card>
          <Field label="Suspicious message (optional)" multiline value={form.message_text} onChangeText={set("message_text")} maxLength={5000} placeholder="Paste the message you received" style={s.shortMultiline} />
          <Field label="Suspicious link (optional)" value={form.url} onChangeText={set("url")} maxLength={2048} placeholder="https://…" autoCapitalize="none" autoCorrect={false} keyboardType="url" />
        </Card>
        <Card>
          <Text style={s.label}>Sender (optional)</Text>
          <Segmented options={SENDER_TYPES} value={form.sender_type} onChange={set("sender_type")} />
          <Field value={form.sender_value} onChangeText={set("sender_value")} maxLength={200} placeholder={SENDER_PLACEHOLDER[form.sender_type]} accessibilityLabel="Sender"
            autoCapitalize="none" autoCorrect={false} keyboardType={form.sender_type === "phone" ? "phone-pad" : form.sender_type === "email" ? "email-address" : "default"} />
          <Field label="Who did they claim to be? (optional)" value={form.claimed_identity} onChangeText={set("claimed_identity")} maxLength={120} placeholder="e.g. John from KCB Bank" />
          <Body small muted>Other users who check this sender will see only the category, status, date and the name the sender claimed.</Body>
        </Card>
        <Card><EvidencePicker files={files} onChange={setFiles} /></Card>
        {!!error && <Notice tone="danger" icon="alert-circle">{error}</Notice>}
        <Button title={busy ? "Submitting…" : "Submit report"} icon="send-outline" busy={busy} onPress={submit} />
        <Body small muted>Administrators review reports and may publish alerts to warn other users. If you lost money, also contact your bank or mobile-money provider right away. ScamShield can't recover funds.</Body>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  label: { fontSize: 14, fontWeight: "700", color: colors.ink2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: { borderWidth: 1, borderColor: colors.lineStrong, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 8, backgroundColor: colors.surface, minHeight: 38, justifyContent: "center" },
  chipSelected: { backgroundColor: colors.blue600, borderColor: colors.blue600 },
  chipText: { fontSize: 14, color: colors.ink2, fontWeight: "600" },
  chipTextSelected: { color: "#fff" },
  error: { fontSize: 13, color: colors.dangerText, fontWeight: "600" },
  shortMultiline: { minHeight: 90 }
});
