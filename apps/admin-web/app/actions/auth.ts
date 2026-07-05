"use server";

import { redirect } from "next/navigation";
import { createAnonSupabaseClient } from "@ielts-pro/shared";
import { clearAdminSession, isAllowedAdmin, setAdminSession } from "@/lib/session";

export async function adminLogin(_: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "Enter admin email and password." };
  if (!isAllowedAdmin(email)) return { error: "This email is not configured as an admin." };

  let supabase: ReturnType<typeof createAnonSupabaseClient>;
  try {
    supabase = createAnonSupabaseClient();
  } catch {
    return { error: "Admin Supabase config is missing. Add the Supabase URL and anon key, then redeploy." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user?.email) return { error: "Incorrect email or password." };
  if (!isAllowedAdmin(data.user.email)) return { error: "This user is not allowed to access the admin workspace." };

  await setAdminSession({ id: data.user.id, email: data.user.email });
  redirect("/dashboard");
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/");
}
