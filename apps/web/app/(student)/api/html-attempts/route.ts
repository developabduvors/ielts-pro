import { NextResponse } from "next/server";
import { createServerSupabaseClient, getPublishedTaskByIdForStudent, getStudentById, submitAttempt } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";

// Receives a score posted by an uploaded HTML test (via the injected bridge).
// Auth comes from the same-origin HTTP-only student cookie.
export async function POST(request: Request) {
  const session = await requireStudentSession();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const taskId = String(body.taskId || "");
  if (!taskId) return NextResponse.json({ ok: false, error: "Missing taskId." }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const student = await getStudentById(supabase, session.id);
  const groupId = student?.group_id ?? session.group_id;
  const task = await getPublishedTaskByIdForStudent(supabase, taskId, groupId);
  if (!task || task.source_type !== "html") {
    return NextResponse.json({ ok: false, error: "Test unavailable." }, { status: 404 });
  }

  const score = toCount(body.score);
  const total = toCount(body.total);

  await submitAttempt(supabase, {
    studentId: session.id,
    taskId,
    answer: JSON.stringify(body.answers ?? {}),
    score,
    total
  });

  return NextResponse.json({ ok: true, score, total });
}

function toCount(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.round(parsed));
}
