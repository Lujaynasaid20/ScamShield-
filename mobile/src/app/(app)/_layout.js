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
      <Stack.Screen name="history/[id]" options={{ title: "Result" }} />
    </Stack>
  );
}
