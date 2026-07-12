import Link from "next/link";
import type { CSSProperties } from "react";
import { createServerSupabaseClient, getPublishedTasksForStudent, getStudentSubmissions } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../components/StudentShell";
import { HistoryTable } from "./HistoryTable";
import {
  averageScore,
  completionState,
  feedbackSubmissions,
  formatDate,
  formatTimeTaken,
  labelForSkill,
  overallBandScore,
  perSkillStats,
  progressBySkill,
  reviewedSubmissions,
  scoreLabel,
  submissionsForSkill,
  submissionsForSkills,
  toneForSkill,
  trendLabel
} from "../student-utils";

export default async function AnalyticsPage() {
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  let tasks: Awaited<ReturnType<typeof getPublishedTasksForStudent>>["tasks"] = [];
  let submissions: Awaited<ReturnType<typeof getStudentSubmissions>> = [];

  try {
    const [tasksResult, submissionsResult] = await Promise.all([
      getPublishedTasksForStudent(supabase),
      getStudentSubmissions(supabase, session.id)
    ]);
    tasks = tasksResult.tasks;
    submissions = submissionsResult;
  } catch (err) {
    console.error("[AnalyticsPage] failed to load data:", err);
  }

  const progress = completionState(tasks, submissions);
  const reviewed = reviewedSubmissions(submissions);
  const feedback = feedbackSubmissions(submissions);
  const average = averageScore(submissions);
  const skills = progressBySkill(tasks, submissions);
  const trend = trendLabel(submissions);

  const rlSubmissions = submissionsForSkills(submissions, ["reading", "listening"]);
  const rlScored = rlSubmissions.filter((s) => s.score != null && s.total);
  const band = overallBandScore(submissions);
  const readingStats = perSkillStats(submissions, "reading");
  const listeningStats = perSkillStats(submissions, "listening");

  const rlHistory = rlScored
    .slice()
    .sort((a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime());

  const allScored = submissions
    .filter((s) => s.score != null)
    .slice()
    .sort((a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime());

  return (
    <StudentShell name={session.name} sectionLabel="Analytics" sectionDescription="Progress, skill balance, and teacher feedback signals">
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

        <section className="student-stat-grid" aria-label="Per-skill summary">
          <MetricCard label="Reading" value={readingStats.count > 0 ? `${readingStats.count} tests` : "-"} note={readingStats.avgBand != null ? `avg band ${readingStats.avgBand.toFixed(1)}` : "no data yet"} />
          <MetricCard label="Listening" value={listeningStats.count > 0 ? `${listeningStats.count} tests` : "-"} note={listeningStats.avgBand != null ? `avg band ${listeningStats.avgBand.toFixed(1)}` : "no data yet"} />
        </section>

        <section className="student-panel">
          <div className="student-section-header">
            <div>
              <p className="student-kicker">Reading &amp; Listening</p>
              <h2>Overall band score</h2>
            </div>
          </div>
          <div className="student-band-overview">
            <div className="student-metric-card">
              <span>Overall band</span>
              <strong>{band != null ? band.toFixed(1) : "-"}</strong>
              <small>{rlScored.length} test{rlScored.length !== 1 ? "s" : ""}</small>
            </div>
            <div className="student-skills-mini">
              <div className="student-skill-mini-card">
                <strong>{readingStats.avgBand != null ? readingStats.avgBand.toFixed(1) : "-"}</strong>
                <span>Reading &middot; {readingStats.count} test{readingStats.count !== 1 ? "s" : ""} &middot; avg {readingStats.avgScore != null ? readingStats.avgScore.toFixed(1) : "-"}</span>
              </div>
              <div className="student-skill-mini-card">
                <strong>{listeningStats.avgBand != null ? listeningStats.avgBand.toFixed(1) : "-"}</strong>
                <span>Listening &middot; {listeningStats.count} test{listeningStats.count !== 1 ? "s" : ""} &middot; avg {listeningStats.avgScore != null ? listeningStats.avgScore.toFixed(1) : "-"}</span>
              </div>
            </div>
          </div>
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
                      <small>{skill.done}/{skill.total} completed &middot; {reviewedSkill} reviewed</small>
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

        {readingStats.count > 0 || listeningStats.count > 0 ? (
          <section className="student-panel">
            <div className="student-section-header">
              <div>
                <p className="student-kicker">Strengths &amp; Weaknesses</p>
                <h2>Reading vs Listening</h2>
              </div>
            </div>
            <div className="student-sw-grid">
              {readingStats.avgBand != null && listeningStats.avgBand != null ? (
                <>
                  <div className="student-sw-card sw-strength">
                    <h3>{(readingStats.avgBand || 0) >= (listeningStats.avgBand || 0) ? "Reading" : "Listening"}</h3>
                    <p>{(readingStats.avgBand || 0) >= (listeningStats.avgBand || 0) ? readingStats.avgBand?.toFixed(1) : listeningStats.avgBand?.toFixed(1)} band &mdash; above the other by {Math.abs((readingStats.avgBand || 0) - (listeningStats.avgBand || 0)).toFixed(1)}</p>
                  </div>
                  <div className="student-sw-card sw-weakness">
                    <h3>{(readingStats.avgBand || 0) < (listeningStats.avgBand || 0) ? "Reading" : "Listening"}</h3>
                    <p>{(readingStats.avgBand || 0) < (listeningStats.avgBand || 0) ? readingStats.avgBand?.toFixed(1) : listeningStats.avgBand?.toFixed(1)} band &mdash; focus here to balance your score</p>
                  </div>
                </>
              ) : (
                <div className="student-empty-card">
                  <h3>Not enough data</h3>
                  <p>Complete at least one Reading and one Listening test to see your strengths.</p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        <section className="student-panel">
          <div className="student-section-header">
            <div>
              <p className="student-kicker">Test history</p>
              <h2>All attempts</h2>
            </div>
            <Link href="/results">All results</Link>
          </div>
          <HistoryTable submissions={allScored.map((s) => ({
            id: s.id,
            score: s.score,
            total: s.total,
            time_taken: s.time_taken,
            submitted_at: s.submitted_at,
            answer: s.answer,
            tasks: s.tasks,
          }))} />
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
                  <small>{labelForSkill(submission.tasks?.skill)} &middot; {formatDate(submission.submitted_at, { dateStyle: "medium", timeStyle: "short" })}</small>
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
