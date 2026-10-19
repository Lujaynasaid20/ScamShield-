import AppShell from "@/components/AppShell";
import { requirePageRole } from "@/lib/session-guard";

// Notifications and settings are available to users and administrators.
export default async function AccountLayout({ children }) {
  const profile = await requirePageRole(null);
  return <AppShell profile={profile}>{children}</AppShell>;
}
