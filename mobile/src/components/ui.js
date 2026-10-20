// Shared building blocks: screens, cards, buttons, inputs, badges and loading/empty/error states.
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, space, tones } from "@/theme";

export function Screen({ children, refreshing, onRefresh, contentStyle, ...props }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.screenContent, contentStyle]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.blue600} /> : undefined}
      {...props}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Heading({ children, level = 2, style }) {
  return <Text accessibilityRole="header" style={[level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3, style]}>{children}</Text>;
}

export function Body({ children, muted, small, style, ...props }) {
  return <Text style={[styles.body, muted && styles.muted, small && styles.small, style]} {...props}>{children}</Text>;
}

const BUTTON_VARIANTS = {
  primary: { bg: colors.blue600, fg: "#fff", border: colors.blue600 },
  navy: { bg: colors.navy800, fg: "#fff", border: colors.navy800 },
  outline: { bg: colors.surface, fg: colors.ink2, border: colors.lineStrong },
  danger: { bg: colors.dangerBg, fg: colors.dangerText, border: "#f5c6c0" }
};

export function Button({ title, onPress, variant = "primary", icon, busy, disabled, small, style, accessibilityLabel }) {
  const look = BUTTON_VARIANTS[variant];
  const inactive = disabled || busy;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: inactive, busy: Boolean(busy) }}
      style={({ pressed }) => [styles.button, small && styles.buttonSmall, { backgroundColor: look.bg, borderColor: look.border }, inactive && styles.disabled, pressed && styles.pressed, style]}
    >
      {busy ? <ActivityIndicator color={look.fg} size="small" /> : icon ? <Ionicons name={icon} size={small ? 16 : 18} color={look.fg} /> : null}
      <Text style={[styles.buttonText, small && styles.buttonTextSmall, { color: look.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, hint, error, style, multiline, ref, ...props }) {
  return (
    <View style={styles.field}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.inputMultiline, error && styles.inputError, style]}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        accessibilityLabel={label}
        accessibilityHint={hint}
        {...props}
      />
      {!!(hint && !error) && <Text style={styles.hint}>{hint}</Text>}
      {!!error && <Text style={styles.errorText} accessibilityLiveRegion="polite">{error}</Text>}
    </View>
  );
}

export function Badge({ tone = "neutral", icon, label, style }) {
  const look = tones[tone] || tones.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: look.bg }, style]}>
      {!!icon && <Ionicons name={icon} size={14} color={look.fg} />}
      <Text style={[styles.badgeText, { color: look.fg }]}>{label}</Text>
    </View>
  );
}

// Scam / Suspicious / Safe, worded per check type like the website (a sender with no reports is not "safe").
const VERDICTS = {
  scam: { tone: "danger", icon: "close-circle", label: "Scam" },
  suspicious: { tone: "warn", icon: "warning", label: "Suspicious" },
  safe: { tone: "safe", icon: "checkmark-circle", label: "Safe" }
};
export function VerdictBadge({ verdict, kind, label }) {
  const style = VERDICTS[verdict] || VERDICTS.safe;
  let text = label || style.label;
  let tone = style.tone;
  let icon = style.icon;
  if (kind === "sender") {
    text = verdict === "scam" ? "Verified reports" : verdict === "suspicious" ? "Reported" : "No reports";
    if (verdict === "safe") { tone = "neutral"; icon = "search"; }
  } else if (kind === "url" && verdict === "safe") text = "No warning signs";
  else if (kind === "url" && verdict === "scam") text = "High risk";
  return <Badge tone={tone} icon={icon} label={text} />;
}

const REPORT_STATUS = {
  submitted: { tone: "info", icon: "send-outline", label: "Submitted" },
  under_review: { tone: "warn", icon: "hourglass-outline", label: "Under review" },
  verified: { tone: "danger", icon: "checkmark-done-circle", label: "Verified" },
  rejected: { tone: "neutral", icon: "close-circle-outline", label: "Rejected" },
  resolved: { tone: "safe", icon: "checkmark-done", label: "Resolved" }
};
export function StatusBadge({ status }) {
  const style = REPORT_STATUS[status] || REPORT_STATUS.submitted;
  return <Badge tone={style.tone} icon={style.icon} label={style.label} />;
}

export function Notice({ tone = "info", icon = "information-circle", children, style }) {
  const look = tones[tone] || tones.info;
  return (
    <View style={[styles.notice, { backgroundColor: look.bg }, style]} accessibilityRole="text">
      <Ionicons name={icon} size={20} color={look.fg} style={styles.noticeIcon} />
      <View style={styles.flex}>{typeof children === "string" ? <Text style={[styles.noticeText, { color: look.fg }]}>{children}</Text> : children}</View>
    </View>
  );
}

export function Loading({ label = "Loading…" }) {
  return (
    <View style={styles.centered} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.blue600} size="large" />
      <Text style={[styles.muted, styles.small, { marginTop: space.sm }]}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <Card style={styles.centeredCard}>
      <Ionicons name="cloud-offline-outline" size={32} color={colors.dangerText} />
      <Text style={[styles.h3, { textAlign: "center" }]}>Something went wrong</Text>
      <Text style={[styles.body, styles.muted, { textAlign: "center" }]}>{message}</Text>
      {!!onRetry && <Button title="Try again" icon="refresh" variant="outline" onPress={onRetry} style={{ marginTop: space.sm }} />}
    </Card>
  );
}

export function EmptyState({ icon = "file-tray-outline", title, body, action }) {
  return (
    <Card style={styles.centeredCard}>
      <Ionicons name={icon} size={32} color={colors.muted} />
      <Text style={[styles.h3, { textAlign: "center" }]}>{title}</Text>
      {!!body && <Text style={[styles.body, styles.muted, { textAlign: "center" }]}>{body}</Text>}
      {action}
    </Card>
  );
}

export function Row({ icon, title, subtitle, right, onPress, accessibilityLabel }) {
  const content = (
    <>
      {!!icon && <View style={styles.rowIcon}><Ionicons name={icon} size={18} color={colors.blue700} /></View>}
      <View style={styles.flex}>
        <Text style={styles.rowTitle} numberOfLines={2}>{title}</Text>
        {subtitle ? <Text style={[styles.small, styles.muted]} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {right}
      {!!onPress && <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel || title} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map(([key, label, icon]) => {
        const selected = key === value;
        return (
          <Pressable key={key} onPress={() => onChange(key)} accessibilityRole="tab" accessibilityState={{ selected }} style={[styles.segment, selected && styles.segmentSelected]}>
            {!!icon && <Ionicons name={icon} size={16} color={selected ? colors.blue700 : colors.muted} />}
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  flex: { flex: 1, minWidth: 0 },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.sm },
  h1: { fontSize: 26, fontWeight: "700", color: colors.ink },
  h2: { fontSize: 19, fontWeight: "700", color: colors.ink },
  h3: { fontSize: 16, fontWeight: "700", color: colors.ink },
  body: { fontSize: 15, lineHeight: 22, color: colors.ink2 },
  muted: { color: colors.muted },
  small: { fontSize: 13, lineHeight: 18 },
  button: { minHeight: 48, borderRadius: radius.sm, borderWidth: 1, paddingHorizontal: space.lg, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm },
  buttonSmall: { minHeight: 38, paddingHorizontal: space.md },
  buttonText: { fontSize: 16, fontWeight: "700" },
  buttonTextSmall: { fontSize: 14 },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.75 },
  field: { gap: space.xs },
  label: { fontSize: 14, fontWeight: "700", color: colors.ink2 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: radius.sm, paddingHorizontal: space.md, paddingVertical: space.sm, fontSize: 16, color: colors.ink, backgroundColor: colors.surface },
  inputMultiline: { minHeight: 140, paddingTop: space.md },
  inputError: { borderColor: colors.dangerText },
  hint: { fontSize: 13, color: colors.muted },
  errorText: { fontSize: 13, color: colors.dangerText, fontWeight: "600" },
  badge: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 4, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 13, fontWeight: "700" },
  notice: { flexDirection: "row", gap: space.sm, borderRadius: radius.sm, padding: space.md },
  noticeIcon: { marginTop: 1 },
  noticeText: { fontSize: 14, lineHeight: 20 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: space.xl },
  centeredCard: { alignItems: "center", gap: space.sm, paddingVertical: space.xl },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, minHeight: 48 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.blue50, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 15, fontWeight: "600", color: colors.ink },
  segmented: { flexDirection: "row", backgroundColor: colors.neutralBg, borderRadius: radius.sm, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 40, paddingHorizontal: 4, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  segmentSelected: { backgroundColor: colors.surface },
  segmentText: { fontSize: 14, fontWeight: "600", color: colors.muted },
  segmentTextSelected: { color: colors.blue700 }
});
