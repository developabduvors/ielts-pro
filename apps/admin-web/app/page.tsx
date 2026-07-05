import { redirect } from "next/navigation";
import { AdminLoginForm } from "./AdminLoginForm";
import { clearAdminSession, getAdminSession, hasAdminSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/dashboard");

  if (await hasAdminSessionCookie()) {
    await clearAdminSession();
  }

  return <AdminLoginForm />;
}
