import { redirect } from "next/navigation";
import { getCurrentUser, publicProfile } from "./server";

// Server-side page guards. The API enforces the same rules; these only decide which pages render.
export async function requirePageRole(role) {
  const profile = await getCurrentUser();
  if (!profile) redirect("/login");
  if (role && profile.role !== role) redirect(profile.role === "admin" ? "/admin" : "/overview");
  return publicProfile(profile);
}
