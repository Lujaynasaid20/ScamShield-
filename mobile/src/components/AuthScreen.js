import { Ionicons } from "@expo/vector-icons";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, space } from "@/theme";

// Branded frame for the sign-in and registration screens.
export default function AuthScreen({ title, subtitle, children }) {
  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.brand} accessible accessibilityLabel="ScamShield">
            <View style={s.mark}><Ionicons name="shield-checkmark" size={26} color="#fff" /></View>
            <Text style={s.brandText}>ScamShield</Text>
          </View>
          <View style={s.card}>
            <Text style={s.title} accessibilityRole="header">{title}</Text>
            {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
            {children}
          </View>
          <Text style={s.footer}>Check suspicious messages, links and senders before you act.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy900 },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: space.lg, gap: space.lg },
  brand: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm },
  mark: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.blue600, alignItems: "center", justifyContent: "center" },
  brandText: { color: "#fff", fontSize: 26, fontWeight: "800" },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: space.xl, gap: space.md },
  title: { fontSize: 24, fontWeight: "700", color: colors.ink },
  subtitle: { fontSize: 15, color: colors.muted, lineHeight: 21 },
  footer: { color: "#9fb2d9", textAlign: "center", fontSize: 14 }
});
