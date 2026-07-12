import Link from "next/link";
import { createServerSupabaseClient, getStudentSubmissions } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../components/StudentShell";
import {
  averageScore,
  feedbackSubmissions,
  formatDate,
  formatTimeTaken,
  labelForSkill,
  reviewedSubmissions,
  scoreLabel,
  toneForSkill
} from "../student-utils";

export default async function ResultsPage() {
  const session = await requireStudentSession();
  const submissions = await getStudentSubmissions(createServerSupabaseClient(), session.id);
  const reviewed = reviewedSubmissions(submissions);
  const feedback = feedbackSubmissions(submissions);
  const average = averageScore(submissions);

  return (
    <StudentShell
      name={session.name}
      sectionLabel="Results"
      sectionDescription="Attempts, scores, and teacher feedback"
    >
      <main className="student-page student-results-page">
        <section className="student-hero-panel compact">
          <div>
            <p className="student-kicker">Result history</p>
            <h1>Your attempts and feedback in one place.</h1>
            <p>Every score here comes from submitted IELTS practice or teacher review.</p>
          </div>
          <Link className="student-primary-button" href="/practice">Continue practice</Link>
        </section>

        <section className="student-stat-grid" aria-label="Results summary">
          <MetricCard label="Attempts" value={submissions.length} note="total submitted" />
          <MetricCard label="Reviewed" value={reviewed.length} note="scored attempts" />
          <MetricCard label="Average" value={average || "-"} note="reviewed score" />
          <MetricCard label="Feedback" value={feedback.length} note="teacher notes" />
        </section>

        <section className="student-panel">
          <div className="student-section-header">
            <div>
              <p className="student-kicker">History</p>
              <h2>Submitted work</h2>
            </div>
            <Link href="/analytics">Analytics</Link>
          </div>
          <div className="student-card-list">
            {submissions.map((submission) => (
              <article className="student-result-row" key={submission.id}>
                <span className={`student-skill-icon tone-${toneForSkill(submission.tasks?.skill)}`}>{labelForSkill(submission.tasks?.skill).slice(0, 1)}</span>
                <div>
                  <strong>{submission.tasks?.title || "Practice task"}</strong>
                  <small>{labelForSkill(submission.tasks?.skill)} &middot; {formatDate(submission.submitted_at, { dateStyle: "medium", timeStyle: "short" })}{submission.time_taken ? ` \u00B7 ${formatTimeTaken(submission.time_taken)}` : ""}</small>
                  {submission.feedback ? <p>{submission.feedback}</p> : null}
                </div>
                <em>{scoreLabel(submission)}</em>
              </article>
            ))}
            {!submissions.length ? (
              <div className="student-empty-card">
                <h3>No submissions yet</h3>
                <p>Completed Reading, Listening, Writing, and Mock tasks will appear here.</p>
                <Link className="student-secondary-button" href="/practice">Open practice</Link>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </StudentShell>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <article className="student-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
