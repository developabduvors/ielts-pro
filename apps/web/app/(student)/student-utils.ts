import {
  inferQuestionCount,
  parseTaskContent,
  type Lesson,
  type Submission,
  type Task,
  type TaskContent
} from "@ielts-pro/shared";

export type StudentSkillKey = "listening" | "reading" | "writing" | "speaking" | "full_test" | "vocabulary";

export const studentSkillCards: Array<{
  key: StudentSkillKey;
  label: string;
  href: string;
  mark: string;
  duration: string;
  detail: string;
}> = [
  { key: "listening", label: "Listening", href: "/practice/listening", mark: "L", duration: "30 mins", detail: "Audio tasks and answer sheets" },
  { key: "reading", label: "Reading", href: "/practice/reading", mark: "R", duration: "60 mins", detail: "Passages, headings, completion" },
  { key: "speaking", label: "Speaking", href: "/speaking", mark: "S", duration: "11-14 mins", detail: "Teacher-published speaking drills" },
  { key: "writing", label: "Writing", href: "/practice/writing", mark: "W", duration: "60 mins", detail: "Task 1 and Task 2 feedback" }
];

export function normaliseSkill(skill?: string | null): StudentSkillKey | string {
  const value = String(skill || "").toLowerCase().replace(/-/g, "_");
  if (value === "full" || value === "full_tests") return "full_test";
  return value || "practice";
}

export function labelForSkill(skill?: string | null) {
  const value = normaliseSkill(skill);
  if (value === "full_test") return "Full Test";
  if (value === "listening") return "Listening";
  if (value === "reading") return "Reading";
  if (value === "writing") return "Writing";
  if (value === "speaking") return "Speaking";
  if (value === "vocabulary") return "Vocabulary";
  return titleCase(String(value));
}

export function toneForSkill(skill?: string | null) {
  const value = normaliseSkill(skill);
  if (["listening", "reading", "writing", "speaking", "vocabulary"].includes(String(value))) return value;
  if (value === "full_test") return "full";
  return "neutral";
}

export function skillMark(skill?: string | null) {
  const value = normaliseSkill(skill);
  if (value === "full_test") return "F";
  return labelForSkill(String(value)).slice(0, 1).toUpperCase();
}

export function routeForTaskList(skill?: string | null) {
  const value = normaliseSkill(skill);
  if (value === "full_test") return "/mock";
  if (value === "speaking") return "/speaking";
  if (value === "vocabulary") return "/vocabulary";
  return `/practice/${value}`;
}

export function tasksForSkill(tasks: Task[], skill: StudentSkillKey | string) {
  const wanted = normaliseSkill(skill);
  return tasks.filter((task) => normaliseSkill(task.skill) === wanted);
}

export function lessonTitle(lessons: Lesson[], task: Task) {
  return task.lessons?.title || lessons.find((lesson) => lesson.id === task.lesson_id)?.title || "IELTS practice";
}

export function taskContent(task: Task) {
  return parseTaskContent<TaskContent>(task.content, { questions: [] });
}

export function questionCountForTask(task: Task) {
  return inferQuestionCount(taskContent(task), task);
}

export function durationForTask(task: Task) {
  const content = taskContent(task);
  return Number(content.time_limit_minutes || content.duration_minutes || defaultDuration(task.skill));
}

export function taskSummary(task: Task, lessons: Lesson[]) {
  const bits = [lessonTitle(lessons, task)];
  const questions = questionCountForTask(task);
  const duration = durationForTask(task);
  if (questions) bits.push(`${questions} questions`);
  if (duration) bits.push(`${duration} min`);
  return bits.join(" · ");
}

export function completionState(tasks: Task[], submissions: Submission[]) {
  const completedIds = new Set(submissions.map((submission) => submission.task_id));
  const completed = tasks.filter((task) => completedIds.has(task.id)).length;
  const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  return { completedIds, completed, percent, open: Math.max(tasks.length - completed, 0) };
}

export function nextTask(tasks: Task[], submissions: Submission[]) {
  const { completedIds } = completionState(tasks, submissions);
  return tasks.find((task) => !completedIds.has(task.id)) || tasks[0] || null;
}

export function reviewedSubmissions(submissions: Submission[]) {
  return submissions.filter((submission) => submission.score != null);
}

export function feedbackSubmissions(submissions: Submission[]) {
  return submissions.filter((submission) => !!submission.feedback);
}

export function averageScore(submissions: Submission[]) {
  const reviewed = submissions.filter((submission) => submission.score != null && submission.total);
  if (!reviewed.length) return null;
  const average = reviewed.reduce((sum, submission) => sum + Number(submission.score || 0), 0) / reviewed.length;
  return Number.isInteger(average) ? String(average) : average.toFixed(1);
}

export function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", options || { dateStyle: "medium" }).format(new Date(value));
}

export function scoreLabel(submission: Submission) {
  if (submission.score == null) return "Pending review";
  return `${submission.score}/${submission.total ?? "band"}`;
}

export function progressBySkill(tasks: Task[], submissions: Submission[]) {
  const { completedIds } = completionState(tasks, submissions);
  return studentSkillCards.map((skill) => {
    const skillTasks = tasksForSkill(tasks, skill.key);
    const done = skillTasks.filter((task) => completedIds.has(task.id)).length;
    return {
      ...skill,
      total: skillTasks.length,
      done,
      percent: skillTasks.length ? Math.round((done / skillTasks.length) * 100) : 0
    };
  });
}

export function submissionsForSkill(submissions: Submission[], skill: StudentSkillKey | string) {
  const wanted = normaliseSkill(skill);
  return submissions.filter((submission) => normaliseSkill(submission.tasks?.skill) === wanted);
}

// Upload/import oqimida avtomatik yaratilgan darslarning belgilangan tavsiflari.
const AUTO_TEST_LESSON_DESCRIPTIONS = [
  "Interactive HTML test uploaded by the teacher.",
  "Imported content library item. Attach it to a lesson in Content Studio before publishing."
];

// O'qituvchi yuklagan/import qilgan test (HTML) — dars emas, practice testi sifatida qaraladi.
export function isUploadedTest(task: Task) {
  return task.task_type === "html_test" || task.source_type === "html" || Boolean(task.html_path);
}

// Yuklangan test yoki import kontenti uchun avtomatik yaratilgan "dars" — Lessons'da ko'rsatilmaydi,
// u faqat Practice (skill bo'yicha) da chiqadi. DB ustunlari yo'q bo'lsa ham title/description orqali aniqlanadi.
export function isAutoTestLesson(lesson: Lesson, lessonTasks: Task[]) {
  const title = String(lesson.title || "");
  const description = String(lesson.description || "");
  if (title.startsWith("[Draft content]")) return true;
  if (AUTO_TEST_LESSON_DESCRIPTIONS.includes(description)) return true;
  return lessonTasks.length > 0 && lessonTasks.every(isUploadedTest);
}

export function groupTasksByLesson(lessons: Lesson[], tasks: Task[]) {
  const groups = lessons.map((lesson) => ({
    lesson,
    tasks: tasks.filter((task) => task.lesson_id === lesson.id)
  }));
  const assignedLessonIds = new Set(lessons.map((lesson) => lesson.id));
  const looseTasks = tasks.filter((task) => !assignedLessonIds.has(task.lesson_id));
  if (looseTasks.length) {
    groups.push({
      lesson: {
        id: "unassigned",
        title: "Practice tasks",
        description: null,
        order: null,
        published: true,
        skill: null
      },
      tasks: looseTasks
    });
  }
  return groups.filter((group) => group.tasks.length || group.lesson.id !== "unassigned");
}

const BAND_SKILLS: Array<{ key: StudentSkillKey; label: string }> = [
  { key: "reading", label: "Reading" },
  { key: "listening", label: "Listening" },
  { key: "speaking", label: "Speaking" },
  { key: "writing", label: "Writing" }
];

function averageOf(values: number[]) {
  if (!values.length) return null;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Number(avg.toFixed(1));
}

// Reviewed submission ball'laridan skill bo'yicha o'rtacha. Data yo'q bo'lsa null.
export function scoresBySkill(submissions: Submission[]) {
  return BAND_SKILLS.map(({ key, label }) => {
    const scored = submissions
      .filter((s) => normaliseSkill(s.tasks?.skill) === key && s.score != null)
      .map((s) => Number(s.score));
    return { key, label, value: averageOf(scored) };
  });
}

// Umumiy o'rtacha ball (barcha reviewed submission'lardan). Katta raqam uchun.
export function overallScore(submissions: Submission[]) {
  const scored = submissions.filter((s) => s.score != null).map((s) => Number(s.score));
  return averageOf(scored);
}

// Listening reviewed ball'lari vaqt bo'yicha (chart uchun). Eng eskisidan yangisiga.
export function listeningSeries(submissions: Submission[]) {
  return submissions
    .filter((s) => normaliseSkill(s.tasks?.skill) === "listening" && s.score != null)
    .slice()
    .sort((a, b) => new Date(a.submitted_at || 0).getTime() - new Date(b.submitted_at || 0).getTime())
    .map((s) => Number(s.score));
}

export function trendLabel(submissions: Submission[]) {
  const scored = submissions.filter((submission) => submission.score != null).slice().reverse();
  if (scored.length < 2) return "No trend yet";
  const first = Number(scored[0]?.score || 0);
  const last = Number(scored[scored.length - 1]?.score || 0);
  if (last > first) return "Improving";
  if (last < first) return "Needs attention";
  return "Stable";
}

function defaultDuration(skill?: string | null) {
  const value = normaliseSkill(skill);
  if (value === "listening") return 30;
  if (value === "reading") return 60;
  if (value === "writing") return 60;
  if (value === "speaking") return 14;
  if (value === "full_test") return 180;
  return 45;
}

function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
