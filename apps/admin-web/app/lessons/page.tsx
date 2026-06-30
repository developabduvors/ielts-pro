import { Badge, Button, Card, Input, Select, Textarea } from "@ielts-pro/ui";
import { createServerSupabaseClient, getAllLessons, getAllTasks } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "../components/AdminShell";
import { createLessonAction, toggleLessonPublishAction } from "../actions/lms";

export default async function LessonsPage() {
  const admin = await requireAdminSession();
  const [lessons, tasks] = await Promise.all([
    getAllLessons(createServerSupabaseClient()),
    getAllTasks(createServerSupabaseClient())
  ]);
  return (
    <AdminShell email={admin.email}>
      <div className="page-head">
        <div><p className="eyebrow">Content</p><h1>Lessons & Tests</h1></div>
      </div>
      <div className="panel-grid">
        <section className="lesson-list">
          {lessons.map((lesson) => (
            <Card className="lesson-card" key={lesson.id}>
              <div>
                <Badge tone={lesson.published ? "success" : "warning"}>{lesson.published ? "Published" : "Draft"}</Badge>
                <h2>{lesson.title}</h2>
                <p className="muted">{lesson.description || "No description"}</p>
                <p>{tasks.filter((task) => task.lesson_id === lesson.id).length} tasks</p>
              </div>
              <form action={toggleLessonPublishAction}>
                <input type="hidden" name="id" value={lesson.id} />
                <input type="hidden" name="published" value={String(!!lesson.published)} />
                <Button variant="secondary">{lesson.published ? "Unpublish" : "Publish"}</Button>
              </form>
            </Card>
          ))}
        </section>

        <Card className="panel">
          <h2>Create Lesson</h2>
          <form action={createLessonAction} className="form-stack">
            <label>Title<Input name="title" required /></label>
            <label>Description<Textarea name="description" /></label>
            <div className="two-col">
              <label>Skill<Select name="skill" defaultValue="reading"><option value="reading">Reading</option><option value="listening">Listening</option><option value="writing">Writing</option></Select></label>
              <label>Order<Input name="order" type="number" defaultValue={lessons.length + 1} /></label>
            </div>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" name="published" /> Publish now</label>
            <Button>Create Lesson</Button>
          </form>
        </Card>
      </div>
    </AdminShell>
  );
}
