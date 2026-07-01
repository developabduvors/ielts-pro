"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient, getPublishedTaskById, gradeQuestions, parseTaskContent, submitAttempt, type Question, type TaskContent } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";

export async function submitTaskAttempt(formData: FormData) {
  const session = await requireStudentSession();
  const taskId = String(formData.get("taskId") || "");
  const supabase = createServerSupabaseClient();
  const task = await getPublishedTaskById(supabase, taskId);
  if (!task) redirect("/dashboard?error=unavailable");

  const content = parseTaskContent<TaskContent>(task.content, { questions: [] });
  const questions = flattenQuestions(content);

  if (task.skill === "writing") {
    const answer = String(formData.get("writing_answer") || "").trim();
    if (!answer) redirect(`/tests/${taskId}?error=empty`);
    await submitAttempt(supabase, { studentId: session.id, taskId, answer });
    redirect("/progress?submitted=writing");
  }

  const answers: Record<string, unknown> = {};
  questions.forEach((question, index) => {
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

  const { correct, total } = gradeQuestions(questions, answers);
  const fullWritingAnswer = String(formData.get("full_writing_answer") || "").trim();
  if (task.skill === "full_test" && fullWritingAnswer) {
    answers.writing_response = fullWritingAnswer;
  }
  await submitAttempt(supabase, {
    studentId: session.id,
    taskId,
    answer: JSON.stringify(answers),
    score: correct,
    total
  });
  redirect("/progress?submitted=test");
}

function flattenQuestions(content: TaskContent): Question[] {
  return [
    ...(content.questions || []),
    ...((content.sections || []).flatMap((section) => section.questions || []))
  ];
}
