export type Skill = "reading" | "listening" | "writing" | "full_test" | "vocabulary";

export type Group = {
  id: string;
  name: string;
  created_at?: string;
};

export type Student = {
  id: string;
  name: string;
  student_code: string;
  group_id: string | null;
  created_at?: string;
  groups?: Pick<Group, "name"> | null;
};

export type Lesson = {
  id: string;
  title: string;
  description: string | null;
  order: number | null;
  published: boolean | null;
  skill: Skill | string | null;
  created_at?: string;
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
  created_at?: string;
  lessons?: Pick<Lesson, "title" | "published"> | null;
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
  questions?: Question[];
};

export type StudentSession = Pick<Student, "id" | "name" | "student_code" | "group_id">;
export type AdminSession = { id: string; email: string };
