import Link from "next/link";
import { siteContent } from "@ielts-pro/shared";
import { PublicShell } from "../components/PublicShell";

export default function PublicPracticeTestsPage() {
  return (
    <PublicShell>
      <main className="public-main public-centered-page">
        <section className="public-page-hero compact">
          <p className="public-kicker">Practice tests</p>
          <h1>Choose your skill</h1>
          <p>Select a practice area. Private students can continue into assigned tests after logging in.</p>
        </section>

        <section className="skill-choice-grid" aria-label="IELTS skills">
          {siteContent.skills.map((skill) => {
            const href = skill.slug === "speaking" ? "/contact" : skill.slug === "writing" ? "/writing-practice" : `/login`;
            return (
              <Link className={`skill-choice-card skill-${skill.tone}`} href={href} key={skill.slug}>
                <span className="skill-icon">{skill.title.slice(0, 1)}</span>
                <h2>{skill.title}</h2>
                <p>{skill.duration} - {skill.detail}</p>
                <small>{skill.countLabel}</small>
              </Link>
            );
          })}
        </section>

        <div className="public-link-row">
          <Link href="/login">Private test history</Link>
          <Link href="/article-lessons">Vocabulary and articles</Link>
        </div>
      </main>
    </PublicShell>
  );
}
