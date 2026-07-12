"use server";

import { buildRenderableQuestions, createServerSupabaseClient, getPublishedTaskByIdForStudent, getStudentById, gradeQuestions, parseTaskContent, submitAttempt, type TaskContent } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";

export async function submitTaskAttempt(formData: FormData): Promise<{
  ok: boolean;
  score?: number;
  total?: number;
  details?: Array<{ questionIndex: number; subIndex?: number; isCorrect: boolean | null; your: string; right: string }>;
  redirect?: string;
  error?: string;
}> {
  const session = await requireStudentSession();
  const taskId = String(formData.get("taskId") || "");
  const timeTakenRaw = Number(formData.get("timeTaken"));
  const timeTaken = Number.isFinite(timeTakenRaw) ? Math.round(timeTakenRaw) : null;
  const supabase = createServerSupabaseClient();
  const student = await getStudentById(supabase, session.id);
  const task = await getPublishedTaskByIdForStudent(supabase, taskId);
  if (!task) return { ok: false, error: "unavailable" };

  const content = parseTaskContent<TaskContent>(task.content, { questions: [] });
  const questions = buildRenderableQuestions(content, task);

  if (task.skill === "writing") {
    const answer = String(formData.get("writing_answer") || "").trim();
    if (!answer) return { ok: false, error: "empty" };
    await submitAttempt(supabase, { studentId: session.id, taskId, answer, timeTaken });
    return { ok: true, redirect: "/results?submitted=writing" };
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

  const { correct, total, details } = gradeQuestions(questions, answers);
  const fullWritingAnswer = String(formData.get("full_writing_answer") || "").trim();
  if (task.skill === "full_test" && fullWritingAnswer) {
    answers.writing_response = fullWritingAnswer;
  }
  await submitAttempt(supabase, {
    studentId: session.id,
    taskId,
    answer: JSON.stringify(answers),
    score: correct,
    total,
    timeTaken
  });

  return { ok: true, score: correct, total, details };
}
