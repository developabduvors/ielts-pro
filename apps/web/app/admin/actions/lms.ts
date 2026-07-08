"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createLesson,
  createGroup,
  createServerSupabaseClient,
  createStudentAccess,
  createTask,
  revokeAllStudentDeviceSessions,
  revokeStudentDeviceSession,
  reviewWritingSubmission,
  setStudentAccessStatus,
  setTaskGroups,
  updateStudentGroup,
  updateLesson,
  updateSiteSettings,
  updateTasksForLessonStatus,
  updateTask,
  type TaskContent
} from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/admin-session";

export async function createLessonAction(formData: FormData) {
  await requireAdminSession();
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  await createLesson(createServerSupabaseClient(), {
    title,
    description: String(formData.get("description") || "").trim() || null,
    order: Number(formData.get("order") || 1),
    published: formData.get("published") === "on",
    skill: String(formData.get("skill") || "reading"),
    group_id: text(formData, "group_id") || null
  });
  revalidatePath("/lessons");
  revalidatePath("/student-control");
  revalidatePath("/dashboard");
}

export async function createGroupAction(formData: FormData) {
  await requireAdminSession();
  const name = text(formData, "group_name");
  if (!name) return;
  await createGroup(createServerSupabaseClient(), {
    name,
    order: numberField(formData, "group_order", 10)
  });
  revalidatePath("/lessons");
  revalidatePath("/students");
  revalidatePath("/student-control");
  revalidatePath("/dashboard");
}

export async function createStudentAccessAction(formData: FormData) {
  await requireAdminSession();
  const name = text(formData, "name");
  const accessId = text(formData, "access_id");
  const maxDevicesValue = text(formData, "max_devices");
  if (!name || !accessId) return;
  await createStudentAccess(createServerSupabaseClient(), {
    name,
    accessId,
    groupId: text(formData, "group_id") || null,
    maxDevices: maxDevicesValue ? Number(maxDevicesValue) : null
  });
  revalidatePath("/students");
  revalidatePath("/student-control");
}

export async function updateStudentGroupAction(formData: FormData) {
  await requireAdminSession();
  const studentId = text(formData, "student_id");
  const groupId = text(formData, "group_id") || null;
  if (!studentId) return;
  await updateStudentGroup(createServerSupabaseClient(), studentId, groupId);
  revalidatePath("/students");
  revalidatePath("/student-control");
}

export async function toggleStudentAccessAction(formData: FormData) {
  const admin = await requireAdminSession();
  const studentId = text(formData, "student_id");
  const open = text(formData, "open") === "true";
  if (!studentId) return;
  const supabase = createServerSupabaseClient();
  await setStudentAccessStatus(supabase, studentId, open);
  if (!open) await revokeAllStudentDeviceSessions(supabase, studentId, admin.email);
  revalidatePath("/students");
  revalidatePath("/student-control");
  revalidatePath("/dashboard");
}

export async function revokeDeviceSessionAction(formData: FormData) {
  const admin = await requireAdminSession();
  const sessionId = text(formData, "session_id");
  if (!sessionId) return;
  await revokeStudentDeviceSession(createServerSupabaseClient(), sessionId, admin.email);
  revalidatePath("/students");
  revalidatePath("/student-control");
  revalidatePath("/dashboard");
}

export async function revokeAllDevicesAction(formData: FormData) {
  const admin = await requireAdminSession();
  const studentId = text(formData, "student_id");
  if (!studentId) return;
  await revokeAllStudentDeviceSessions(createServerSupabaseClient(), studentId, admin.email);
  revalidatePath("/students");
  revalidatePath("/student-control");
  revalidatePath("/dashboard");
}

export async function uploadHtmlTestAction(formData: FormData) {
  await requireAdminSession();
  let successPath = "/html-tests/new";
  try {
    const file = formData.get("html_file");
    if (!isUpload(file)) throw new Error("Upload an .html file first.");
    const lowerName = String(file.name || "").toLowerCase();
    if (!lowerName.endsWith(".html") && !lowerName.endsWith(".htm")) {
      throw new Error("Only .html or .htm files are accepted.");
    }
    const title = text(formData, "title") || String(file.name || "").replace(/\.(html?|htm)$/i, "").trim() || "HTML test";
    const skill = text(formData, "skill") || "reading";
    const subtype = text(formData, "subtype");
    const published = formData.get("published") === "on";
    const supabase = createServerSupabaseClient();

    const lesson = await createLesson(supabase, {
      title,
      description: "Interactive HTML test uploaded by the teacher.",
      order: 500,
      published,
      status: published ? "published" : "draft",
      skill
    });

    const task = await createTask(supabase, {
      lesson_id: lesson.id,
      title,
      skill,
      task_type: "html_test",
      content: JSON.stringify({ source_type: "html", subtype: subtype || null }),
      order: 1,
      source_type: "html",
      subtype: subtype || null,
      content_status: published ? "published" : "draft"
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `${task.id}.html`;
    const upload = await supabase.storage
      .from("html-tests")
      .upload(storagePath, buffer, { contentType: "text/html; charset=utf-8", upsert: true });
    if (upload.error) throw new Error(`Storage upload failed: ${upload.error.message}`);

    await updateTask(supabase, task.id, { html_path: storagePath });

    revalidatePath("/lessons");
    revalidatePath("/dashboard");
    const params = new URLSearchParams({ saved: "1", title, skill, published: published ? "yes" : "no" });
    successPath = `/html-tests/new?${params.toString()}`;
  } catch (error) {
    redirect(`/html-tests/new?error=${encodeURIComponent(readableError(error))}`);
  }
  redirect(successPath);
}

export async function importHtmlContentAction(formData: FormData) {
  await requireAdminSession();
  let successPath = "/full-tests/new";
  try {
    const supabase = createServerSupabaseClient();
    const { parsed, rawHtml, contentName, contentDescription } = await readHtmlImportDraft(formData);

    const lesson = await createLesson(supabase, {
      title: `[Draft content] ${contentName}`,
      description: contentDescription || "Imported content library item. Attach it to a lesson in Content Studio before publishing.",
      order: 999,
      published: false,
      status: "draft",
      skill: parsed.skill
    });

    const task = await createTask(supabase, {
      lesson_id: lesson.id,
      title: contentName,
      skill: parsed.skill,
      task_type: parsed.taskType,
      content: JSON.stringify(parsed.content),
      order: 1,
      audio_url: parsed.audioUrl,
      source_type: "html",
      content_status: "draft",
      content_type: parsed.contentType,
      subtype: parsed.subtype,
      question_count: parsed.questionCount,
      answer_count: parsed.answerCount,
      audio_detected: Boolean(parsed.audioUrl),
      warnings: parsed.warnings
    });

    const storagePath = `${task.id}.html`;
    const upload = await supabase.storage
      .from("html-tests")
      .upload(storagePath, rawHtml, { contentType: "text/html; charset=utf-8", upsert: true });
    if (upload.error) throw new Error(`Storage upload failed: ${upload.error.message}`);

    await updateTask(supabase, task.id, { html_path: storagePath });

    revalidatePath("/full-tests/new");
    revalidatePath("/lessons");
    revalidatePath("/dashboard");
    const params = new URLSearchParams({
      saved: "1",
      task: task.id,
      name: contentName,
      skill: parsed.skill,
      questions: String(parsed.questionCount),
      answers: String(parsed.answerCount),
      audio: parsed.audioUrl ? "yes" : "no",
      warnings: String(parsed.warnings.length)
    });
    successPath = `/full-tests/new?${params.toString()}`;
  } catch (error) {
    redirectBuilderError(error);
  }
  redirect(successPath);
}

export async function previewHtmlImportAction(_previousState: HtmlPreviewState, formData: FormData): Promise<HtmlPreviewState> {
  await requireAdminSession();
  try {
    const { parsed, contentName, fileName, fileSize } = await readHtmlImportDraft(formData);
    return {
      status: "success",
      data: {
        title: contentName || parsed.title,
        fileName,
        fileSize,
        skill: parsed.skill,
        taskType: parsed.taskType,
        contentType: parsed.contentType,
        subtype: parsed.subtype,
        questionCount: parsed.questionCount,
        answerCount: parsed.answerCount,
        audioDetected: Boolean(parsed.audioUrl),
        audioUrl: parsed.audioUrl,
        warnings: parsed.warnings,
        previewText: String(parsed.content.preview_text || "").slice(0, 520)
      }
    };
  } catch (error) {
    return { status: "error", error: readableError(error) };
  }
}

export async function attachContentToLessonAction(formData: FormData) {
  await requireAdminSession();
  const taskId = text(formData, "task_id");
  const lessonId = text(formData, "lesson_id");
  if (!taskId || !lessonId) return;
  await updateTask(createServerSupabaseClient(), taskId, {
    lesson_id: lessonId,
    content_status: "assigned"
  });
  revalidatePath("/lessons");
  revalidatePath("/full-tests/new");
  revalidatePath("/dashboard");
}

export async function updateTaskGroupsAction(formData: FormData) {
  await requireAdminSession();
  const taskId = text(formData, "task_id");
  if (!taskId) return;
  const groupIds = formData.getAll("group_ids").map((value) => String(value)).filter(Boolean);
  await setTaskGroups(createServerSupabaseClient(), taskId, groupIds);
  revalidatePath("/lessons");
  revalidatePath("/dashboard");
  revalidatePath("/full-tests/new");
}

export async function updateLessonGroupAction(formData: FormData) {
  await requireAdminSession();
  const lessonId = text(formData, "lesson_id");
  const groupId = text(formData, "group_id") || null;
  if (!lessonId) return;
  await updateLesson(createServerSupabaseClient(), lessonId, { group_id: groupId });
  revalidatePath("/lessons");
  revalidatePath("/dashboard");
}

export async function toggleLessonPublishAction(formData: FormData) {
  await requireAdminSession();
  const id = String(formData.get("id") || "");
  const published = String(formData.get("published") || "") === "true";
  if (!id) return;
  const supabase = createServerSupabaseClient();
  const nextPublished = !published;
  await updateLesson(supabase, id, { published: nextPublished });
  await updateTasksForLessonStatus(supabase, id, nextPublished ? "published" : "assigned");
  revalidatePath("/lessons");
  revalidatePath("/dashboard");
  revalidatePath("/full-tests/new");
  revalidatePath("/student-control");
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

export async function updateSiteSettingsAction(formData: FormData) {
  await requireAdminSession();
  await updateSiteSettings(createServerSupabaseClient(), {
    brand_name: text(formData, "brand_name"),
    logo_text: text(formData, "logo_text"),
    teacher_name: text(formData, "teacher_name"),
    teacher_title: text(formData, "teacher_title"),
    teacher_band: text(formData, "teacher_band"),
    teacher_bio: text(formData, "teacher_bio"),
    hero_title: text(formData, "hero_title"),
    hero_subtitle: text(formData, "hero_subtitle"),
    student_app_url: text(formData, "student_app_url") || null,
    contact_email: text(formData, "contact_email") || null,
    telegram_url: text(formData, "telegram_url") || null,
    phone: text(formData, "phone") || null,
    payments_enabled: formData.get("payments_enabled") === "on",
    free_course_enabled: formData.get("free_course_enabled") === "on"
  });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function numberField(formData: FormData, key: string, fallback: number) {
  const value = Number(formData.get(key) || fallback);
  return Number.isFinite(value) ? value : fallback;
}

function isUpload(value: FormDataEntryValue | null): value is File {
  return !!value && typeof value === "object" && "arrayBuffer" in value && "name" in value && "size" in value && Number(value.size) > 0;
}

export type HtmlPreviewState = {
  status: "idle" | "success" | "error";
  error?: string;
  data?: {
    title: string;
    fileName: string;
    fileSize: number;
    skill: string;
    taskType: string;
    contentType: string;
    subtype: string;
    questionCount: number;
    answerCount: number;
    audioDetected: boolean;
    audioUrl: string | null;
    warnings: string[];
    previewText: string;
  };
};

type HtmlImportInput = {
  fileName: string;
  mode: string;
  structure: string;
  skill: string;
  subtype: string;
  questionType: string;
  manualAudioUrl: string;
};

async function readHtmlImportDraft(formData: FormData): Promise<{
  parsed: ReturnType<typeof parseHtmlImport>;
  rawHtml: string;
  contentName: string;
  contentDescription: string;
  fileName: string;
  fileSize: number;
}> {
  const file = formData.get("html_file");
  const fallbackHtml = String(formData.get("html_text") || "");
  const fallbackFileName = text(formData, "html_text_file_name");
  const fallbackFileSize = Number(text(formData, "html_text_file_size") || 0);
  const hasFile = isUpload(file);
  if (!hasFile && !fallbackHtml.trim()) throw new Error("Upload an .html file first.");
  const fileName = hasFile ? String(file.name || "").trim() : fallbackFileName || "uploaded.html";
  const lowerName = fileName.toLowerCase();
  if (!lowerName.endsWith(".html") && !lowerName.endsWith(".htm")) {
    throw new Error("Only .html and .htm files are accepted. JSON, TXT, PDF, and DOCX are not supported in Test Builder.");
  }
  const rawHtml = hasFile ? await file.text() : fallbackHtml;
  const parsed = parseHtmlImport(rawHtml, {
    fileName,
    mode: text(formData, "import_mode") || "separate_skill",
    structure: text(formData, "import_structure") || "auto_detect",
    skill: text(formData, "skill") || "auto",
    subtype: text(formData, "subtype"),
    questionType: text(formData, "question_type"),
    manualAudioUrl: text(formData, "manual_audio_url")
  });
  return {
    parsed,
    rawHtml,
    contentName: text(formData, "content_name") || parsed.title,
    contentDescription: text(formData, "content_description"),
    fileName,
    fileSize: hasFile ? Number(file.size) || rawHtml.length : fallbackFileSize || rawHtml.length
  };
}

function parseHtmlImport(rawHtml: string, input: HtmlImportInput): {
  title: string;
  skill: "reading" | "listening" | "writing" | "full_test";
  taskType: string;
  contentType: string;
  subtype: string;
  audioUrl: string | null;
  questionCount: number;
  answerCount: number;
  warnings: string[];
  content: TaskContent;
} {
  const sanitized = sanitizeImportedHtml(rawHtml);
  const textContent = htmlToText(sanitized);
  if (!textContent || textContent.length < 20) throw new Error("This HTML file looks empty. Upload an IELTS test HTML with passage, prompt, or questions.");
  const inferredSkill = inferSkill(input.skill, sanitized, textContent);
  const skill = input.mode === "full_mock" || input.skill === "full_test" ? "full_test" : inferredSkill;
  const audioUrl = input.manualAudioUrl || extractAudioUrl(sanitized);
  const title = extractHtmlTitle(sanitized) || titleFromFile(input.fileName);
  const answerValues = extractAnswerKeyValues(sanitized, textContent);
  const questions = inferQuestions(sanitized, textContent, input.questionType, answerValues);
  const questionCount = countImportedQuestionUnits(questions);
  const answerCount = answerValues.length;
  const warnings: string[] = [];
  if (!questionCount && skill !== "writing") warnings.push("No objective question inputs were detected. Use Content Studio preview before publishing.");
  if (questionCount && !answerCount && skill !== "writing") warnings.push("No answer key was detected. Students can open this test, but auto-scoring will need teacher review.");
  if (questionCount && answerCount && answerCount < questionCount && skill !== "writing") warnings.push(`Only ${answerCount} answer key value(s) were detected for ${questionCount} question(s). Check the imported answer key before publishing.`);
  if (skill === "listening" && !audioUrl) warnings.push("No audio URL was detected. Add audio metadata before assigning this listening test.");
  if (skill === "writing" && textContent.length < 40) warnings.push("Writing prompt is very short. Check the preview before publishing.");
  const subtype = input.subtype || defaultSubtype(skill, input.structure);
  const content: TaskContent = {
    source_type: "html",
    import_mode: input.mode,
    import_structure: input.structure,
    subtype,
    question_type: input.questionType || undefined,
    instructions: defaultInstructions(skill),
    passage_html: skill === "reading" || skill === "full_test" ? sanitized : undefined,
    imported_html: sanitized,
    audio_url: audioUrl || undefined,
    prompt: skill === "writing" ? textContent : undefined,
    questions,
    question_count: questionCount,
    answer_count: answerCount,
    warnings,
    preview_text: textContent.slice(0, 1200)
  };
  if (skill === "listening") {
    content.passage_html = sanitized;
  }
  return {
    title,
    skill,
    taskType: skill === "writing" ? "writing_task" : skill === "full_test" ? "full_test" : "imported_html",
    contentType: skill,
    subtype,
    audioUrl: audioUrl || null,
    questionCount,
    answerCount,
    warnings,
    content
  };
}

function sanitizeImportedHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/\son\w+=\S+/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
}

function htmlToText(html: string) {
  return html
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractHtmlTitle(html: string) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ||
    html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1];
  return title ? htmlToText(title).slice(0, 120).trim() : "";
}

function titleFromFile(fileName: string) {
  return fileName.replace(/\.(html|htm)$/i, "").replace(/[-_]+/g, " ").trim() || "Imported IELTS content";
}

function inferSkill(value: string, html: string, textValue: string): "reading" | "listening" | "writing" {
  if (value === "listening" || value === "writing") return value;
  if (value === "reading") return "reading";
  const sample = `${html} ${textValue}`.toLowerCase();
  if (sample.includes("<audio") || sample.includes(".mp3") || sample.includes("listening")) return "listening";
  if (sample.includes("writing task") || sample.includes("write at least") || sample.includes("essay")) return "writing";
  return "reading";
}

function extractAudioUrl(html: string) {
  const direct = html.match(/<(?:audio|source)[^>]+src=["']([^"']+)["']/i)?.[1] ||
    html.match(/href=["']([^"']+\.(?:mp3|wav|m4a|ogg)(?:\?[^"']*)?)["']/i)?.[1];
  return direct ? direct.trim() : "";
}

function extractAnswerKeyValues(html: string, textValue: string) {
  const dataAnswers = extractDataAnswerValues(html);
  if (dataAnswers.length) return dataAnswers;
  const listAnswers = extractHtmlListAnswerValues(html);
  if (listAnswers.length) return listAnswers;
  return extractTextAnswerValues(textValue);
}

function extractDataAnswerValues(html: string) {
  const values: string[] = [];
  const pattern = /\bdata-(?:answer|answer-key|correct|correct-answer)=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const value = cleanAnswerValue(match[1]);
    if (value) values.push(value);
  }
  return values;
}

function extractHtmlListAnswerValues(html: string) {
  const answerHtmlSection =
    html.match(/<[^>]+data-answer-key[^>]*>([\s\S]*?)<\/(?:section|div|ol|ul)>/i)?.[1] ||
    html.match(/<(?:h[1-6]|strong|b)[^>]*>\s*(?:answers?|answer\s*key)\s*<\/(?:h[1-6]|strong|b)>[\s\S]*?(<ol[\s\S]*?<\/ol>|<ul[\s\S]*?<\/ul>)/i)?.[1] ||
    "";
  if (!answerHtmlSection) return [];

  const values: string[] = [];
  const pattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(answerHtmlSection)) !== null) {
    const value = cleanAnswerValue(match[1]);
    if (value) values.push(value);
  }
  return values;
}

function extractTextAnswerValues(textValue: string) {
  const answerSection = textValue.match(/(?:answer\s*key|answers?)\s*[:\n]+([\s\S]+)/i)?.[1] || "";
  if (!answerSection) return [];
  const limitedSection = answerSection.split(/\n+/).slice(0, 80).join("\n");
  const values: string[] = [];

  for (const line of limitedSection.split(/\n+/)) {
    const cleanedLine = line.trim();
    if (!cleanedLine) continue;
    const direct = cleanedLine.match(/^\s*(?:\d{1,2}|[A-D])(?:[\).:\-]|\s)\s*(.+)$/i)?.[1];
    const value = cleanAnswerValue(direct || "");
    if (value) values.push(value);
  }

  if (values.length) return values;

  const inlineValues: string[] = [];
  const inlinePattern = /(?:^|\s)\d{1,2}[\).:\-]\s*([^0-9\n;|]+?)(?=\s+\d{1,2}[\).:\-]|$)/g;
  let match: RegExpExecArray | null;
  while ((match = inlinePattern.exec(limitedSection)) !== null) {
    const value = cleanAnswerValue(match[1]);
    if (value) inlineValues.push(value);
  }
  if (inlineValues.length) return inlineValues;

  if (limitedSection.length > 800) return [];
  return limitedSection
    .split(/[,;\n|]+/)
    .map(cleanAnswerValue)
    .filter(Boolean);
}

function cleanAnswerValue(value: string) {
  const cleaned = htmlToText(value)
    .replace(/^(?:answer\s*)?(?:\d{1,2}|[A-D])(?:[\).:\-]|\s)+/i, "")
    .replace(/^[\s:;,\-–—]+|[\s:;,\-–—]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || /^(?:answer\s*key|answers?)$/i.test(cleaned)) return "";
  if (cleaned.length > 80) return "";
  return cleaned;
}

function inferQuestions(html: string, textValue: string, questionType: string, answerValues: string[] = []): NonNullable<TaskContent["questions"]> {
  const inputCount = (html.match(/<(?:input|select|textarea)\b/gi) || []).length;
  const numberedLines = extractNumberedQuestionLines(textValue);
  const rangedCount = countQuestionRanges(textValue);
  const blankCount = countCompletionBlanks(html, textValue);
  const bracketedNumbers = countBracketedQuestionNumbers(textValue);
  const dataQuestions = (html.match(/\bdata-(?:question|blank|q)(?:-id)?=/gi) || []).length;
  const structuredTotal = Math.max(inputCount, numberedLines.length, rangedCount, blankCount, dataQuestions);
  const total = Math.min(structuredTotal || bracketedNumbers, 40);
  if (!total) return [];
  const type = mapQuestionType(questionType);
  const answers = answerValues.map(cleanAnswerValue);
  if (isCompletionType(type)) {
    const labels = extractCompletionLabels(textValue, total);
    return [{
      type,
      question: labelQuestionType(type),
      items: Array.from({ length: total }, (_, index) => ({ label: labels[index] || `Question ${index + 1}: ___`, answer: answers[index] || "" }))
    }];
  }
  return Array.from({ length: total }, (_, index) => ({
    type: type || "short_answer",
    question: numberedLines[index]?.replace(/^\s*\d{1,2}[\).]\s*/, "") || `Question ${index + 1}`,
    answer: answers[index] || ""
  }));
}

function extractNumberedQuestionLines(textValue: string) {
  return textValue
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => /^(?:\d{1,2}[\).]|Question\s+\d+)/i.test(line));
}

function countQuestionRanges(textValue: string) {
  const numbers = new Set<number>();
  const rangePattern = /Questions?\s+(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})/gi;
  let match: RegExpExecArray | null;
  while ((match = rangePattern.exec(textValue)) !== null) {
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
      for (let number = start; number <= end; number += 1) numbers.add(number);
    }
  }
  return numbers.size;
}

function countCompletionBlanks(html: string, textValue: string) {
  const visualBlanks = (textValue.match(/_{3,}|\.{4,}|-{4,}/g) || []).length;
  const htmlBlanks = (html.match(/(?:class|data-type)=["'][^"']*(?:blank|gap|completion)[^"']*["']/gi) || []).length;
  const labelledBoxes = (textValue.match(/\b(?:box|blank|gap)\s+\d{1,2}\b/gi) || []).length;
  return Math.max(visualBlanks, htmlBlanks, labelledBoxes);
}

function countBracketedQuestionNumbers(textValue: string) {
  const matches = textValue.match(/(?:^|\s)(?:\[\s*)?\d{1,2}(?:\s*\])?(?=\s|$|\.|\))/g) || [];
  return matches.length;
}

function countImportedQuestionUnits(questions: NonNullable<TaskContent["questions"]>) {
  return questions.reduce((sum, question) => sum + (question.items?.length || 1), 0);
}

function extractCompletionLabels(textValue: string, total: number) {
  const lines = textValue
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const labels: string[] = [];
  for (const line of lines) {
    if (labels.length >= total) break;
    if (/_{3,}|\.{4,}|-{4,}/.test(line) || /^\d{1,2}[\).]/.test(line)) {
      labels.push(line.replace(/\s+/g, " ").slice(0, 120));
    }
  }
  return labels;
}

function mapQuestionType(value: string) {
  const normalised = value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  if (normalised.includes("true_false") || normalised === "tfng") return "tfng";
  if (normalised.includes("yes_no") || normalised === "ynng") return "ynng";
  if (normalised.includes("multiple")) return "mcq";
  if (normalised.includes("summary")) return "summary_completion";
  if (normalised.includes("note")) return "note_completion";
  if (normalised.includes("table")) return "table_completion";
  if (normalised.includes("flow")) return "flow_chart";
  if (normalised.includes("sentence")) return "sentence_completion";
  if (normalised.includes("short")) return "short_answer";
  if (normalised.includes("matching")) return "matching";
  return normalised || "short_answer";
}

function labelQuestionType(type: string) {
  return type.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function defaultSubtype(skill: string, structure: string) {
  if (structure && structure !== "auto_detect") return structure;
  if (skill === "listening") return "listening_part";
  if (skill === "writing") return "writing_task";
  if (skill === "full_test") return "full_test";
  return "reading_passage";
}

function defaultInstructions(skill: string) {
  if (skill === "listening") return "Listen to the audio and answer the questions.";
  if (skill === "writing") return "Read the prompt and write your IELTS response.";
  if (skill === "full_test") return "Complete the IELTS practice content and submit your answers.";
  return "Read the passage and answer the questions.";
}

function isCompletionType(type: string) {
  return ["note_completion", "summary_completion", "table_completion", "flow_chart", "sentence_completion"].includes(type);
}

function readableError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Could not save this content. Check the HTML file and required fields.";
}

function redirectBuilderError(error: unknown): never {
  redirect(`/full-tests/new?error=${encodeURIComponent(readableError(error))}`);
}
