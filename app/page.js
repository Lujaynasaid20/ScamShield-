import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server";

export default async function Home() {
  const profile = await getCurrentUser();
  redirect(!profile ? "/login" : profile.role === "admin" ? "/admin" : "/overview");
}
