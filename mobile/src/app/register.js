import { Link } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useSession } from "@/auth/session";
import AuthScreen from "@/components/AuthScreen";
import { Button, Field, Notice } from "@/components/ui";
import { colors } from "@/theme";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const { register } = useSession();
  const [form, setForm] = useState({ displayName: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);
  const set = key => value => setForm(current => ({ ...current, [key]: value }));

  const submit = async () => {
    setError("");
    const next = {};
    if (form.displayName.trim().length < 2) next.displayName = "Enter a name between 2 and 120 characters.";
    if (!EMAIL.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (form.password.length < 8) next.password = "Password must be at least 8 characters.";
    if (form.confirm !== form.password) next.confirm = "The passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await register({ displayName: form.displayName.trim(), email: form.email.trim(), password: form.password });
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  };

  return (
    <AuthScreen title="Create your account" subtitle="Your account works in the app and on the ScamShield website.">
      <Field label="Name" value={form.displayName} onChangeText={set("displayName")} error={errors.displayName} autoComplete="name" textContentType="name" maxLength={120} returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} />
      <Field ref={emailRef} label="Email" value={form.email} onChangeText={set("email")} error={errors.email} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} />
      <Field ref={passwordRef} label="Password" hint="At least 8 characters." value={form.password} onChangeText={set("password")} error={errors.password} secureTextEntry autoComplete="new-password" textContentType="newPassword" maxLength={200} returnKeyType="next" onSubmitEditing={() => confirmRef.current?.focus()} />
      <Field ref={confirmRef} label="Confirm password" value={form.confirm} onChangeText={set("confirm")} error={errors.confirm} secureTextEntry autoComplete="new-password" textContentType="newPassword" maxLength={200} returnKeyType="go" onSubmitEditing={submit} />
      {error ? <Notice tone="danger" icon="alert-circle">{error}</Notice> : null}
      <Button title="Create account" icon="person-add-outline" busy={busy} onPress={submit} />
      <Text style={s.switch}>Already have an account? <Link href="/login" replace style={s.link}>Log in</Link></Text>
    </AuthScreen>
  );
}

const s = StyleSheet.create({
  switch: { textAlign: "center", fontSize: 15, color: colors.ink2 },
  link: { color: colors.blue700, fontWeight: "700" }
});
