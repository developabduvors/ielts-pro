import Link from "next/link";
import type { ReactNode } from "react";
import { createServerSupabaseClient } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";
import { StudentShell } from "../components/StudentShell";

const S = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const CARDS: Array<{ key: string; label: string; href: string; tone: string; meta: [string, string]; icon: ReactNode }> = [
  {
    key: "listening", label: "Listening", href: "/practice/listening", tone: "green", meta: ["30 mins", "40 questions"],
    icon: (<><path d="M4 13a8 8 0 0116 0" {...S} /><rect x="2.5" y="13" width="4" height="7" rx="2" {...S} /><rect x="17.5" y="13" width="4" height="7" rx="2" {...S} /></>)
  },
  {
    key: "reading", label: "Reading", href: "/practice/reading", tone: "blue", meta: ["60 mins", "40 questions"],
    icon: (<><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z" {...S} /><path d="M19 3v16" {...S} /></>)
  },
  {
    key: "speaking", label: "Speaking", href: "/speaking", tone: "amber", meta: ["11-14 mins", "3 Parts"],
    icon: (<><circle cx="9" cy="8" r="3.2" {...S} /><path d="M3.5 20a5.5 5.5 0 0111 0" {...S} /><path d="M17 7a4 4 0 010 8" {...S} /></>)
  },
  {
    key: "writing", label: "Writing", href: "/practice/writing", tone: "red", meta: ["60 mins", "2 Tasks"],
    icon: (<><path d="M12 20h9" {...S} /><path d="M16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1 1-4 11.5-11.5z" {...S} /></>)
  }
];

export default async function PracticePage() {
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();

  return (
    <StudentShell name={session.name}>
      <main className="student-page student-practice">
        <section className="student-practice-grid" aria-label="Choose an IELTS skill">
          {CARDS.map((card) => (
            <Link className={`student-practice-card tone-${card.tone}`} href={card.href} key={card.key}>
              <span className="student-practice-icon">
                <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">{card.icon}</svg>
              </span>
              <h2>{card.label}</h2>
              <p className="student-practice-meta">
                <span>{card.meta[0]}</span>
                <em />
                <span>{card.meta[1]}</span>
              </p>
            </Link>
          ))}
        </section>
      </main>
    </StudentShell>
  );
}
