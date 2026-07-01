import Link from "next/link";
import { Badge, EmptyState, TestCard } from "@ielts-pro/ui";
import { createServerSupabaseClient, getStudentSubmissions } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../components/StudentShell";

export default async function ProgressPage() {
  const session = await requireStudentSession();
  const submissions = await getStudentSubmissions(createServerSupabaseClient(), session.id);

  return (
    <StudentShell name={session.name}>
      <main className="page">
        <div className="section-head page-title">
          <div>
            <p className="eyebrow">Results history</p>
            <h1>Your attempts and teacher feedback</h1>
            <p className="muted">Reviewed writing and scored objective tasks stay here for follow-up lessons.</p>
          </div>
          <Link href="/practice" className="btn btn-secondary">Back to practice</Link>
        </div>
        <div className="test-list">
          {submissions.map((submission) => (
            <TestCard
              key={submission.id}
              tone={toneFor(submission.tasks?.skill)}
              meta={submission.tasks?.skill || "task"}
              title={submission.tasks?.title || "Practice task"}
              description={submission.feedback ? `Feedback: ${submission.feedback}` : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(submission.submitted_at))}
              status={submission.score != null ? <strong className="score-pill">{submission.score}/{submission.total ?? "band"}</strong> : <Badge tone="warning">Pending review</Badge>}
            />
          ))}
          {!submissions.length ? <EmptyState title="No submissions yet" body="Completed reading, listening, and writing tasks will appear here." /> : null}
        </div>
      </main>
    </StudentShell>
  );
}

function toneFor(skill?: string) {
  if (skill === "reading") return "reading";
  if (skill === "listening") return "listening";
  if (skill === "writing") return "writing";
  if (skill === "full_test") return "full";
  return "neutral";
}
