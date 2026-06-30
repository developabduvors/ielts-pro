import Link from "next/link";
import { Badge, Card, EmptyState } from "@ielts-pro/ui";
import { createServerSupabaseClient, getStudentSubmissions } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";

export default async function ProgressPage() {
  const session = await requireStudentSession();
  const submissions = await getStudentSubmissions(createServerSupabaseClient(), session.id);

  return (
    <main className="page">
      <div className="section-head">
        <div>
          <p className="eyebrow">Progress</p>
          <h1>Your Attempts & Feedback</h1>
        </div>
        <Link href="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
      </div>
      <div className="test-list">
        {submissions.map((submission) => (
          <Card className="test-card" key={submission.id}>
            <div>
              <Badge tone={submission.tasks?.skill === "writing" ? "writing" : "success"}>{submission.tasks?.skill || "task"}</Badge>
              <h3>{submission.tasks?.title || "Practice task"}</h3>
              <p>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(submission.submitted_at))}</p>
              {submission.feedback ? <p><strong>Feedback:</strong> {submission.feedback}</p> : null}
            </div>
            <div>{submission.score != null ? <strong>{submission.score}/{submission.total ?? "band"}</strong> : <Badge tone="warning">Pending review</Badge>}</div>
          </Card>
        ))}
        {!submissions.length ? <EmptyState title="No submissions yet" body="Completed reading, listening, and writing tasks will appear here." /> : null}
      </div>
    </main>
  );
}
