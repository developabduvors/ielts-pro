import Link from "next/link";
import { Badge, Button, Card, EmptyState, ErrorState, Input, StatCard, Textarea } from "@ielts-pro/ui";
import { createServerSupabaseClient, getWritingSubmissions } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminShell } from "../components/AdminShell";
import { reviewSubmissionAction } from "../actions/lms";

export default async function SubmissionsPage() {
  const admin = await requireAdminSession();
  const submissions = await getSubmissionsSafely();
  if (!submissions) {
    return (
      <AdminShell email={admin.email}>
        <div className="page-head page-head-hero">
          <div>
            <p className="eyebrow">Review queue</p>
            <h1>Writing review desk</h1>
            <p className="muted">The admin route loaded, but Supabase did not return the submissions query.</p>
          </div>
        </div>
        <Card className="panel">
          <ErrorState title="Submissions are unavailable" body="Apply the latest Supabase migration, then refresh this page. This screen is intentionally not crashing to a blank Vercel error." />
        </Card>
      </AdminShell>
    );
  }
  const writing = submissions.filter((submission) => submission.tasks?.skill === "writing");
  const pending = writing.filter((submission) => submission.score == null);
  const reviewed = writing.filter((submission) => submission.score != null);
  return (
    <AdminShell email={admin.email}>
      <div className="page-head page-head-hero">
        <div>
          <p className="eyebrow">Review queue</p>
          <h1>Writing review desk</h1>
          <p className="muted">Read student responses, assign a band, and leave clear next-step feedback without losing the queue context.</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/admin/submissions/export">Export CSV</Link>
        </div>
      </div>

      <section className="stats-grid writing-review-stats" aria-label="Writing review summary">
        <StatCard label="Pending" value={pending.length} note="needs teacher score" />
        <StatCard label="Reviewed" value={reviewed.length} note="feedback saved" />
        <StatCard label="Total writing" value={writing.length} note="submitted attempts" />
        <StatCard label="All attempts" value={submissions.length} note="reading/listening/writing" />
      </section>

      <div className="lesson-list">
        {writing.map((submission) => (
          <Card className="panel writing-review-card" key={submission.id}>
            <div className="writing-review-head">
              <div>
                <Badge tone={submission.score == null ? "warning" : "success"}>{submission.score == null ? "Pending" : "Reviewed"}</Badge>
                <h2>{submission.students?.name || "Student"} - {submission.tasks?.title || "Writing task"}</h2>
                <p className="muted">{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(submission.submitted_at))}</p>
              </div>
              <div className="review-score-chip">
                <span>Band</span>
                <strong>{submission.score ?? "-"}</strong>
              </div>
            </div>
            <div className="review-workspace">
              <div>
                <p className="eyebrow">Student answer</p>
                <div className="answer-box">{submission.answer || "No answer text saved."}</div>
              </div>
              <form action={reviewSubmissionAction} className="form-stack review-form">
              <input type="hidden" name="id" value={submission.id} />
              <label>Band Score<Input name="score" type="number" min="1" max="9" step="0.5" defaultValue={submission.score ?? ""} /></label>
              <label>Teacher Feedback<Textarea name="feedback" defaultValue={submission.feedback ?? ""} /></label>
              <Button>Save review</Button>
            </form>
            </div>
          </Card>
        ))}
        {!writing.length ? <EmptyState title="No writing submissions yet" body="Writing attempts will appear here after students submit a writing task." /> : null}
      </div>
    </AdminShell>
  );
}

async function getSubmissionsSafely() {
  try {
    return await getWritingSubmissions(createServerSupabaseClient());
  } catch (error) {
    console.error("Writing submissions failed", error);
    return null;
  }
}
