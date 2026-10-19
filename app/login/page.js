import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/server";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const profile = await getCurrentUser();
  if (profile) redirect(profile.role === "admin" ? "/admin" : "/overview");
  return <AuthForm />;
}
