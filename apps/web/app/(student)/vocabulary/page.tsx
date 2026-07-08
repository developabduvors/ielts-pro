import Link from "next/link";
import type { CSSProperties } from "react";
import { createServerSupabaseClient, getPublishedTasksForStudent, getStudentById, getStudentSubmissions, type Lesson, type Task } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../components/StudentShell";
import { completionState, labelForSkill, normaliseSkill, taskSummary, toneForSkill } from "../student-utils";

export default async function VocabularyPage() {
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  const student = await getStudentById(supabase, session.id);
  const currentGroupId = student?.group_id ?? session.group_id;
  const [{ lessons, tasks }, submissions] = await Promise.all([
    getPublishedTasksForStudent(supabase, currentGroupId),
    getStudentSubmissions(supabase, session.id)
  ]);
  const vocabularyTasks = tasks.filter((task) => normaliseSkill(task.skill) === "vocabulary");
  const progress = completionState(vocabularyTasks, submissions);

  return (
    <StudentShell name={session.name} groupName={student?.groups?.name} sectionLabel="Vocabulary" sectionDescription="Word drills, article vocabulary, and teacher checks">
      <main className="student-page">
        <section className="student-skill-hero tone-vocabulary">
          <div>
            <p className="student-kicker">Vocabulary practice</p>
            <h1>Build IELTS words from teacher-published drills.</h1>
            <p>Vocabulary tasks appear here when your teacher publishes word practice or article-based vocabulary checks.</p>
          </div>
          <div className="student-hero-progress">
            <span>Vocabulary progress</span>
            <strong>{progress.percent}%</strong>
            <div className="student-progress-bar" style={{ "--student-progress": `${progress.percent}%` } as CSSProperties} />
            <small>{progress.completed}/{vocabularyTasks.length} submitted</small>
          </div>
        </section>

        <section className="student-panel">
          <div className="student-section-header">
            <div>
              <p className="student-kicker">Word work</p>
              <h2>Vocabulary tasks</h2>
            </div>
            <Link href="/practice">Practice</Link>
          </div>
          <VocabularyTaskList lessons={lessons} tasks={vocabularyTasks} completedIds={progress.completedIds} />
        </section>
      </main>
    </StudentShell>
  );
}

function VocabularyTaskList({ lessons, tasks, completedIds }: { lessons: Lesson[]; tasks: Task[]; completedIds: Set<string> }) {
  return (
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
              {submitted ? "Review" : "Start practice"}
            </Link>
          </article>
        );
      })}
      {!tasks.length ? (
        <div className="student-empty-card">
          <h3>No vocabulary tasks yet</h3>
          <p>Your teacher can publish vocabulary drills from the admin panel. Until then, continue Reading and Listening practice.</p>
        </div>
      ) : null}
    </div>
  );
}
