import { Link } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useSession } from "@/auth/session";
import AuthScreen from "@/components/AuthScreen";
import { Button, Field, Notice } from "@/components/ui";
import { colors } from "@/theme";

export default function LoginScreen() {
  const { signIn, notice } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef(null);

  const submit = async () => {
    setError("");
    if (!email.trim() || !password) { setError("Enter your email and password."); return; }
    if (needsCode && !/^\d{6}$/.test(code.trim())) { setError("Enter the 6-digit code from your authenticator app."); return; }
    setBusy(true);
    try {
      const result = await signIn({ email: email.trim(), password, code: needsCode ? code.trim() : undefined });
      if (result.twoFactorRequired) setNeedsCode(true);
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.data?.two_factor_required) setNeedsCode(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen title={needsCode ? "Two-factor verification" : "Log in"} subtitle={needsCode ? "Enter the 6-digit code from your authenticator app." : "Use the same account as the ScamShield website."}>
      {notice ? <Notice tone="warn" icon="time-outline">{notice}</Notice> : null}
      {!needsCode ? (
        <>
          <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} />
          <Field ref={passwordRef} label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={submit} />
        </>
      ) : (
        <Field label="Verification code" value={code} onChangeText={setCode} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" maxLength={6} autoFocus returnKeyType="go" onSubmitEditing={submit} />
      )}
      {error ? <Notice tone="danger" icon="alert-circle">{error}</Notice> : null}
      <Button title={needsCode ? "Verify and log in" : "Log in"} icon="log-in-outline" busy={busy} onPress={submit} />
      {needsCode
        ? <Button title="Back" variant="outline" onPress={() => { setNeedsCode(false); setCode(""); setError(""); }} />
        : <Text style={s.switch}>New to ScamShield? <Link href="/register" replace style={s.link}>Create an account</Link></Text>}
      <Text style={s.small}>Administrators: please use the ScamShield website.</Text>
    </AuthScreen>
  );
}

const s = StyleSheet.create({
  switch: { textAlign: "center", fontSize: 15, color: colors.ink2 },
  link: { color: colors.blue700, fontWeight: "700" },
  small: { textAlign: "center", fontSize: 13, color: colors.muted }
});
