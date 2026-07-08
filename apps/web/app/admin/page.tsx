import { redirect } from "next/navigation";
import { AdminLoginForm } from "./AdminLoginForm";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin/dashboard");

  return <AdminLoginForm />;
}
