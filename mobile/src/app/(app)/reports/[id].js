import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { api, API_URL, authHeaders } from "@/api/client";
import EvidencePicker from "@/components/EvidencePicker";
import { Body, Button, Card, ErrorState, Field, Heading, Loading, Notice, Screen, StatusBadge } from "@/components/ui";
import { formatBytes, formatDate } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { colors, radius, space } from "@/theme";

const TIMELINE_TEXT = {
  created: () => "Report submitted",
  status: entry => `Status changed to ${entry.to_status_label || entry.to_status}`,
  feedback: () => "Feedback from an administrator",
  user_note: () => "You added information"
};

function Fact({ label, children, mono }) {
  return (
    <View style={s.fact}>
      <Text style={s.factLabel}>{label}</Text>
      <Text style={[s.factValue, mono && s.mono]} selectable>{children}</Text>
    </View>
  );
}

export default function ReportDetailScreen() {
  const { id, submitted } = useLocalSearchParams();
  const valid = /^\d{1,18}$/.test(String(id));
  const { data, error, loading, refreshing, reload, setData } = useApi(valid ? `/api/reports/${id}` : null);
  const [note, setNote] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sent, setSent] = useState(false);
  const report = data?.item;

  const addInfo = async () => {
    setSendError("");
    if (!note.trim() && !files.length) { setSendError("Add a note or attach a file."); return; }
    setSending(true);
    const body = new FormData();
    body.append("note", note.trim());
    for (const file of files) body.append("evidence", { uri: file.uri, name: file.name, type: file.type });
    try {
      const response = await api(`/api/reports/${id}/updates`, { method: "POST", body });
      setData(response);
      setNote(""); setFiles([]); setSent(true);
    } catch (requestError) {
      setSendError(requestError.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen refreshing={refreshing} onRefresh={valid ? reload : undefined}>
      <Stack.Screen options={{ title: report ? `Report #${report.id}` : "Report" }} />
      {!valid && <ErrorState message="This report link isn't valid." />}
      {!!loading && <Loading />}
      {!!(error && !report) && <ErrorState message={error} onRetry={reload} />}
      {!!report && (
        <>
          {submitted === "1" && <Notice tone="safe" icon="checkmark-circle">Report submitted. You'll be notified when an administrator updates it.</Notice>}
          <Card>
            <StatusBadge status={report.status} />
            <Heading level={1} style={s.title}>{report.category}</Heading>
            <Body small muted>Submitted {formatDate(report.created_at)} · updated {formatDate(report.updated_at)}</Body>
          </Card>
          {!!report.admin_feedback && (
            <Notice tone="info" icon="chatbubble-ellipses-outline">
              <Text style={s.noticeTitle}>Feedback from an administrator</Text>
              <Text style={s.noticeText}>{report.admin_feedback}</Text>
            </Notice>
          )}
          <Card>
            <Heading level={2}>Details</Heading>
            <Fact label="What happened">{report.details}</Fact>
            {!!report.message_text && <Fact label="Suspicious message">{report.message_text}</Fact>}
            {!!report.url && <Fact label="Suspicious link" mono>{report.url}</Fact>}
            {!!report.sender_value && <Fact label={`Sender (${report.sender_type})`} mono>{report.sender_value}</Fact>}
            {!!report.claimed_identity && <Fact label="Claimed to be">{report.claimed_identity}</Fact>}
          </Card>
          {report.evidence.length > 0 && (
            <Card>
              <Heading level={2}>Evidence</Heading>
              {report.evidence.map(file => (
                <View key={file.id} style={s.evidence}>
                  {file.mime_type.startsWith("image/")
                    ? <Image source={{ uri: `${API_URL}/api/reports/${report.id}/evidence/${file.id}`, headers: authHeaders() }} style={s.thumb} accessibilityLabel={file.file_name} />
                    : <View style={[s.thumb, s.docThumb]}><Text style={s.docText}>{file.mime_type === "application/pdf" ? "PDF" : "TXT"}</Text></View>}
                  <View style={s.flex}>
                    <Text style={s.fileName} numberOfLines={1}>{file.file_name}</Text>
                    <Body small muted>{formatBytes(file.size_bytes)} · {formatDate(file.created_at, { time: false })}</Body>
                  </View>
                </View>
              ))}
            </Card>
          )}
          <Card>
            <Heading level={2}>Timeline</Heading>
            {report.timeline.map(entry => (
              <View key={entry.id} style={s.timelineRow}>
                <View style={s.dot} />
                <View style={s.flex}>
                  <Text style={s.timelineTitle}>{(TIMELINE_TEXT[entry.kind] || (() => entry.kind))(entry)}</Text>
                  {!!entry.note && <Body small>{entry.note}</Body>}
                  <Body small muted>{entry.by} · {formatDate(entry.created_at)}</Body>
                </View>
              </View>
            ))}
          </Card>
          {report.can_add_info ? (
            <Card>
              <Heading level={2}>Add information</Heading>
              <Body small muted>Did they contact you again, or do you have more evidence? Add it while the report is open.</Body>
              <Field label="Note" multiline value={note} onChangeText={text => { setNote(text); setSent(false); }} maxLength={2000} placeholder="e.g. They called again from a different number." style={s.shortMultiline} />
              <EvidencePicker files={files} onChange={setFiles} max={Math.max(0, 5 - report.evidence.length)} />
              {!!sendError && <Notice tone="danger" icon="alert-circle">{sendError}</Notice>}
              {sent && <Notice tone="safe" icon="checkmark-circle">Added to your report.</Notice>}
              <Button title="Add to report" icon="add-circle-outline" busy={sending} onPress={addInfo} />
            </Card>
          ) : <Notice tone="neutral" icon="lock-closed-outline">This report is closed, so no more information can be added.</Notice>}
        </>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  title: { fontSize: 22 },
  noticeTitle: { fontWeight: "700", color: colors.infoText, marginBottom: 2 },
  noticeText: { fontSize: 14, lineHeight: 20, color: colors.infoText },
  fact: { gap: 2, paddingVertical: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  factLabel: { fontSize: 13, fontWeight: "700", color: colors.muted },
  factValue: { fontSize: 15, lineHeight: 22, color: colors.ink },
  mono: { fontFamily: "monospace", fontSize: 14 },
  evidence: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.sm },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line },
  docThumb: { alignItems: "center", justifyContent: "center" },
  docText: { fontSize: 12, fontWeight: "800", color: colors.muted },
  fileName: { fontSize: 14, fontWeight: "600", color: colors.ink },
  timelineRow: { flexDirection: "row", gap: space.md, paddingVertical: space.sm },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue600, marginTop: 6 },
  timelineTitle: { fontSize: 15, fontWeight: "700", color: colors.ink },
  shortMultiline: { minHeight: 90 }
});
