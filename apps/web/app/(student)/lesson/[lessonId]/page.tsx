import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient, getPublishedTasksForStudent, getStudentSubmissions } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../../components/StudentShell";
import {
  completionState,
  labelForSkill,
  taskSummary,
  toneForSkill
} from "../../student-utils";

export default async function LessonDetailPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  const [{ lessons, tasks }, submissions] = await Promise.all([
    getPublishedTasksForStudent(supabase),
    getStudentSubmissions(supabase, session.id)
  ]);
  const lesson = lessons.find((item) => item.id === lessonId);
  if (!lesson) notFound();
  const lessonTasks = tasks.filter((task) => task.lesson_id === lesson.id);
  const progress = completionState(lessonTasks, submissions);

  return (
    <StudentShell
      name={session.name}
      sectionLabel="Lesson"
      sectionDescription={lesson.title}
    >
      <main className="student-page">
        <section className="student-hero-panel compact">
          <div>
            <Link className="student-back-link" href="/lessons">Lessons</Link>
            <p className="student-kicker">{lesson.skill ? labelForSkill(lesson.skill) : "IELTS lesson"}</p>
            <h1>{lesson.title}</h1>
            <p>{lesson.description || "Complete the tasks below in the order your teacher published them."}</p>
          </div>
          <div className="student-hero-progress mini">
            <span>Lesson progress</span>
            <strong>{progress.percent}%</strong>
            <small>{progress.completed}/{lessonTasks.length} tasks submitted</small>
          </div>
        </section>

        <section className="student-panel">
          <div className="student-section-header">
            <div>
              <p className="student-kicker">Tasks</p>
              <h2>Lesson work</h2>
            </div>
            <Link href="/practice">Practice home</Link>
          </div>
          <div className="student-task-list">
            {lessonTasks.map((task) => {
              const submitted = progress.completedIds.has(task.id);
              return (
                <article className="student-task-row" key={task.id}>
                  <span className={`student-skill-icon tone-${toneForSkill(task.skill)}`}>{labelForSkill(task.skill).slice(0, 1)}</span>
                  <div>
                    <strong>{task.title}</strong>
                    <small>{taskSummary(task, lessons)}</small>
                  </div>
                  <span className={`student-status-pill ${submitted ? "is-done" : ""}`}>{submitted ? "Submitted" : "Open"}</span>
                  <Link className="student-small-button" href={`/tests/${task.id}`} target="_blank" rel="noopener noreferrer">
                    {submitted ? "Review" : "Start"}
                  </Link>
                </article>
              );
            })}
            {!lessonTasks.length ? (
              <div className="student-empty-card">
                <h3>No tasks in this lesson</h3>
                <p>Your teacher can add Reading, Listening, Writing, or Mock tasks from the admin panel.</p>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </StudentShell>
  );
}
