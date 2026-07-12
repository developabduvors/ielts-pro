import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { createServerSupabaseClient, getPublishedTasksForStudent, getStudentSubmissions } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../../components/StudentShell";
import {
  completionState,
  labelForSkill,
  taskSummary,
  tasksForSkill,
  toneForSkill
} from "../../student-utils";

const skillPages = {
  reading: {
    db: "reading",
    label: "Reading",
    copy: "Practice academic passages, matching headings, completion, and multiple choice."
  },
  listening: {
    db: "listening",
    label: "Listening",
    copy: "Open audio tasks with a timed answer sheet and real listening flow."
  },
  writing: {
    db: "writing",
    label: "Writing",
    copy: "Submit Task 1 and Task 2 responses for teacher feedback and score history."
  },
  "full-tests": {
    db: "full_test",
    label: "Full Tests",
    copy: "Run Reading, Listening, and Writing in one exam-style bundle."
  }
} as const;

type SkillSlug = keyof typeof skillPages;

export default async function SkillPracticePage({ params }: { params: Promise<{ skill: string }> }) {
  const { skill } = await params;
  if (!isSkillSlug(skill)) notFound();

  const config = skillPages[skill];
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  const submissions = await getStudentSubmissions(supabase, session.id);
  const { lessons, tasks } = await getPublishedTasksForStudent(supabase);
  const skillTasks = tasksForSkill(tasks, config.db);
  const progress = completionState(skillTasks, submissions);

  return (
    <StudentShell
      name={session.name}
      sectionLabel={config.label}
      sectionDescription={config.copy}
    >
      <main className="student-page student-skill-page">
        <section className={`student-skill-hero tone-${toneForSkill(config.db)}`}>
          <div>
            <Link className="student-back-link" href="/practice">Practice</Link>
            <p className="student-kicker">{config.label} practice</p>
            <h1>{config.label}</h1>
            <p>{config.copy}</p>
            <div className="student-chip-row">
              <span>All {config.label}</span>
              <span>Timed</span>
              <span>Teacher assigned</span>
              <span>New tab exam</span>
            </div>
          </div>
          <div className="student-hero-progress">
            <span>{config.label} progress</span>
            <strong>{progress.percent}%</strong>
            <div className="student-progress-bar" style={{ "--student-progress": `${progress.percent}%` } as CSSProperties} />
            <small>{progress.completed}/{skillTasks.length} submitted</small>
          </div>
        </section>

        <section className="student-stat-grid" aria-label={`${config.label} summary`}>
          <MetricCard label="Available" value={skillTasks.length} note={`${labelForSkill(config.db)} tasks`} />
          <MetricCard label="Completed" value={progress.completed} note="already submitted" />
          <MetricCard label="Open" value={progress.open} note="ready to start" />
        </section>

        <section className="student-panel">
          <div className="student-section-header">
            <div>
              <p className="student-kicker">Practice list</p>
              <h2>{config.label} tasks</h2>
            </div>
            <Link href="/results">History</Link>
          </div>
          <div className="student-card-list">
            {skillTasks.map((task) => {
              const submitted = progress.completedIds.has(task.id);
              return (
                <article className="student-assignment-card" key={task.id}>
                  <div>
                    <span className={`student-skill-icon tone-${toneForSkill(task.skill)}`}>{labelForSkill(task.skill).slice(0, 1)}</span>
                    <div>
                      <strong>{task.title}</strong>
                      <small>{taskSummary(task, lessons)}</small>
                    </div>
                  </div>
                  <span className={`student-status-pill ${submitted ? "is-done" : ""}`}>{submitted ? "Submitted" : "Open"}</span>
                  <Link className="student-primary-button" href={`/tests/${task.id}`}>
                    {submitted ? "Open result" : "Start test"}
                  </Link>
                </article>
              );
            })}
            {!skillTasks.length ? (
              <div className="student-empty-card">
                <h3>No {config.label.toLowerCase()} tasks yet</h3>
                <p>When your teacher publishes this skill, it will appear here.</p>
                <Link className="student-secondary-button" href="/practice">Back to skills</Link>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </StudentShell>
  );
}

function isSkillSlug(value: string): value is SkillSlug {
  return value in skillPages;
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
