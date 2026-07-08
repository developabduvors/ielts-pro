import Link from "next/link";
import type { CSSProperties } from "react";
import { createServerSupabaseClient, getPublishedTasksForStudent, getStudentById, getStudentSubmissions } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../components/StudentShell";
import {
  averageScore,
  completionState,
  feedbackSubmissions,
  formatDate,
  labelForSkill,
  progressBySkill,
  reviewedSubmissions,
  scoreLabel,
  submissionsForSkill,
  toneForSkill,
  trendLabel
} from "../student-utils";

export default async function AnalyticsPage() {
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  const student = await getStudentById(supabase, session.id);
  const currentGroupId = student?.group_id ?? session.group_id;
  const [{ tasks }, submissions] = await Promise.all([
    getPublishedTasksForStudent(supabase, currentGroupId),
    getStudentSubmissions(supabase, session.id)
  ]);
  const progress = completionState(tasks, submissions);
  const reviewed = reviewedSubmissions(submissions);
  const feedback = feedbackSubmissions(submissions);
  const average = averageScore(submissions);
  const skills = progressBySkill(tasks, submissions);
  const trend = trendLabel(submissions);

  return (
    <StudentShell name={session.name} groupName={student?.groups?.name} sectionLabel="Analytics" sectionDescription="Progress, skill balance, and teacher feedback signals">
      <main className="student-page student-analytics-page">
        <section className="student-hero-panel compact">
          <div>
            <p className="student-kicker">Analytics</p>
            <h1>Track whether your IELTS work is moving up.</h1>
            <p>These numbers update from actual published tasks, submissions, scores, and teacher feedback.</p>
          </div>
          <div className="student-hero-progress">
            <span>Overall progress</span>
            <strong>{progress.percent}%</strong>
            <div className="student-progress-bar" style={{ "--student-progress": `${progress.percent}%` } as CSSProperties} />
            <small>{progress.completed}/{tasks.length} submitted</small>
          </div>
        </section>

        <section className="student-stat-grid" aria-label="Analytics summary">
          <MetricCard label="Trend" value={trend} note="based on reviewed scores" />
          <MetricCard label="Attempts" value={submissions.length} note="all submitted work" />
          <MetricCard label="Average" value={average || "-"} note="reviewed score" />
          <MetricCard label="Feedback" value={feedback.length} note="teacher notes" />
        </section>

        <section className="student-two-column">
          <article className="student-panel">
            <div className="student-section-header">
              <div>
                <p className="student-kicker">Skill balance</p>
                <h2>Completion by IELTS skill</h2>
              </div>
              <Link href="/practice">Practice</Link>
            </div>
            <div className="student-progress-list">
              {skills.map((skill) => {
                const reviewedSkill = reviewedSubmissions(submissionsForSkill(submissions, skill.key)).length;
                return (
                  <Link className="student-progress-row" href={skill.href} key={skill.key}>
                    <span className={`student-skill-icon tone-${toneForSkill(skill.key)}`}>{skill.mark}</span>
                    <div>
                      <strong>{skill.label}</strong>
                      <small>{skill.done}/{skill.total} completed · {reviewedSkill} reviewed</small>
                      <div className="student-row-bar" style={{ "--student-progress": `${skill.percent}%` } as CSSProperties} />
                    </div>
                    <em>{skill.percent}%</em>
                  </Link>
                );
              })}
            </div>
          </article>

          <article className="student-panel student-donut-panel">
            <p className="student-kicker">Score direction</p>
            <h2>{trend}</h2>
            <div className="student-donut" style={{ "--student-progress": `${progress.percent}%` } as CSSProperties}>
              <strong>{average || "-"}</strong>
              <span>avg</span>
            </div>
            <p className="student-muted">{reviewed.length ? `${reviewed.length} reviewed attempts are included.` : "Submit work and wait for teacher review to unlock score analytics."}</p>
          </article>
        </section>

        <section className="student-panel">
          <div className="student-section-header">
            <div>
              <p className="student-kicker">Latest review</p>
              <h2>Scored attempts</h2>
            </div>
            <Link href="/results">All results</Link>
          </div>
          <div className="student-card-list">
            {reviewed.slice(0, 6).map((submission) => (
              <article className="student-result-row" key={submission.id}>
                <span className={`student-skill-icon tone-${toneForSkill(submission.tasks?.skill)}`}>{labelForSkill(submission.tasks?.skill).slice(0, 1)}</span>
                <div>
                  <strong>{submission.tasks?.title || "Practice task"}</strong>
                  <small>{labelForSkill(submission.tasks?.skill)} · {formatDate(submission.submitted_at, { dateStyle: "medium", timeStyle: "short" })}</small>
                </div>
                <em>{scoreLabel(submission)}</em>
              </article>
            ))}
            {!reviewed.length ? (
              <div className="student-empty-card">
                <h3>No reviewed attempts yet</h3>
                <p>Auto-checked tasks and teacher-scored writing will appear here after submission.</p>
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
