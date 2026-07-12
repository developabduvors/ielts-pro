import Link from "next/link";
import { createServerSupabaseClient, getPublishedTasksForStudent, getStudentSubmissions } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../components/StudentShell";
import {
  completionState,
  groupTasksByLesson,
  isAutoTestLesson,
  labelForSkill,
  taskSummary,
  toneForSkill
} from "../student-utils";

export default async function LessonsPage() {
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  const [{ lessons, tasks }, submissions] = await Promise.all([
    getPublishedTasksForStudent(supabase),
    getStudentSubmissions(supabase, session.id)
  ]);
  const progress = completionState(tasks, submissions);
  // Yuklangan testlar Practice'da (skill bo'yicha) ko'rinadi — Lessons faqat haqiqiy darslarni ko'rsatadi.
  const lessonGroups = groupTasksByLesson(lessons, tasks).filter(({ lesson, tasks: lessonTasks }) => !isAutoTestLesson(lesson, lessonTasks));

  return (
    <StudentShell
      name={session.name}
      sectionLabel="Lessons"
      sectionDescription="Teacher-published lesson plan and assigned tasks"
    >
      <main className="student-page">
        <section className="student-hero-panel compact">
          <div>
            <p className="student-kicker">Lesson plan</p>
            <h1>Follow your published IELTS lessons.</h1>
            <p>{lessonGroups.length ? "Open a lesson, then launch the real test tab from any task." : "Your teacher has not published lessons for your group yet."}</p>
          </div>
          <Link className="student-primary-button" href="/practice">Practice by skill</Link>
        </section>

        <section className="student-card-list">
          {lessonGroups.map(({ lesson, tasks: lessonTasks }) => {
            const done = lessonTasks.filter((task) => progress.completedIds.has(task.id)).length;
            return (
              <article className="student-lesson-card" key={lesson.id}>
                <div className="student-lesson-main">
                  <p className="student-kicker">{lesson.skill ? labelForSkill(lesson.skill) : "IELTS lesson"}</p>
                  <h2>{lesson.title}</h2>
                  <p>{lesson.description || `${lessonTasks.length} published task${lessonTasks.length === 1 ? "" : "s"}.`}</p>
                  <div className="student-chip-row">
                    <span>{done}/{lessonTasks.length} completed</span>
                    <span>{lesson.published ? "Published" : "Draft"}</span>
                  </div>
                </div>
                <div className="student-lesson-tasks">
                  {lessonTasks.slice(0, 4).map((task) => (
                    <Link href={`/tests/${task.id}`} target="_blank" rel="noopener noreferrer" className="student-lesson-task" key={task.id}>
                      <span className={`student-skill-icon tone-${toneForSkill(task.skill)}`}>{labelForSkill(task.skill).slice(0, 1)}</span>
                      <div>
                        <strong>{task.title}</strong>
                        <small>{taskSummary(task, lessons)}</small>
                      </div>
                    </Link>
                  ))}
                  <Link className="student-small-button" href={`/lesson/${lesson.id}`}>Open lesson</Link>
                </div>
              </article>
            );
          })}
          {!lessonGroups.length ? (
            <div className="student-empty-card">
              <h3>No lessons yet</h3>
              <p>Ask your teacher to publish lessons.</p>
            </div>
          ) : null}
        </section>
      </main>
    </StudentShell>
  );
}
