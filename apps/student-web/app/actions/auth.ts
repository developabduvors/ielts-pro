"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient, getStudentByCode } from "@ielts-pro/shared";
import { clearStudentSession, setStudentSession } from "@/lib/session";

export async function studentLogin(_: { error?: string } | undefined, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim();
  if (!name || !code) return { error: "Enter your full name and student ID." };

  try {
    const student = await getStudentByCode(createServerSupabaseClient(), name, code);
    if (!student) return { error: "Student was not found. Check the name and ID from your teacher." };
    await setStudentSession({
      id: student.id,
      name: student.name,
      student_code: student.student_code,
      group_id: student.group_id
    });
  } catch {
    return { error: "Login is temporarily unavailable. Try again or contact your teacher." };
  }

  redirect("/dashboard");
}

export async function studentLogout() {
  await clearStudentSession();
  redirect("/");
}
