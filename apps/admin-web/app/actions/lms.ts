"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createLesson,
  createServerSupabaseClient,
  createTask,
  reviewWritingSubmission,
  updateLesson,
  type Question,
  type TaskContent
} from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/session";

const AUDIO_BUCKET = "task-media";

export async function createLessonAction(formData: FormData) {
  await requireAdminSession();
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  await createLesson(createServerSupabaseClient(), {
    title,
    description: String(formData.get("description") || "").trim() || null,
    order: Number(formData.get("order") || 1),
    published: formData.get("published") === "on",
    skill: String(formData.get("skill") || "reading")
  });
  revalidatePath("/lessons");
  revalidatePath("/dashboard");
}

export async function createFullTestDraftAction(formData: FormData) {
  await requireAdminSession();
  try {
    const supabase = createServerSupabaseClient();
    const title = requiredText(formData, "title");
    const uploadedAudioUrl = await uploadAudioIfPresent(supabase, formData);
    const manualAudioUrl = text(formData, "audio_url");
    const audioUrl = uploadedAudioUrl || manualAudioUrl || null;
    const content = buildFullTestContent(formData, audioUrl);

    const lesson = await createLesson(supabase, {
      title,
      description: text(formData, "description") || "Full IELTS practice test",
      order: numberField(formData, "order", 1),
      published: formData.get("published") === "on",
      skill: "full_test"
    });

    await createTask(supabase, {
      lesson_id: lesson.id,
      title,
      skill: "full_test",
      task_type: "full_test",
      content: JSON.stringify(content),
      order: 1,
      audio_url: audioUrl
    });

    revalidatePath("/lessons");
    revalidatePath("/full-tests");
    revalidatePath("/dashboard");
  } catch (error) {
    redirectBuilderError(error);
  }
  redirect("/full-tests");
}

export async function importFullTestJsonAction(formData: FormData) {
  await requireAdminSession();
  try {
    const supabase = createServerSupabaseClient();
    const rawJson = await readJsonImport(formData, "import_json", "json_file");
    if (!rawJson) throw new Error("Paste JSON or upload a .json file first.");

    const imported = parseFullTestImport(rawJson);
    const lesson = await createLesson(supabase, {
      title: imported.title,
      description: imported.description || "Imported full IELTS practice test",
      order: imported.order,
      published: imported.published,
      skill: "full_test"
    });

    await createTask(supabase, {
      lesson_id: lesson.id,
      title: imported.title,
      skill: "full_test",
      task_type: "full_test",
      content: JSON.stringify(imported.content),
      order: 1,
      audio_url: imported.content.audio_url || null
    });

    revalidatePath("/lessons");
    revalidatePath("/full-tests");
    revalidatePath("/dashboard");
  } catch (error) {
    redirectBuilderError(error);
  }
  redirect("/full-tests");
}

export async function importSkillJsonAction(formData: FormData) {
  await requireAdminSession();
  try {
    const supabase = createServerSupabaseClient();
    const skill = normaliseSkill(text(formData, "skill"));
    const rawJson = await readJsonImport(formData, `${skill}_import_json`, `${skill}_json_file`);
    if (!rawJson) throw new Error(`Paste ${skill} JSON or upload a .json file first.`);

    const imported = parseSkillImport(rawJson, skill);
    const lesson = await createLesson(supabase, {
      title: imported.title,
      description: imported.description,
      order: imported.order,
      published: imported.published,
      skill
    });

    await createTask(supabase, {
      lesson_id: lesson.id,
      title: imported.title,
      skill,
      task_type: imported.taskType,
      content: JSON.stringify(imported.content),
      order: 1,
      audio_url: imported.content.audio_url || null
    });

    revalidatePath("/lessons");
    revalidatePath("/full-tests");
    revalidatePath("/dashboard");
  } catch (error) {
    redirectBuilderError(error);
  }
  redirect("/full-tests");
}

export async function toggleLessonPublishAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") || "");
  const published = String(formData.get("published") || "") === "true";
  if (!id) return;
  await updateLesson(createServerSupabaseClient(), id, { published: !published });
  revalidatePath("/lessons");
  revalidatePath("/dashboard");
}

export async function reviewSubmissionAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") || "");
  const scoreValue = String(formData.get("score") || "").trim();
  if (!id) return;
  await reviewWritingSubmission(createServerSupabaseClient(), id, {
    score: scoreValue ? Number(scoreValue) : null,
    feedback: String(formData.get("feedback") || "").trim() || null
  });
  revalidatePath("/submissions");
  revalidatePath("/dashboard");
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function requiredText(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

function numberField(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key) || fallback);
  return Number.isFinite(value) ? value : fallback;
}

function lines(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function maybeQuestion(formData: FormData, prefix: string): Question | null {
  const question = text(formData, `${prefix}_question`);
  const type = text(formData, `${prefix}_question_type`) || "mcq";
  if (!question && !text(formData, `${prefix}_note_items`)) return null;
  const options = lines(text(formData, `${prefix}_options`));
  const answer = text(formData, `${prefix}_answer`);
  if (isCompletionType(type)) {
    const labels = lines(text(formData, `${prefix}_note_items`));
    const answers = lines(text(formData, `${prefix}_note_answers`));
    return {
      type,
      question: question || "Complete the notes below.",
      items: labels.map((label, index) => ({ label, answer: answers[index] || "" }))
    };
  }
  if (type === "mcq_multi") {
    return {
      type,
      question,
      options: options.length ? options : undefined,
      answer: lines(answer)
    };
  }
  return {
    type: options.length && type === "mcq" ? "mcq" : type,
    question,
    options: options.length ? options : undefined,
    answer
  };
}

function buildFullTestContent(formData: FormData, audioUrl: string | null): TaskContent {
  const readingPassage = text(formData, "reading_passage");
  const readingQuestion = maybeQuestion(formData, "reading");
  const listeningQuestion = maybeQuestion(formData, "listening");
  const writingTask1 = text(formData, "writing_task_1");
  const writingTask2 = text(formData, "writing_task_2");
  const questions = [readingQuestion, listeningQuestion].filter(Boolean) as Question[];

  return {
    difficulty: text(formData, "difficulty") || "academic",
    duration_minutes: numberField(formData, "duration_minutes", 180),
    time_limit_minutes: numberField(formData, "duration_minutes", 180),
    passage_html: readingPassage ? `<p>${escapeHtml(readingPassage).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br />")}</p>` : undefined,
    audio_url: audioUrl || undefined,
    prompt: [writingTask1, writingTask2].filter(Boolean).join("\n\n"),
    instructions: text(formData, "instructions") || "Complete each IELTS section and submit your answers for review.",
    sections: [
      {
        skill: "reading",
        title: text(formData, "reading_title") || "Reading section",
        instructions: "Read the passage and answer the questions.",
        passage_html: readingPassage ? `<p>${escapeHtml(readingPassage).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br />")}</p>` : undefined,
        questions: readingQuestion ? [readingQuestion] : []
      },
      {
        skill: "listening",
        title: text(formData, "listening_title") || "Listening section",
        instructions: "Listen once or twice, then answer the question.",
        audio_url: audioUrl || undefined,
        transcript: text(formData, "listening_transcript") || undefined,
        questions: listeningQuestion ? [listeningQuestion] : []
      },
      {
        skill: "writing",
        title: "Writing section",
        instructions: text(formData, "writing_instructions") || "Write your response for Task 1 and Task 2.",
        prompt: [writingTask1, writingTask2].filter(Boolean).join("\n\n")
      }
    ],
    questions
  };
}

async function uploadAudioIfPresent(supabase: ReturnType<typeof createServerSupabaseClient>, formData: FormData) {
  const file = formData.get("audio_file");
  if (!isUpload(file)) return null;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 90) || "listening-audio";
  const path = `listening/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(AUDIO_BUCKET).upload(path, file, {
    contentType: file.type || "audio/mpeg",
    upsert: false
  });
  if (error) throw error;
  return supabase.storage.from(AUDIO_BUCKET).getPublicUrl(path).data.publicUrl;
}

function isUpload(value: FormDataEntryValue | null): value is File {
  return !!value && typeof value === "object" && "arrayBuffer" in value && "name" in value && "size" in value && Number(value.size) > 0;
}

async function readJsonImport(formData: FormData, textKey: string, fileKey: string) {
  const pasted = text(formData, textKey);
  if (pasted) return pasted;
  const file = formData.get(fileKey);
  if (!isUpload(file)) return "";
  return file.text();
}

function parseFullTestImport(rawJson: string): { title: string; description: string | null; order: number; published: boolean; content: TaskContent } {
  const parsed = parseJsonObject(rawJson);
  const title = String(parsed.title || "").trim();
  if (!title) throw new Error("Imported JSON must include a title.");
  const content = normaliseImportedContent(parsed);
  return {
    title,
    description: typeof parsed.description === "string" ? parsed.description : null,
    order: typeof parsed.order === "number" ? parsed.order : 1,
    published: parsed.published === true,
    content
  };
}

function parseSkillImport(rawJson: string, skill: "reading" | "listening" | "writing"): { title: string; description: string | null; order: number; published: boolean; taskType: string; content: TaskContent } {
  const parsed = parseJsonObject(rawJson);
  const section = pickSkillSection(parsed, skill);
  const title = String(section.title || parsed.title || `${labelSkill(skill)} practice`).trim();
  const questions = Array.isArray(section.questions) ? section.questions as Question[] : Array.isArray(parsed.questions) ? parsed.questions as Question[] : [];
  const content: TaskContent = {
    instructions: typeof section.instructions === "string" ? section.instructions : typeof parsed.instructions === "string" ? parsed.instructions : undefined,
    time_limit_minutes: typeof parsed.time_limit_minutes === "number" ? parsed.time_limit_minutes : undefined,
    passage_html: skill === "reading" && typeof section.passage_html === "string" ? section.passage_html : typeof parsed.passage_html === "string" ? parsed.passage_html : undefined,
    audio_url: skill === "listening" && typeof section.audio_url === "string" ? section.audio_url : typeof parsed.audio_url === "string" ? parsed.audio_url : undefined,
    prompt: skill === "writing" && typeof section.prompt === "string" ? section.prompt : typeof parsed.prompt === "string" ? parsed.prompt : undefined,
    questions
  };
  return {
    title,
    description: typeof parsed.description === "string" ? parsed.description : `${labelSkill(skill)} JSON import`,
    order: typeof parsed.order === "number" ? parsed.order : 1,
    published: parsed.published === true,
    taskType: skill === "writing" ? "writing_task" : `${skill}_practice`,
    content
  };
}

function parseJsonObject(rawJson: string) {
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("JSON root must be an object.");
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error(`JSON syntax error: ${error.message}`);
    throw error;
  }
}

function pickSkillSection(parsed: Record<string, unknown>, skill: "reading" | "listening" | "writing") {
  const sections = Array.isArray(parsed.sections) ? parsed.sections as Array<Record<string, unknown>> : [];
  return sections.find((section) => section.skill === skill) || parsed;
}

function normaliseImportedContent(parsed: Record<string, unknown>): TaskContent {
  const sections = Array.isArray(parsed.sections) ? parsed.sections as TaskContent["sections"] : undefined;
  const questions = Array.isArray(parsed.questions)
    ? parsed.questions as Question[]
    : (sections || []).flatMap((section) => Array.isArray(section?.questions) ? section.questions : []);
  const audioUrl = typeof parsed.audio_url === "string"
    ? parsed.audio_url
    : sections?.find((section) => typeof section?.audio_url === "string")?.audio_url;

  return {
    difficulty: typeof parsed.difficulty === "string" ? parsed.difficulty : "academic",
    duration_minutes: typeof parsed.duration_minutes === "number" ? parsed.duration_minutes : 180,
    time_limit_minutes: typeof parsed.time_limit_minutes === "number" ? parsed.time_limit_minutes : typeof parsed.duration_minutes === "number" ? parsed.duration_minutes : 180,
    passage_html: typeof parsed.passage_html === "string" ? parsed.passage_html : sections?.find((section) => typeof section?.passage_html === "string")?.passage_html,
    audio_url: audioUrl,
    prompt: typeof parsed.prompt === "string" ? parsed.prompt : sections?.filter((section) => section?.skill === "writing").map((section) => section?.prompt).filter(Boolean).join("\n\n"),
    instructions: typeof parsed.instructions === "string" ? parsed.instructions : "Imported IELTS full test.",
    sections,
    questions
  };
}

function normaliseSkill(value: string): "reading" | "listening" | "writing" {
  if (value === "listening" || value === "writing") return value;
  return "reading";
}

function labelSkill(skill: "reading" | "listening" | "writing") {
  if (skill === "reading") return "Reading";
  if (skill === "listening") return "Listening";
  return "Writing";
}

function isCompletionType(type: string) {
  return ["note_completion", "summary_completion", "table_completion", "flow_chart", "sentence_completion"].includes(type);
}

function readableError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Could not save this test. Check the JSON and required fields.";
}

function redirectBuilderError(error: unknown): never {
  redirect(`/full-tests/new?error=${encodeURIComponent(readableError(error))}`);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
