import { NextResponse } from "next/server";
import { createServerSupabaseClient, getWritingSubmissions } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/admin-session";

export async function GET() {
  await requireAdminSession();
  const submissions = await getWritingSubmissions(createServerSupabaseClient());
  const rows = [
    ["student", "access_id", "task", "skill", "lesson", "score", "total", "feedback", "submitted_at", "answer"],
    ...submissions.map((submission) => [
      submission.students?.name || "",
      submission.students?.student_code || "",
      submission.tasks?.title || "",
      submission.tasks?.skill || "",
      submission.tasks?.lessons?.title || "",
      submission.score ?? "",
      submission.total ?? "",
      submission.feedback || "",
      submission.submitted_at,
      submission.answer || ""
    ])
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ielts-submissions-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}
