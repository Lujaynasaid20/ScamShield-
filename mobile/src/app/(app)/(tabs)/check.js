import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { api } from "@/api/client";
import { SenderResult, UrlResult } from "@/components/results";
import { Body, Button, Card, Field, Notice, Screen, Segmented } from "@/components/ui";

const MODES = [["url", "Link", "link-outline"], ["sender", "Phone / sender", "call-outline"]];
const COPY = {
  url: {
    label: "Link to check", placeholder: "e.g. https://bit.ly/verify-account", button: "Scan link",
    intro: "ScamShield reads the address for warning signs and checks threat lists. The link is never opened.",
    keyboard: "url"
  },
  sender: {
    label: "Phone number, email or sender name", placeholder: "e.g. +255 754 123 456", button: "Check sender",
    intro: "See the country and network, whether it's a verified business contact, and what other users have reported. Include the country code, like +255.",
    keyboard: "default"
  }
};

export default function CheckScreen() {
  const params = useLocalSearchParams();
  const [mode, setMode] = useState(params.mode === "sender" ? "sender" : "url");
  const [values, setValues] = useState({ url: "", sender: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const scrollRef = useRef(null);
  const resultY = useRef(0);
  const copy = COPY[mode];

  const run = async (runMode = mode, value = values[runMode]) => {
    setError("");
    setOutcome(null);
    if (!value.trim()) { setError(runMode === "url" ? "Enter a link to scan." : "Enter a phone number, email address or sender name."); return; }
    setBusy(true);
    try {
      if (runMode === "url") {
        const { item } = await api("/api/scan-url", { method: "POST", body: { url: value.trim() } });
        setOutcome({ mode: "url", item });
      } else {
        const data = await api("/api/check-sender", { method: "POST", body: { value: value.trim() } });
        const item = data.item || { id: null, kind: "sender", input: data.result.display, verdict: { high: "scam", medium: "suspicious" }[data.result.riskLevel] || "safe", created_at: new Date().toISOString(), details: data.result };
        setOutcome({ mode: "sender", item, result: data.result });
      }
      setTimeout(() => scrollRef.current?.scrollTo({ y: resultY.current, animated: true }), 100);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  // Opened from another screen with a value ("Full link scan", "Check sender"): fill it in and check it.
  useEffect(() => {
    if (params.mode !== "url" && params.mode !== "sender") return;
    setMode(params.mode);
    if (params.value) {
      setValues(current => ({ ...current, [params.mode]: String(params.value) }));
      run(params.mode, String(params.value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.mode, params.value]);

  return (
    <Screen ref={scrollRef}>
      <Segmented options={MODES} value={mode} onChange={next => { setMode(next); setError(""); setOutcome(null); }} />
      <Card>
        <Body muted>{copy.intro}</Body>
        <Field
          label={copy.label}
          value={values[mode]}
          onChangeText={text => setValues(current => ({ ...current, [mode]: text }))}
          placeholder={copy.placeholder}
          keyboardType={copy.keyboard}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={mode === "url" ? 2048 : 200}
          returnKeyType="search"
          onSubmitEditing={() => run()}
        />
        {error ? <Notice tone="danger" icon="alert-circle">{error}</Notice> : null}
        <Button title={busy ? "Checking…" : copy.button} icon="search" busy={busy} onPress={() => run()} />
      </Card>
      {mode === "sender" && <Notice tone="warn" icon="warning-outline">Reports are allegations until an administrator verifies them, and scammers can fake numbers and names. ScamShield never shows private owners' names.</Notice>}
      {!!(outcome && outcome.mode === mode) && (
        <View onLayout={event => { resultY.current = event.nativeEvent.layout.y; }}>
          {outcome.mode === "url" ? <UrlResult item={outcome.item} /> : <SenderResult item={outcome.item} result={outcome.result} />}
        </View>
      )}
    </Screen>
  );
}
