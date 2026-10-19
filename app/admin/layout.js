import AppShell from "@/components/AppShell";
import { requirePageRole } from "@/lib/session-guard";

export default async function AdminLayout({ children }) {
  const profile = await requirePageRole("admin");
  return <AppShell profile={profile}>{children}</AppShell>;
}
