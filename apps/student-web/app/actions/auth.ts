"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerSupabaseClient, createStudentDeviceSession, getOpenStudentByAccessId, getStudentDeviceSessions, touchStudentLogin } from "@ielts-pro/shared";
import { clearStudentSession, createStudentSessionToken, hashStudentSessionToken, setStudentSession } from "@/lib/session";

export async function studentLogin(_: { error?: string } | undefined, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim();
  if (!name || !code) return { error: "Enter your full name and Student Access ID." };

  try {
    const supabase = createServerSupabaseClient();
    const { student, reason } = await getOpenStudentByAccessId(supabase, name, code);
    if (!student && reason === "closed") return { error: "This Student Access ID is closed. Contact your teacher." };
    if (!student) return { error: "Student was not found. Check the name and access ID from your teacher." };
    if (student.max_devices && student.max_devices > 0) {
      const activeSessions = (await getStudentDeviceSessions(supabase, student.id)).filter((session) => session.is_active !== false && !session.revoked_at);
      if (activeSessions.length >= student.max_devices) {
        return { error: "This Student Access ID has reached its device limit. Ask your teacher to revoke an old device." };
      }
    }
    const token = createStudentSessionToken();
    const requestHeaders = await headers();
    const deviceSession = await createStudentDeviceSession(supabase, {
      studentId: student.id,
      sessionTokenHash: hashStudentSessionToken(token),
      userAgent: requestHeaders.get("user-agent"),
      deviceLabel: "Student browser"
    });
    await touchStudentLogin(supabase, student.id);
    await setStudentSession({
      id: student.id,
      name: student.name,
      student_code: student.student_code,
      group_id: student.group_id,
      device_session_id: deviceSession.id,
      session_token: token
    });
  } catch (error) {
    console.error("Student login failed", error);
    return { error: "Student access setup is not finished yet. Ask the admin to apply the Supabase migration, then try again." };
  }

  redirect("/dashboard");
}

export async function studentLogout() {
  await clearStudentSession();
  redirect("/");
}
