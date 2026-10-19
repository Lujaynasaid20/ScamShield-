import AppShell from "@/components/AppShell";
import { requirePageRole } from "@/lib/session-guard";

export default async function UserLayout({ children }) {
  const profile = await requirePageRole("user");
  return <AppShell profile={profile}>{children}</AppShell>;
}
