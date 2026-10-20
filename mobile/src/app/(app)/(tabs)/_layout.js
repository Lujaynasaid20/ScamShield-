import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "@/theme";

const TABS = [
  ["index", "Home", "home"],
  ["scan", "Scan", "chatbox-ellipses"],
  ["check", "Check", "search"],
  ["reports", "Reports", "flag"],
  ["account", "Account", "person-circle"]
];

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: colors.blue700,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
      tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      headerStyle: { backgroundColor: colors.surface },
      headerTitleStyle: { color: colors.ink, fontWeight: "700" },
      sceneStyle: { backgroundColor: colors.bg }
    }}>
      {TABS.map(([name, title, icon]) => (
        <Tabs.Screen key={name} name={name} options={{
          title: name === "index" ? "ScamShield" : title,
          tabBarLabel: title,
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? icon : `${icon}-outline`} size={24} color={color} />
        }} />
      ))}
    </Tabs>
  );
}
