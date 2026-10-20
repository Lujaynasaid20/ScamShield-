import { Alert } from "react-native";
import { api } from "@/api/client";

// Shared confirm-then-act flows.
export function confirmClearHistory(onDone) {
  Alert.alert("Clear all history?", "Every saved message, link and sender check will be deleted, on the app and the website. Your scam reports are kept.", [
    { text: "Cancel", style: "cancel" },
    { text: "Clear history", style: "destructive", onPress: async () => {
      try { await api("/api/history", { method: "DELETE" }); onDone?.(); } catch (error) { Alert.alert("Couldn't clear history", error.message); }
    } }
  ]);
}
