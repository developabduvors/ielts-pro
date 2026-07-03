export type Skill = "reading" | "listening" | "writing" | "full_test" | "vocabulary";

export type Group = {
  id: string;
  name: string;
  slug?: string | null;
  order?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type Student = {
  id: string;
  name: string;
  student_code: string;
  group_id: string | null;
  is_active?: boolean | null;
  access_status?: "open" | "closed" | string | null;
  max_devices?: number | null;
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
  groups?: Pick<Group, "name"> | null;
};

export type Lesson = {
  id: string;
  title: string;
  description: string | null;
  order: number | null;
  published: boolean | null;
  status?: "draft" | "published" | "archived" | string | null;
  skill: Skill | string | null;
  group_id?: string | null;
  created_at?: string;
  updated_at?: string;
  groups?: Pick<Group, "name" | "slug"> | null;
};

export type Task = {
  id: string;
  lesson_id: string;
  title: string;
  skill: Skill | string;
  task_type: string | null;
  content: string | null;
  order: number | null;
  audio_url?: string | null;
  html_url?: string | null;
  html_path?: string | null;
  source_type?: string | null;
  content_status?: "draft" | "assigned" | "published" | "archived" | string | null;
  content_type?: string | null;
  subtype?: string | null;
  question_count?: number | null;
  answer_count?: number | null;
  audio_detected?: boolean | null;
  warnings?: unknown;
  archived_at?: string | null;
  updated_at?: string;
  created_at?: string;
  lessons?: Pick<Lesson, "title" | "published" | "group_id"> & { groups?: Pick<Group, "name" | "slug"> | null } | null;
};

export type NewTaskInput = Pick<Task, "lesson_id" | "title" | "skill" | "task_type" | "content" | "order"> & {
  audio_url?: string | null;
  html_url?: string | null;
  html_path?: string | null;
  source_type?: string | null;
  content_status?: string | null;
  content_type?: string | null;
  subtype?: string | null;
  question_count?: number | null;
  answer_count?: number | null;
  audio_detected?: boolean | null;
  warnings?: unknown;
};

export type Submission = {
  id: string;
  student_id: string;
  task_id: string;
  answer: string | null;
  score: number | null;
  total: number | null;
  feedback: string | null;
  submitted_at: string;
  students?: Pick<Student, "name" | "student_code"> | null;
  tasks?: (Pick<Task, "title" | "skill"> & { lessons?: Pick<Lesson, "title"> | null }) | null;
};

export type StudentDeviceSession = {
  id: string;
  student_id: string;
  device_label: string | null;
  user_agent: string | null;
  device_fingerprint_hash: string | null;
  session_token_hash: string;
  is_active: boolean | null;
  revoked_at: string | null;
  revoked_by: string | null;
  revoked_by_email?: string | null;
  last_seen_at: string;
  created_at: string;
  students?: Pick<Student, "name" | "student_code"> | null;
};

export type Question = {
  type: string;
  question?: string;
  answer?: string | string[];
  options?: string[];
  items?: Array<{ label?: string; answer?: string }>;
  matchOptions?: string[];
  passage?: number;
  image_url?: string;
};

export type TaskContent = {
  passage_html?: string;
  passages?: Array<{ title?: string; html?: string }>;
  audio_url?: string;
  prompt?: string;
  instructions?: string;
  min_words?: number;
  time_limit_minutes?: number;
  duration_minutes?: number;
  difficulty?: string;
  sections?: Array<{
    skill?: Skill | string;
    title?: string;
    instructions?: string;
    passage_html?: string;
    audio_url?: string;
    transcript?: string;
    prompt?: string;
    questions?: Question[];
  }>;
  questions?: Question[];
  source_type?: string;
  import_mode?: string;
  import_structure?: string;
  subtype?: string;
  question_type?: string;
  question_count?: number;
  answer_count?: number;
  warnings?: string[];
  imported_html?: string;
  preview_text?: string;
};

export type StudentSession = Pick<Student, "id" | "name" | "student_code" | "group_id"> & {
  device_session_id: string;
  session_token: string;
};
export type AdminSession = { id: string; email: string };

export type PublicSiteSettings = {
  id: string;
  brand_name: string;
  logo_text: string;
  teacher_name: string;
  teacher_title: string;
  teacher_band: string;
  teacher_bio: string;
  hero_title: string;
  hero_subtitle: string;
  student_app_url: string | null;
  contact_email: string | null;
  telegram_url: string | null;
  phone: string | null;
  payments_enabled: boolean;
  free_course_enabled: boolean;
  updated_at: string | null;
};
