"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient, getPublishedTaskById, gradeQuestions, parseTaskContent, submitAttempt, type TaskContent } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";

export async function submitTaskAttempt(formData: FormData) {
  const session = await requireStudentSession();
  const taskId = String(formData.get("taskId") || "");
  const supabase = createServerSupabaseClient();
  const task = await getPublishedTaskById(supabase, taskId);
  if (!task) redirect("/dashboard?error=unavailable");

  const content = parseTaskContent<TaskContent>(task.content, { questions: [] });

  if (task.skill === "writing") {
    const answer = String(formData.get("writing_answer") || "").trim();
    if (!answer) redirect(`/tests/${taskId}?error=empty`);
    await submitAttempt(supabase, { studentId: session.id, taskId, answer });
    redirect("/progress?submitted=writing");
  }

  const answers: Record<string, unknown> = {};
  (content.questions || []).forEach((question, index) => {
    if (question.type === "matching" || question.items?.length) {
      const itemAnswers: Record<string, string> = {};
      question.items?.forEach((_, itemIndex) => {
        itemAnswers[String(itemIndex)] = String(formData.get(`q_${index}_${itemIndex}`) || "").trim();
      });
      answers[String(index)] = itemAnswers;
      return;
    }
    if (question.type === "mcq_multi") {
      answers[String(index)] = formData.getAll(`q_${index}`).map(String);
      return;
    }
    answers[String(index)] = String(formData.get(`q_${index}`) || "").trim();
  });

  const { correct, total } = gradeQuestions(content.questions || [], answers);
  await submitAttempt(supabase, {
    studentId: session.id,
    taskId,
    answer: JSON.stringify(answers),
    score: correct,
    total
  });
  redirect("/progress?submitted=test");
}
