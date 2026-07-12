import Link from "next/link";
import type { CSSProperties } from "react";
import { createServerSupabaseClient, getPublishedTasksForStudent, getStudentSubmissions, type Lesson, type Task } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../components/StudentShell";
import { completionState, labelForSkill, taskSummary, tasksForSkill, toneForSkill } from "../student-utils";

export default async function MockPage() {
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  const [{ lessons, tasks }, submissions] = await Promise.all([
    getPublishedTasksForStudent(supabase),
    getStudentSubmissions(supabase, session.id)
  ]);
  const mockTasks = tasksForSkill(tasks, "full_test");
  const progress = completionState(mockTasks, submissions);

  return (
    <StudentShell name={session.name} sectionLabel="Mock" sectionDescription="Full IELTS-style tests">
      <main className="student-page">
        <section className="student-skill-hero tone-full">
          <div>
            <p className="student-kicker">Mock exams</p>
            <h1>Open full tests in a focused exam tab.</h1>
            <p>Full-test bundles keep Reading, Listening, and Writing together when your teacher publishes them.</p>
          </div>
          <div className="student-hero-progress">
            <span>Mock progress</span>
            <strong>{progress.percent}%</strong>
            <div className="student-progress-bar" style={{ "--student-progress": `${progress.percent}%` } as CSSProperties} />
            <small>{progress.completed}/{mockTasks.length} submitted</small>
          </div>
        </section>
        <TaskList lessons={lessons} tasks={mockTasks} completedIds={progress.completedIds} empty="No mock exams are published yet." />
      </main>
    </StudentShell>
  );
}

function TaskList({ lessons, tasks, completedIds, empty }: { lessons: Lesson[]; tasks: Task[]; completedIds: Set<string>; empty: string }) {
  return (
    <section className="student-panel">
      <div className="student-section-header">
        <div>
          <p className="student-kicker">Available tests</p>
          <h2>Full test library</h2>
        </div>
        <Link href="/practice">All practice</Link>
      </div>
      <div className="student-card-list">
        {tasks.map((task) => {
          const submitted = completedIds.has(task.id);
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
              <Link className="student-primary-button" href={`/tests/${task.id}`} target="_blank" rel="noopener noreferrer">
                {submitted ? "Review" : "Start test"}
              </Link>
            </article>
          );
        })}
        {!tasks.length ? <div className="student-empty-card"><h3>{empty}</h3><p>Ask your teacher to publish a full test from the admin panel.</p></div> : null}
      </div>
    </section>
  );
}
