import { Stack } from "expo-router";
import { colors } from "@/theme";

export default function AppLayout() {
  return (
    <Stack screenOptions={{
      headerTintColor: colors.blue700,
      headerTitleStyle: { color: colors.ink, fontWeight: "700" },
      headerTransparent: false,
      headerStyle: { backgroundColor: colors.surface },
      headerBackButtonDisplayMode: "minimal",
      contentStyle: { backgroundColor: colors.bg }
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="history/index" options={{ title: "Scam history" }} />
      <Stack.Screen name="history/[id]" options={{ title: "Result" }} />
      <Stack.Screen name="reports/new" options={{ title: "Report a scam", presentation: "modal" }} />
      <Stack.Screen name="reports/[id]" options={{ title: "Report" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="academy/index" options={{ title: "Scam Awareness Academy" }} />
      <Stack.Screen name="academy/[id]" options={{ title: "Lesson" }} />
      <Stack.Screen name="settings/profile" options={{ title: "Profile" }} />
      <Stack.Screen name="settings/password" options={{ title: "Change password" }} />
      <Stack.Screen name="settings/two-factor" options={{ title: "Two-factor authentication" }} />
      <Stack.Screen name="settings/sessions" options={{ title: "Signed-in devices" }} />
      <Stack.Screen name="settings/notifications" options={{ title: "Notification settings" }} />
      <Stack.Screen name="settings/privacy" options={{ title: "Privacy and data" }} />
    </Stack>
  );
}
