import type { SupabaseClient } from "@supabase/supabase-js";
import { defaultPublicSiteSettings } from "./site-content";
import type { Group, Lesson, NewTaskInput, PublicSiteSettings, Student, StudentDeviceSession, Submission, Task } from "./types";

const DEFAULT_GROUPS = [
  { name: "Introduction group", slug: "introduction", order: 1 },
  { name: "Graduation group", slug: "graduation", order: 2 },
  { name: "Pre-ielts group", slug: "pre-ielts", order: 3 }
] as const;

type PublicSiteSettingsInput = Partial<Omit<PublicSiteSettings, "id" | "updated_at">>;

export function getDefaultSiteSettings(): PublicSiteSettings {
  return { ...defaultPublicSiteSettings };
}

export async function getSiteSettings(supabase: SupabaseClient): Promise<PublicSiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", "main")
    .maybeSingle();
  if (!error) return normalizeSiteSettings(data);
  if (isMissingTableError(error) || isMissingRelationOrColumnError(error)) return getDefaultSiteSettings();
  throw error;
}

export async function updateSiteSettings(supabase: SupabaseClient, input: PublicSiteSettingsInput): Promise<PublicSiteSettings> {
  const payload = normalizeSiteSettingsInput(input);
  const { data, error } = await supabase
    .from("site_settings")
    .upsert({ id: "main", ...payload, updated_at: new Date().toISOString() }, { onConflict: "id" })
    .select("*")
    .single();
  if (!error) return normalizeSiteSettings(data);
  if (isMissingTableError(error) || isMissingRelationOrColumnError(error)) {
    throw new Error("Site settings table is missing. Apply the latest Supabase migration, then save settings again.");
  }
  throw error;
}

export async function getPublishedLessons(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("published", true)
    .order("order", { ascending: true });
  if (error) throw error;
  return (data || []) as Lesson[];
}

export async function getPublishedTasks(supabase: SupabaseClient) {
  const lessons = await getPublishedLessons(supabase);
  const lessonIds = lessons.map((lesson) => lesson.id);
  if (!lessonIds.length) return { lessons, tasks: [] as Task[] };
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .in("lesson_id", lessonIds)
    .is("archived_at", null)
    .order("order", { ascending: true });
  if (!error) return { lessons, tasks: ((data || []) as Task[]).filter(isStudentVisibleTask) };
  if (!isMissingContentMetadataColumnError(error)) throw error;
  const fallback = await supabase
    .from("tasks")
    .select("*")
    .in("lesson_id", lessonIds)
    .order("order", { ascending: true });
  if (fallback.error) throw fallback.error;
  return { lessons, tasks: ((fallback.data || []) as Task[]).filter(isStudentVisibleTask) };
}

// Group-scoped test list. A test is visible to a student only when it is linked to
// that student's group via task_groups. No link -> not returned. Falls back to the
// legacy lesson-group behavior if the task_groups table has not been migrated yet.
export async function getPublishedTasksForStudent(supabase: SupabaseClient, groupId?: string | null) {
  if (!groupId) return { lessons: [] as Lesson[], tasks: [] as Task[] };
  try {
    const { data: links, error: linkError } = await supabase
      .from("task_groups")
      .select("task_id")
      .eq("group_id", groupId);
    if (linkError) throw linkError;
    const taskIds = Array.from(new Set(((links || []) as Array<{ task_id: string }>).map((row) => row.task_id))).filter(Boolean);
    if (!taskIds.length) return { lessons: [] as Lesson[], tasks: [] as Task[] };
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("*,lessons(title,published,group_id,groups(name,slug))")
      .in("id", taskIds)
      .is("archived_at", null)
      .order("order", { ascending: true });
    if (tasksError) throw tasksError;
    const tasks = ((tasksData || []) as Task[]).filter(isStudentVisibleTask);
    const lessonIds = Array.from(new Set(tasks.map((task) => task.lesson_id).filter(Boolean)));
    let lessons = [] as Lesson[];
    if (lessonIds.length) {
      const { data: lessonsData } = await supabase.from("lessons").select("*,groups(name,slug)").in("id", lessonIds);
      lessons = (lessonsData || []) as Lesson[];
    }
    return { lessons, tasks };
  } catch (error) {
    if (isMissingTaskGroupsError(error)) return getPublishedTasksForStudentLegacy(supabase, groupId);
    if (!isMissingGroupLessonColumnError(error) && !isMissingContentMetadataColumnError(error)) throw error;
    return getPublishedTasks(supabase);
  }
}

async function getPublishedTasksForStudentLegacy(supabase: SupabaseClient, groupId: string) {
  try {
    const { data: lessonsData, error: lessonError } = await supabase
      .from("lessons")
      .select("*,groups(name,slug)")
      .eq("published", true)
      .or(`group_id.eq.${groupId},group_id.is.null`)
      .order("order", { ascending: true });
    if (lessonError) throw lessonError;
    const lessons = (lessonsData || []) as Lesson[];
    const lessonIds = lessons.map((lesson) => lesson.id);
    if (!lessonIds.length) return { lessons, tasks: [] as Task[] };
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("*,lessons(title,published,group_id,groups(name,slug))")
      .in("lesson_id", lessonIds)
      .is("archived_at", null)
      .order("order", { ascending: true });
    if (tasksError) throw tasksError;
    return { lessons, tasks: ((tasksData || []) as Task[]).filter(isStudentVisibleTask) };
  } catch (error) {
    if (!isMissingGroupLessonColumnError(error) && !isMissingContentMetadataColumnError(error)) throw error;
    return getPublishedTasks(supabase);
  }
}

// Login checking normalizes names so a correct, unique Access ID is not rejected
// over trivial differences (leading/trailing/duplicated spaces or letter case).
function normalizeStudentName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export async function getStudentByCode(supabase: SupabaseClient, name: string, code: string) {
  // student_code is unique, so match on it exactly (trimmed) and verify the name
  // in JS. Using .ilike("name", …) here treated the raw input as a LIKE pattern,
  // so any %/_ or spacing/case mismatch failed the lookup even with a valid code.
  const trimmedCode = code.trim();
  const { data, error } = await supabase
    .from("students")
    .select("*,groups(name)")
    .eq("student_code", trimmedCode)
    .maybeSingle();
  if (!error) return matchStudentName(data as Student | null, name);
  if (!isMissingStudentRelationOrColumnError(error)) throw error;
  const fallback = await supabase
    .from("students")
    .select("*")
    .eq("student_code", trimmedCode)
    .maybeSingle();
  if (fallback.error) throw fallback.error;
  return matchStudentName(fallback.data as Student | null, name);
}

function matchStudentName(student: Student | null, name: string) {
  if (!student) return null;
  if (normalizeStudentName(student.name || "") !== normalizeStudentName(name)) return null;
  return student;
}

export async function getStudentById(supabase: SupabaseClient, studentId: string) {
  const { data, error } = await supabase
    .from("students")
    .select("*,groups(name)")
    .eq("id", studentId)
    .maybeSingle();
  if (!error) return data as Student | null;
  if (!isMissingStudentRelationOrColumnError(error)) throw error;
  const fallback = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle();
  if (fallback.error) throw fallback.error;
  return fallback.data as Student | null;
}

export async function getOpenStudentByAccessId(supabase: SupabaseClient, name: string, accessId: string) {
  const student = await getStudentByCode(supabase, name, accessId);
  if (!student) return { student: null, reason: "not_found" as const };
  if (student.is_active === false || student.access_status === "closed") {
    return { student: null, reason: "closed" as const };
  }
  return { student, reason: "open" as const };
}

export async function createStudentAccess(supabase: SupabaseClient, input: { name: string; accessId: string; groupId?: string | null; maxDevices?: number | null }) {
  const { data, error } = await supabase
    .from("students")
    .insert({
      name: input.name,
      student_code: input.accessId,
      group_id: input.groupId ?? null,
      is_active: true,
      access_status: "open",
      max_devices: input.maxDevices ?? null
    })
    .select("*")
    .single();
  if (error && isMissingAccessColumnsError(error)) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("students")
      .insert({
        name: input.name,
        student_code: input.accessId
      })
      .select("*")
      .single();
    if (fallbackError) throw fallbackError;
    return fallbackData as Student;
  }
  if (error) throw error;
  return data as Student;
}

export async function setStudentAccessStatus(supabase: SupabaseClient, studentId: string, open: boolean) {
  const { data, error } = await supabase
    .from("students")
    .update({ is_active: open, access_status: open ? "open" : "closed", updated_at: new Date().toISOString() })
    .eq("id", studentId)
    .select("*")
    .single();
  if (!error) return data as Student;
  if (isMissingUpdatedAtColumnError(error)) {
    const fallback = await supabase
      .from("students")
      .update({ is_active: open, access_status: open ? "open" : "closed" })
      .eq("id", studentId)
      .select("*")
      .single();
    if (!fallback.error) return fallback.data as Student;
    if (!isMissingAccessColumnsError(fallback.error)) throw fallback.error;
  } else if (!isMissingAccessColumnsError(error)) {
    throw error;
  }
  const current = await supabase.from("students").select("*").eq("id", studentId).single();
  if (current.error) throw current.error;
  return current.data as Student;
}

export async function touchStudentLogin(supabase: SupabaseClient, studentId: string) {
  const { error } = await supabase
    .from("students")
    .update({ last_login_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", studentId);
  if (!error) return;
  if (isMissingAccessColumnsError(error) || isMissingUpdatedAtColumnError(error)) return;
  throw error;
}

export async function createStudentDeviceSession(
  supabase: SupabaseClient,
  input: { studentId: string; sessionTokenHash: string; userAgent?: string | null; deviceLabel?: string | null; deviceFingerprintHash?: string | null }
) {
  const { data, error } = await supabase
    .from("student_device_sessions")
    .insert({
      student_id: input.studentId,
      session_token_hash: input.sessionTokenHash,
      user_agent: input.userAgent ?? null,
      device_label: input.deviceLabel ?? null,
      device_fingerprint_hash: input.deviceFingerprintHash ?? null,
      is_active: true
    })
    .select()
    .single();
  if (error) throw error;
  return data as StudentDeviceSession;
}

export async function validateStudentDeviceSession(
  supabase: SupabaseClient,
  input: { studentId: string; deviceSessionId: string; sessionTokenHash: string; userAgent?: string | null }
) {
  const { data, error } = await supabase
    .from("student_device_sessions")
    .select("*,students(name,student_code,is_active,access_status)")
    .eq("id", input.deviceSessionId)
    .eq("student_id", input.studentId)
    .eq("session_token_hash", input.sessionTokenHash)
    .maybeSingle();
  if (error) throw error;
  const session = data as StudentDeviceSession | null;
  if (!session || session.is_active === false || session.revoked_at) return false;
  const student = session.students as Student | null | undefined;
  if (student?.is_active === false || student?.access_status === "closed") return false;
  await supabase
    .from("student_device_sessions")
    .update({ last_seen_at: new Date().toISOString(), user_agent: input.userAgent ?? session.user_agent })
    .eq("id", input.deviceSessionId);
  return true;
}

export async function getStudentDeviceSessions(supabase: SupabaseClient, studentId?: string) {
  let query = supabase
    .from("student_device_sessions")
    .select("*,students(name,student_code)")
    .order("created_at", { ascending: false });
  if (studentId) query = query.eq("student_id", studentId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as StudentDeviceSession[];
}

export async function revokeStudentDeviceSession(supabase: SupabaseClient, sessionId: string, revokedByEmail?: string | null) {
  const { error } = await supabase
    .from("student_device_sessions")
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoked_by_email: revokedByEmail ?? null
    })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function revokeAllStudentDeviceSessions(supabase: SupabaseClient, studentId: string, revokedByEmail?: string | null) {
  const { error } = await supabase
    .from("student_device_sessions")
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      revoked_by_email: revokedByEmail ?? null
    })
    .eq("student_id", studentId)
    .eq("is_active", true);
  if (error) throw error;
}

export async function getStudentSubmissions(supabase: SupabaseClient, studentId: string) {
  const { data, error } = await supabase
    .from("submissions")
    .select("*,tasks(title,skill,lessons(title))")
    .eq("student_id", studentId)
    .order("submitted_at", { ascending: false });
  if (!error) return (data || []) as Submission[];
  if (!isMissingRelationOrColumnError(error)) throw error;
  const fallback = await supabase
    .from("submissions")
    .select("*")
    .eq("student_id", studentId)
    .order("submitted_at", { ascending: false });
  if (fallback.error) throw fallback.error;
  return (fallback.data || []) as Submission[];
}

export async function getPublishedTaskById(supabase: SupabaseClient, taskId: string) {
  const { data: task, error } = await supabase
    .from("tasks")
    .select("*,lessons(title,published)")
    .eq("id", taskId)
    .maybeSingle();
  if (error) throw error;
  const typed = task as Task | null;
  if (!typed || typed.lessons?.published !== true || !isStudentVisibleTask(typed)) return null;
  return typed;
}

export async function getPublishedTaskByIdForStudent(supabase: SupabaseClient, taskId: string, groupId?: string | null) {
  if (!groupId) return null;
  try {
    const { data: link, error: linkError } = await supabase
      .from("task_groups")
      .select("task_id")
      .eq("task_id", taskId)
      .eq("group_id", groupId)
      .maybeSingle();
    if (linkError) throw linkError;
    if (!link) return null;
    const { data: task, error } = await supabase
      .from("tasks")
      .select("*,lessons(title,published,group_id,groups(name,slug))")
      .eq("id", taskId)
      .maybeSingle();
    if (error) throw error;
    const typed = task as Task | null;
    if (!typed || typed.archived_at || !isStudentVisibleTask(typed)) return null;
    return typed;
  } catch (error) {
    if (isMissingTaskGroupsError(error)) return getPublishedTaskByIdForStudentLegacy(supabase, taskId, groupId);
    if (!isMissingGroupLessonColumnError(error)) throw error;
    return getPublishedTaskById(supabase, taskId);
  }
}

async function getPublishedTaskByIdForStudentLegacy(supabase: SupabaseClient, taskId: string, groupId: string) {
  try {
    const { data: task, error } = await supabase
      .from("tasks")
      .select("*,lessons(title,published,group_id,groups(name,slug))")
      .eq("id", taskId)
      .maybeSingle();
    if (error) throw error;
    const typed = task as Task | null;
    if (!typed || typed.lessons?.published !== true || !isStudentVisibleTask(typed)) return null;
    const lessonGroupId = typed.lessons?.group_id;
    if (lessonGroupId && lessonGroupId !== groupId) return null;
    return typed;
  } catch (error) {
    if (!isMissingGroupLessonColumnError(error)) throw error;
    return getPublishedTaskById(supabase, taskId);
  }
}

function isStudentVisibleTask(task: Task) {
  if (task.archived_at) return false;
  const status = String(task.content_status || "").toLowerCase();
  if (!status) return true;
  return status === "published";
}

export async function getSubmissionForTask(supabase: SupabaseClient, studentId: string, taskId: string) {
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("student_id", studentId)
    .eq("task_id", taskId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Submission | null;
}

export async function submitAttempt(
  supabase: SupabaseClient,
  input: { studentId: string; taskId: string; answer: string; score?: number | null; total?: number | null }
) {
  const { data, error } = await supabase
    .from("submissions")
    .insert({
      student_id: input.studentId,
      task_id: input.taskId,
      answer: input.answer,
      score: input.score ?? null,
      total: input.total ?? null
    })
    .select()
    .single();
  if (error) throw error;
  return data as Submission;
}

export async function getAdminDashboardStats(supabase: SupabaseClient) {
  const [groups, students, lessons, tasks, submissions] = await Promise.all([
    getAllGroups(supabase),
    getAllStudents(supabase),
    getAllLessons(supabase),
    getAllTasks(supabase),
    getWritingSubmissions(supabase)
  ]);
  return {
    groups,
    students,
    lessons,
    tasks,
    submissions,
    pendingWriting: submissions.filter((submission) => submission.tasks?.skill === "writing" && submission.score == null)
  };
}

export async function getAllGroups(supabase: SupabaseClient) {
  await ensureDefaultGroups(supabase);
  const { data, error } = await supabase.from("groups").select("*").order("order", { ascending: true });
  if (!error) return (data || []) as Group[];
  if (isMissingTableError(error)) return [];
  if (!isMissingGroupColumnError(error)) throw error;
  const fallback = await supabase.from("groups").select("*").order("name", { ascending: true });
  if (!fallback.error) return (fallback.data || []) as Group[];
  if (isMissingTableError(fallback.error)) return [];
  throw fallback.error;
}

export async function ensureDefaultGroups(supabase: SupabaseClient) {
  const { error } = await supabase
    .from("groups")
    .upsert(DEFAULT_GROUPS, { onConflict: "slug", ignoreDuplicates: false });
  if (error && (isMissingGroupColumnError(error) || isMissingTableError(error))) return;
  if (error) throw error;
}

export async function createGroup(supabase: SupabaseClient, input: { name: string; slug?: string | null; order?: number | null }) {
  const slug = input.slug || slugify(input.name);
  const { data, error } = await supabase
    .from("groups")
    .upsert({ name: input.name, slug, order: input.order ?? 10, updated_at: new Date().toISOString() }, { onConflict: "slug" })
    .select()
    .single();
  if (error && isMissingGroupColumnError(error)) {
    const fallback = await supabase
      .from("groups")
      .insert({ name: input.name })
      .select("*")
      .single();
    if (fallback.error) throw fallback.error;
    return fallback.data as Group;
  }
  if (error) throw error;
  return data as Group;
}

export async function getAllStudents(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("students").select("*,groups(name)").order("name", { ascending: true });
  if (!error) return (data || []) as Student[];
  if (!isMissingStudentRelationOrColumnError(error)) throw error;
  const fallback = await supabase.from("students").select("*").order("name", { ascending: true });
  if (fallback.error) throw fallback.error;
  return (fallback.data || []) as Student[];
}

export async function getAllLessons(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("lessons").select("*,groups(name,slug)").order("order", { ascending: true });
  if (!error) return (data || []) as Lesson[];
  if (!isMissingGroupLessonColumnError(error)) throw error;
  const fallback = await supabase.from("lessons").select("*").order("order", { ascending: true });
  if (fallback.error) throw fallback.error;
  return (fallback.data || []) as Lesson[];
}

export async function getAllTasks(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*,lessons(title,published,group_id,groups(name,slug))")
    .order("order", { ascending: true });
  if (!error) return (data || []) as Task[];
  if (!isMissingContentMetadataColumnError(error) && !isMissingGroupLessonColumnError(error)) throw error;
  const fallback = await supabase.from("tasks").select("*,lessons(title,published)").order("order", { ascending: true });
  if (!fallback.error) return (fallback.data || []) as Task[];
  if (!isMissingRelationOrColumnError(fallback.error)) throw fallback.error;
  const plain = await supabase.from("tasks").select("*").order("order", { ascending: true });
  if (plain.error) throw plain.error;
  return (plain.data || []) as Task[];
}

export async function createLesson(supabase: SupabaseClient, input: Pick<Lesson, "title" | "description" | "order" | "published" | "skill"> & { group_id?: string | null; status?: string | null }) {
  const payload = {
    ...input,
    status: input.status ?? (input.published ? "published" : "draft")
  };
  const { data, error } = await supabase.from("lessons").insert(payload).select().single();
  if (!error) return data as Lesson;
  if (!isMissingGroupLessonColumnError(error)) throw error;
  const { group_id: _groupId, status: _status, ...fallbackInput } = input;
  const fallback = await supabase.from("lessons").insert(fallbackInput).select().single();
  if (fallback.error) throw fallback.error;
  return fallback.data as Lesson;
}

export async function createTask(supabase: SupabaseClient, input: NewTaskInput) {
  const { data, error } = await supabase.from("tasks").insert(input).select().single();
  if (!error) return data as Task;
  if (!isMissingContentMetadataColumnError(error)) throw error;
  const {
    source_type: _sourceType,
    content_status: _contentStatus,
    content_type: _contentType,
    subtype: _subtype,
    question_count: _questionCount,
    answer_count: _answerCount,
    audio_detected: _audioDetected,
    warnings: _warnings,
    ...fallbackInput
  } = input;
  const fallback = await supabase.from("tasks").insert(fallbackInput).select().single();
  if (fallback.error) throw fallback.error;
  return fallback.data as Task;
}

export async function updateLesson(supabase: SupabaseClient, id: string, input: Partial<Pick<Lesson, "title" | "description" | "order" | "published" | "skill" | "group_id" | "status">>) {
  const payload = { ...input, updated_at: new Date().toISOString() };
  if (input.published != null && !input.status) payload.status = input.published ? "published" : "draft";
  const { data, error } = await supabase.from("lessons").update(payload).eq("id", id).select().single();
  if (!error) return data as Lesson;
  if (!isMissingGroupLessonColumnError(error)) throw error;
  const { group_id: _groupId, status: _status, updated_at: _updatedAt, ...fallbackInput } = payload;
  const fallback = await supabase.from("lessons").update(fallbackInput).eq("id", id).select().single();
  if (fallback.error) throw fallback.error;
  return fallback.data as Lesson;
}

export async function updateTask(supabase: SupabaseClient, id: string, input: Partial<NewTaskInput> & { archived_at?: string | null }) {
  const payload = { ...input, updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from("tasks").update(payload).eq("id", id).select().single();
  if (!error) return data as Task;
  if (!isMissingContentMetadataColumnError(error)) throw error;
  const {
    source_type: _sourceType,
    content_status: _contentStatus,
    content_type: _contentType,
    subtype: _subtype,
    question_count: _questionCount,
    answer_count: _answerCount,
    audio_detected: _audioDetected,
    warnings: _warnings,
    archived_at: _archivedAt,
    updated_at: _updatedAt,
    ...fallbackInput
  } = payload;
  const fallback = await supabase.from("tasks").update(fallbackInput).eq("id", id).select().single();
  if (fallback.error) throw fallback.error;
  return fallback.data as Task;
}

export async function updateTasksForLessonStatus(supabase: SupabaseClient, lessonId: string, contentStatus: string) {
  const payload = { content_status: contentStatus, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("tasks").update(payload).eq("lesson_id", lessonId);
  if (!error) return;
  if (!isMissingContentMetadataColumnError(error)) throw error;
}

// Returns a map of taskId -> assigned groupIds[], used to pre-check the admin panel.
export async function getTaskGroupsMap(supabase: SupabaseClient, taskIds: string[]) {
  const map = new Map<string, string[]>();
  const ids = Array.from(new Set(taskIds.filter(Boolean)));
  if (!ids.length) return map;
  try {
    const { data, error } = await supabase.from("task_groups").select("task_id,group_id").in("task_id", ids);
    if (error) throw error;
    for (const row of (data || []) as Array<{ task_id: string; group_id: string }>) {
      const list = map.get(row.task_id) || [];
      list.push(row.group_id);
      map.set(row.task_id, list);
    }
    return map;
  } catch (error) {
    if (isMissingTaskGroupsError(error)) return map;
    throw error;
  }
}

// Replaces a test's group links with the given set. Assigning >=1 group publishes the
// test's lesson (makes it live immediately); clearing all groups hides it from everyone.
export async function setTaskGroups(supabase: SupabaseClient, taskId: string, groupIds: string[]) {
  const unique = Array.from(new Set(groupIds.filter(Boolean)));
  const { data: taskRow, error: taskError } = await supabase.from("tasks").select("id,lesson_id").eq("id", taskId).maybeSingle();
  if (taskError) throw taskError;
  const lessonId = (taskRow as { lesson_id?: string | null } | null)?.lesson_id || null;

  const del = await supabase.from("task_groups").delete().eq("task_id", taskId);
  if (del.error) {
    if (isMissingTaskGroupsError(del.error)) throw new Error("task_groups jadvali topilmadi. Avval Supabase migratsiyasini qo'llang (20260708120000_task_groups.sql).");
    throw del.error;
  }
  if (unique.length) {
    const ins = await supabase.from("task_groups").insert(unique.map((group_id) => ({ task_id: taskId, group_id })));
    if (ins.error) throw ins.error;
  }

  const live = unique.length > 0;
  if (lessonId) {
    await updateLesson(supabase, lessonId, { published: live });
    await updateTasksForLessonStatus(supabase, lessonId, live ? "published" : "assigned");
  } else {
    await updateTask(supabase, taskId, { content_status: live ? "published" : "draft" });
  }
}

export async function updateStudentGroup(supabase: SupabaseClient, studentId: string, groupId: string | null) {
  const { data, error } = await supabase
    .from("students")
    .update({ group_id: groupId, updated_at: new Date().toISOString() })
    .eq("id", studentId)
    .select("*")
    .single();
  if (!error) return data as Student;
  if (!isMissingAccessColumnsError(error) && !isMissingUpdatedAtColumnError(error)) throw error;
  const fallback = await supabase
    .from("students")
    .update({ group_id: groupId })
    .eq("id", studentId)
    .select("*")
    .single();
  if (!fallback.error) return fallback.data as Student;
  if (!isMissingAccessColumnsError(fallback.error)) throw fallback.error;
  const current = await supabase.from("students").select("*").eq("id", studentId).single();
  if (current.error) throw current.error;
  return current.data as Student;
}

export async function getWritingSubmissions(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("submissions")
    .select("*,students(name,student_code),tasks(title,skill,lessons(title))")
    .order("submitted_at", { ascending: false });
  if (!error) return (data || []) as Submission[];
  if (!isMissingRelationOrColumnError(error)) throw error;
  const fallback = await supabase
    .from("submissions")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (fallback.error) throw fallback.error;
  return (fallback.data || []) as Submission[];
}

export async function reviewWritingSubmission(supabase: SupabaseClient, submissionId: string, input: { score: number | null; feedback: string | null }) {
  const { data, error } = await supabase
    .from("submissions")
    .update({ score: input.score, feedback: input.feedback })
    .eq("id", submissionId)
    .select()
    .single();
  if (error) throw error;
  return data as Submission;
}

function isMissingAccessColumnsError(error: unknown) {
  const message = String((error as { message?: string })?.message || "");
  const code = String((error as { code?: string })?.code || "");
  return (
    code === "PGRST204" ||
    message.includes("is_active") ||
    message.includes("access_status") ||
    message.includes("max_devices") ||
    message.includes("group_id") ||
    message.includes("last_login_at")
  );
}

function isMissingUpdatedAtColumnError(error: unknown) {
  const message = String((error as { message?: string })?.message || "");
  const code = String((error as { code?: string })?.code || "");
  return code === "PGRST204" || message.includes("updated_at");
}

function isMissingGroupColumnError(error: unknown) {
  const message = String((error as { message?: string })?.message || "");
  const code = String((error as { code?: string })?.code || "");
  return (
    code === "PGRST204" ||
    message.includes("slug") ||
    message.includes("on conflict") ||
    (message.includes("order") && message.includes("groups"))
  );
}

function isMissingGroupLessonColumnError(error: unknown) {
  const message = String((error as { message?: string })?.message || "");
  const code = String((error as { code?: string })?.code || "");
  return (
    code === "PGRST200" ||
    code === "PGRST204" ||
    message.includes("group_id") ||
    message.includes("status") ||
    message.includes("lessons_groups") ||
    message.includes("relationship") ||
    message.includes("schema cache")
  );
}

function isMissingContentMetadataColumnError(error: unknown) {
  const message = String((error as { message?: string })?.message || "");
  const code = String((error as { code?: string })?.code || "");
  return (
    code === "PGRST204" ||
    message.includes("source_type") ||
    message.includes("content_status") ||
    message.includes("content_type") ||
    message.includes("question_count") ||
    message.includes("answer_count") ||
    message.includes("audio_detected") ||
    message.includes("warnings") ||
    message.includes("archived_at") ||
    message.includes("updated_at")
  );
}

function isMissingStudentRelationOrColumnError(error: unknown) {
  return isMissingAccessColumnsError(error) || isMissingRelationOrColumnError(error);
}

function isMissingRelationOrColumnError(error: unknown) {
  const message = String((error as { message?: string })?.message || "");
  const code = String((error as { code?: string })?.code || "");
  return (
    code === "PGRST200" ||
    code === "PGRST204" ||
    message.includes("relationship") ||
    message.includes("schema cache") ||
    message.includes("Could not find")
  );
}

function isMissingTaskGroupsError(error: unknown) {
  const message = String((error as { message?: string })?.message || "");
  const code = String((error as { code?: string })?.code || "");
  return code === "42P01" || code === "PGRST205" || message.includes("task_groups");
}

function isMissingTableError(error: unknown) {
  const message = String((error as { message?: string })?.message || "");
  const code = String((error as { code?: string })?.code || "");
  return code === "42P01" || code === "PGRST205" || message.includes("Could not find the table");
}

function normalizeSiteSettings(row: unknown): PublicSiteSettings {
  const source = (row || {}) as Partial<Record<keyof PublicSiteSettings, unknown>>;
  const defaults = getDefaultSiteSettings();
  return {
    id: cleanText(source.id, defaults.id),
    brand_name: cleanText(source.brand_name, defaults.brand_name),
    logo_text: cleanText(source.logo_text, defaults.logo_text).slice(0, 4) || defaults.logo_text,
    teacher_name: cleanText(source.teacher_name, defaults.teacher_name),
    teacher_title: cleanText(source.teacher_title, defaults.teacher_title),
    teacher_band: cleanText(source.teacher_band, defaults.teacher_band),
    teacher_bio: cleanText(source.teacher_bio, defaults.teacher_bio),
    hero_title: cleanText(source.hero_title, defaults.hero_title),
    hero_subtitle: cleanText(source.hero_subtitle, defaults.hero_subtitle),
    student_app_url: cleanNullableText(source.student_app_url),
    contact_email: cleanNullableText(source.contact_email),
    telegram_url: cleanNullableText(source.telegram_url),
    phone: cleanNullableText(source.phone),
    payments_enabled: source.payments_enabled === true,
    free_course_enabled: source.free_course_enabled !== false,
    updated_at: cleanNullableText(source.updated_at)
  };
}

function normalizeSiteSettingsInput(input: PublicSiteSettingsInput) {
  const defaults = getDefaultSiteSettings();
  return {
    brand_name: cleanText(input.brand_name, defaults.brand_name),
    logo_text: cleanText(input.logo_text, defaults.logo_text).slice(0, 4) || defaults.logo_text,
    teacher_name: cleanText(input.teacher_name, defaults.teacher_name),
    teacher_title: cleanText(input.teacher_title, defaults.teacher_title),
    teacher_band: cleanText(input.teacher_band, defaults.teacher_band),
    teacher_bio: cleanText(input.teacher_bio, defaults.teacher_bio),
    hero_title: cleanText(input.hero_title, defaults.hero_title),
    hero_subtitle: cleanText(input.hero_subtitle, defaults.hero_subtitle),
    student_app_url: cleanNullableText(input.student_app_url),
    contact_email: cleanNullableText(input.contact_email),
    telegram_url: cleanNullableText(input.telegram_url),
    phone: cleanNullableText(input.phone),
    payments_enabled: input.payments_enabled === true,
    free_course_enabled: input.free_course_enabled !== false
  };
}

function cleanText(value: unknown, fallback: string) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function cleanNullableText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "group";
}
