"use server";

import { revalidatePath } from "next/cache";
import { createLesson, createServerSupabaseClient, reviewWritingSubmission, updateLesson } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/session";

export async function createLessonAction(formData: FormData) {
  await requireAdminSession();
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  await createLesson(createServerSupabaseClient(), {
    title,
    description: String(formData.get("description") || "").trim() || null,
    order: Number(formData.get("order") || 1),
    published: formData.get("published") === "on",
    skill: String(formData.get("skill") || "reading")
  });
  revalidatePath("/lessons");
  revalidatePath("/dashboard");
}

export async function toggleLessonPublishAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") || "");
  const published = String(formData.get("published") || "") === "true";
  if (!id) return;
  await updateLesson(createServerSupabaseClient(), id, { published: !published });
  revalidatePath("/lessons");
  revalidatePath("/dashboard");
}

export async function reviewSubmissionAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") || "");
  const scoreValue = String(formData.get("score") || "").trim();
  if (!id) return;
  await reviewWritingSubmission(createServerSupabaseClient(), id, {
    score: scoreValue ? Number(scoreValue) : null,
    feedback: String(formData.get("feedback") || "").trim() || null
  });
  revalidatePath("/submissions");
  revalidatePath("/dashboard");
}
