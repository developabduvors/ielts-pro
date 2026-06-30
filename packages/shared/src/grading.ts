import type { Question } from "./types.js";

export function parseTaskContent<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function gradeQuestions(questions: Question[], answers: Record<string, unknown>) {
  let correct = 0;
  let total = 0;

  questions.forEach((q, index) => {
    const saved = answers[String(index)];
    if (q.type === "matching" || q.type === "sentence_endings") {
      const savedMatch = isRecord(saved) ? saved : {};
      for (const [itemIndex, item] of (q.items || []).entries()) {
        total++;
        if (String(savedMatch[String(itemIndex)] || "") === String(item.answer || "")) correct++;
      }
      return;
    }

    if (["diagram_label", "table_completion", "summary_completion", "flow_chart", "note_completion"].includes(q.type)) {
      const savedMatch = isRecord(saved) ? saved : {};
      for (const [itemIndex, item] of (q.items || []).entries()) {
        total++;
        if (normalise(savedMatch[String(itemIndex)]) === normalise(item.answer)) correct++;
      }
      return;
    }

    if (q.type === "mcq_multi") {
      const expected = Array.isArray(q.answer) ? q.answer : [];
      const actual = Array.isArray(saved) ? saved.map(String) : [];
      total += expected.length;
      expected.forEach((letter) => {
        if (actual.includes(letter)) correct++;
      });
      return;
    }

    total++;
    if (["gap_fill", "short_answer"].includes(q.type)) {
      if (normalise(saved) === normalise(q.answer)) correct++;
    } else if (["tfng", "ynng", "mcq"].includes(q.type)) {
      if (String(saved || "") === String(q.answer || "")) correct++;
    }
  });

  return { correct, total };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalise(value: unknown) {
  return String(value || "").toLowerCase().trim();
}
