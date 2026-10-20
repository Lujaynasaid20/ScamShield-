import * as Clipboard from "expo-clipboard";
import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { api } from "@/api/client";
import { MessageResult } from "@/components/results";
import { Body, Button, Card, Field, Notice, Screen } from "@/components/ui";
import { colors, space } from "@/theme";

const MAX = 5000;
// Illustrative examples written for this tool, not real reported messages (same as the website).
const EXAMPLES = {
  "Urgent bank alert": "URGENT: Your bank account will be suspended today. Verify your PIN now at https://bit.ly/verify-account or access will be blocked.",
  "Prize message": "Congratulations! You have won a free gift. Pay a small processing fee now to claim your prize: www.claim-reward.example",
  "Normal delivery update": "Your delivery is scheduled for tomorrow between 10:00 and 12:00. Track your parcel in the courier app you already use."
};

export default function ScanScreen() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const scrollRef = useRef(null);
  const resultY = useRef(0);

  // Reading the clipboard only happens when the user taps Paste (iOS also asks for permission each time).
  const paste = async () => {
    setError("");
    try {
      const text = (await Clipboard.getStringAsync()).trim();
      if (!text) { setError("Your clipboard is empty. Copy the suspicious message first, then tap Paste."); return; }
      setMessage(text.slice(0, MAX));
      setOutcome(null);
    } catch {
      setError("The clipboard couldn't be read. Long-press the message box and choose Paste instead.");
    }
  };

  const analyze = async () => {
    setError("");
    if (!message.trim()) { setError("Paste or type a message first so it can be checked."); return; }
    setBusy(true);
    try {
      const data = await api("/api/analyze", { method: "POST", body: { message: message.trim(), source: "text" } });
      setOutcome({ item: { ...data.item, details: { ...data.item.details, recommendations: data.recommendations } }, result: data.result });
      setTimeout(() => scrollRef.current?.scrollTo({ y: resultY.current, animated: true }), 100);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen ref={scrollRef}>
      <Card>
        <Body muted>Paste an SMS, WhatsApp, email or social-media message. Rule-based checks and an experimental English/Swahili model explain the warning signs.</Body>
        <Field label="Suspicious message" multiline value={message} onChangeText={text => { setMessage(text); setOutcome(null); }} maxLength={MAX} placeholder="Paste the full message here…" />
        <Text style={s.count}>{message.length} / {MAX}</Text>
        <View style={s.row}>
          <Button title="Paste" icon="clipboard-outline" variant="outline" onPress={paste} style={s.flex} />
          {message ? <Button title="Clear" icon="close" variant="outline" onPress={() => { setMessage(""); setOutcome(null); setError(""); }} style={s.flex} /> : null}
        </View>
        {error ? <Notice tone="danger" icon="alert-circle">{error}</Notice> : null}
        <Button title={busy ? "Analyzing…" : "Analyze message"} icon="shield-checkmark-outline" busy={busy} onPress={analyze} />
        <Body small muted>Try an example:</Body>
        <View style={s.examples}>
          {Object.entries(EXAMPLES).map(([label, text]) => <Button key={label} small variant="outline" title={label} onPress={() => { setMessage(text); setOutcome(null); }} />)}
        </View>
      </Card>
      <Notice icon="lock-closed-outline">Your message is checked by ScamShield only, never by an outside AI service. Links are never opened. Remove PINs, passwords and account numbers first.</Notice>
      {!!outcome && (
        <View onLayout={event => { resultY.current = event.nativeEvent.layout.y; }}>
          <MessageResult item={outcome.item} result={outcome.result} />
        </View>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: "row", gap: space.sm },
  count: { fontSize: 12, color: colors.muted, textAlign: "right" },
  examples: { flexDirection: "row", flexWrap: "wrap", gap: space.sm }
});
