import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@ielts-pro/shared";
import { getStudentSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getStudentSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const taskId = String(body.taskId || "");
  if (!taskId) return NextResponse.json({ ok: false, error: "Missing taskId." }, { status: 400 });

  const supabase = createServerSupabaseClient();

  console.log("[html-attempts] taskId:", taskId, "| studentId:", session.id);

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .maybeSingle();

  console.log("[html-attempts] task found:", !!task, "| source_type:", task?.source_type ?? "(none)", "| html_path:", task?.html_path ?? "(none)", "| error:", taskError?.message ?? "none");

  if (taskError || !task) {
    return NextResponse.json({ ok: false, error: "Test not found." }, { status: 404 });
  }

  const isHtml = task.source_type === "html" || !!task.html_path;
  if (!isHtml || task.archived_at) {
    return NextResponse.json({ ok: false, error: "Test unavailable." }, { status: 404 });
  }

  const score = toCount(body.score);
  const total = toCount(body.total);
  const timeTaken = toCount(body.timeTaken);

  const answers = body.answers ?? {};
  const results = Array.isArray(body.results) ? body.results : [];
  const answerStr = JSON.stringify({ answers, results });

  const { error: insertError } = await supabase
    .from("submissions")
    .insert({
      student_id: session.id,
      task_id: taskId,
      answer: answerStr,
      score,
      total,
      time_taken: timeTaken,
    });

  if (insertError) {
    const msg = insertError.message ?? JSON.stringify(insertError);
    console.error("[html-attempts] insert error:", msg);

    if (insertError.code === "42703" || msg.includes("does not exist") || msg.includes("Could not find")) {
      console.log("[html-attempts] column missing, retrying without total/time_taken");
      const { error: retryError } = await supabase
        .from("submissions")
        .insert({
          student_id: session.id,
          task_id: taskId,
          answer: answerStr,
          score,
        });
      if (retryError) {
        console.error("[html-attempts] retry also failed:", retryError.message ?? JSON.stringify(retryError));
        return NextResponse.json({ ok: false, error: retryError.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }
  }

  console.log("[html-attempts] saved:", { taskId, score, total, timeTaken, resultsCount: results.length });

  return NextResponse.json({ ok: true, score, total });
}

function toCount(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.round(parsed));
}
