import type { PublicSiteSettings } from "./types.js";

export const siteContent = {
  brand: "IELTS Pro",
  teacher: "Miravzal",
  paymentsEnabled: false,
  homeCards: [
    {
      title: "Practice Tests",
      label: "Free",
      tone: "practice",
      description: "Exam-style reading, listening, and writing practice with clean student progress.",
      href: "/practice-tests",
      action: "Start practice"
    },
    {
      title: "Article Lessons",
      label: "Reading",
      tone: "article",
      description: "Guided articles with vocabulary, comprehension checks, and reading routines.",
      href: "/article-lessons",
      action: "Explore"
    },
    {
      title: "Listening Course",
      label: "Course",
      tone: "listening",
      description: "Short listening lessons for map, note, and section practice.",
      href: "/free-course",
      action: "Start learning"
    }
  ],
  updates: [
    {
      label: "New",
      title: "Writing practice is ready",
      description: "Task 1 and Task 2 prompts open in a focused exam workspace.",
      href: "/writing-practice",
      action: "Start writing"
    },
    {
      label: "Live",
      title: "Teacher-issued student portal",
      description: "Private access IDs connect each student to assigned IELTS work.",
      href: "/login",
      action: "Student login"
    },
    {
      label: "Blog",
      title: "How to build a weekly IELTS routine",
      description: "A practical study plan for students who need structure.",
      href: "/blog",
      action: "Read article"
    }
  ],
  skills: [
    {
      slug: "listening",
      title: "Listening",
      duration: "30 min",
      detail: "Audio sections, note completion, maps, and MCQ drills",
      countLabel: "2 tests",
      tone: "listening"
    },
    {
      slug: "reading",
      title: "Reading",
      duration: "60 min",
      detail: "Academic passages with completion, headings, and matching",
      countLabel: "38 tests",
      tone: "reading"
    },
    {
      slug: "writing",
      title: "Writing",
      duration: "60 min",
      detail: "Task 1 and Task 2 prompts with teacher review flow",
      countLabel: "Practice now",
      tone: "writing"
    },
    {
      slug: "speaking",
      title: "Speaking",
      duration: "11-14 min",
      detail: "Part 1, 2, and 3 speaking practice structure",
      countLabel: "Guide mode",
      tone: "speaking"
    }
  ],
  mockExam: {
    modules: [
      { title: "Listening", duration: "30 min", description: "Four-section audio test with answer sheet timing." },
      { title: "Reading", duration: "60 min", description: "Three academic passages in a split-screen layout." },
      { title: "Writing", duration: "60 min", description: "Task 1 and Task 2 responses ready for teacher feedback." },
      { title: "Speaking", duration: "15 min", description: "Structured speaking prompts for examiner-style practice." }
    ],
    included: [
      { title: "Real exam conditions", description: "Timers, section navigation, and answer review before submit." },
      { title: "Computer-based interface", description: "Split reading/listening workspace with answer inputs on the right." },
      { title: "Teacher feedback queue", description: "Writing and speaking work can be reviewed from the admin panel." },
      { title: "Score breakdown", description: "Results are stored by student, skill, lesson, and attempt." },
      { title: "Content control", description: "Teachers decide which group sees each lesson or full test." },
      { title: "Progress history", description: "Students can return to attempts and see reviewed work." }
    ]
  },
  articles: [
    {
      slug: "history-of-chocolate",
      title: "History of Chocolate",
      category: "History",
      level: "Bands 6.5-7.5",
      readTime: "10 min",
      words: 1186,
      reads: 2256,
      theme: "chocolate",
      excerpt: "A leveled article for learning chronology, contrast, and cause-and-effect language.",
      body: [
        "The history of chocolate begins with cacao beans, long before chocolate became a sweet product. Early communities used cacao in drinks, ceremonies, and trade. The meaning of chocolate changed as it moved through different cultures.",
        "For IELTS students, this topic is useful because it includes dates, changes over time, and comparisons between past and modern habits. These are common features in reading passages and writing task explanations.",
        "When reading an article like this, focus on how each paragraph develops one clear idea. Underline names, dates, and contrast signals such as however, although, and in contrast."
      ]
    },
    {
      slug: "murder-victim-dna",
      title: "Murder victim had two sets of DNA",
      category: "Science",
      level: "Bands 5-6",
      readTime: "8 min",
      words: 840,
      reads: 1483,
      theme: "science",
      excerpt: "A science article for practicing detail matching and inference.",
      body: [
        "DNA evidence can appear simple in crime stories, but real investigations are often more complicated. In rare cases, a person can carry cells with different genetic patterns.",
        "This article helps students practice careful reading. The main skill is separating what the passage says from what it only suggests.",
        "IELTS questions often test whether you can avoid assumptions. Read the wording closely before choosing True, False, or Not Given."
      ]
    },
    {
      slug: "why-students-run-out-of-time",
      title: "Why students run out of time",
      category: "Study",
      level: "Bands 6-7",
      readTime: "7 min",
      words: 760,
      reads: 1012,
      theme: "study",
      excerpt: "A practical guide to pacing reading and listening sections.",
      body: [
        "Many students lose time not because they read slowly, but because they reread without a reason. A better approach is to decide what information you need before you search for it.",
        "In reading, spend the first minute understanding the passage structure. In listening, use the pause before the audio to predict the type of answer.",
        "Good pacing is a habit. Track where time is lost, then practice only that step until it becomes automatic."
      ]
    },
    {
      slug: "maps-in-listening",
      title: "Maps in listening tests",
      category: "Listening",
      level: "Bands 5.5-7",
      readTime: "6 min",
      words: 690,
      reads: 930,
      theme: "maps",
      excerpt: "How to follow direction language without getting lost.",
      body: [
        "Map questions become easier when you listen for movement words: opposite, next to, past, turn left, and at the end of.",
        "Before the recording starts, mark the fixed places on the map. This gives your listening a stable reference point.",
        "If you miss one answer, keep moving. The next direction usually gives a new clue."
      ]
    }
  ],
  writingPrompts: [
    {
      slug: "hydroelectric-power-dam",
      task: "Task 1",
      type: "Map",
      title: "Hydroelectric power dam",
      time: "20 min",
      minWords: 150,
      prompt: "The maps show the changes in an area after the construction of a hydroelectric power dam. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
      visual: "map"
    },
    {
      slug: "school-teacher-salaries",
      task: "Task 1",
      type: "Table",
      title: "Salaries of school teachers",
      time: "20 min",
      minWords: 150,
      prompt: "The table compares the salaries of secondary school teachers in five countries in 2009. Summarise the information by selecting and reporting the main features.",
      visual: "table"
    },
    {
      slug: "online-education",
      task: "Task 2",
      type: "Essay",
      title: "Online education",
      time: "40 min",
      minWords: 250,
      prompt: "Some people believe online education is more effective than classroom learning, while others disagree. Discuss both views and give your own opinion.",
      visual: "essay"
    }
  ],
  listeningCourse: [
    {
      day: "Day 1",
      title: "IELTS Listening Part 1",
      description: "Learn the format and build a note-completion routine.",
      icons: ["play", "audio", "worksheet"]
    },
    {
      day: "Day 2",
      title: "IELTS Listening Part 2",
      description: "Practice maps, directions, and public-place vocabulary.",
      icons: ["play", "audio", "map"]
    },
    {
      day: "Day 3",
      title: "Maps and labels",
      description: "Train location language before the audio starts.",
      icons: ["play", "pin", "worksheet"]
    }
  ],
  successStories: [
    { name: "Aziza K.", skill: "Overall", before: "5.5", after: "7.5", quote: "The weekly structure helped me find weak points and improve two bands." },
    { name: "Bobur M.", skill: "Listening", before: "6.0", after: "8.0", quote: "Predicting answers before the recording changed my listening score." },
    { name: "Dilnoza R.", skill: "Overall", before: "5.0", after: "7.0", quote: "I finally understood what to practice instead of repeating random tests." },
    { name: "Sardor T.", skill: "Reading", before: "6.5", after: "8.5", quote: "The reading routine helped me finish with time to review answers." },
    { name: "Madina Y.", skill: "Overall", before: "5.5", after: "7.0", quote: "Clear feedback made each week easier to plan." },
    { name: "Jasur N.", skill: "Listening", before: "6.0", after: "8.0", quote: "The practice felt close to the real computer-based test." }
  ]
} as const;

export type PublicArticle = (typeof siteContent.articles)[number];
export type PublicWritingPrompt = (typeof siteContent.writingPrompts)[number];

export const defaultPublicSiteSettings: PublicSiteSettings = {
  id: "main",
  brand_name: siteContent.brand,
  logo_text: "IP",
  teacher_name: siteContent.teacher,
  teacher_title: "IELTS mentor",
  teacher_band: "Band-focused coaching",
  teacher_bio: "Teacher-led IELTS preparation with private student access, structured lessons, and reviewed progress.",
  hero_title: "Structured IELTS lessons, tests, and progress for Miravzal students.",
  hero_subtitle: "A clean practice workspace for reading, listening, writing, full tests, and reviewed student results.",
  student_app_url: null,
  contact_email: null,
  telegram_url: null,
  phone: null,
  payments_enabled: false,
  free_course_enabled: true,
  updated_at: null
};

export function getArticle(slug: string) {
  return siteContent.articles.find((article) => article.slug === slug) || null;
}

export function getWritingPrompt(slug: string) {
  return siteContent.writingPrompts.find((prompt) => prompt.slug === slug) || null;
}
