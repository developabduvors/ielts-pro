import { Badge, Button, Card, Input, Table, Textarea } from "@ielts-pro/ui";
import { createServerSupabaseClient, getWritingSubmissions } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "../components/AdminShell";
import { reviewSubmissionAction } from "../actions/lms";

export default async function SubmissionsPage() {
  const admin = await requireAdminSession();
  const submissions = await getWritingSubmissions(createServerSupabaseClient());
  const writing = submissions.filter((submission) => submission.tasks?.skill === "writing");
  return (
    <AdminShell email={admin.email}>
      <div className="page-head">
        <div><p className="eyebrow">Review</p><h1>Writing Submissions</h1></div>
      </div>
      <div className="lesson-list">
        {writing.map((submission) => (
          <Card className="panel" key={submission.id}>
            <div className="section-head">
              <div>
                <Badge tone={submission.score == null ? "warning" : "success"}>{submission.score == null ? "Pending" : "Reviewed"}</Badge>
                <h2>{submission.students?.name || "Student"} - {submission.tasks?.title || "Writing task"}</h2>
                <p className="muted">{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(submission.submitted_at))}</p>
              </div>
            </div>
            <div className="answer-box">{submission.answer}</div>
            <form action={reviewSubmissionAction} className="form-stack" style={{ marginTop: 16 }}>
              <input type="hidden" name="id" value={submission.id} />
              <label>Band Score<Input name="score" type="number" min="1" max="9" step="0.5" defaultValue={submission.score ?? ""} /></label>
              <label>Teacher Feedback<Textarea name="feedback" defaultValue={submission.feedback ?? ""} /></label>
              <Button>Save Review</Button>
            </form>
          </Card>
        ))}
        {!writing.length ? (
          <Card className="panel">
            <Table><tbody><tr><td>No writing submissions yet.</td></tr></tbody></Table>
          </Card>
        ) : null}
      </div>
    </AdminShell>
  );
}
