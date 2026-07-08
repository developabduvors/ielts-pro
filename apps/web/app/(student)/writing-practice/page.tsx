import Link from "next/link";
import { siteContent } from "@ielts-pro/shared";
import { PublicShell } from "../components/PublicShell";

export default function WritingPracticePage() {
  return (
    <PublicShell>
      <main className="public-main">
        <section className="public-page-hero compact align-left">
          <Link href="/practice-tests" className="back-link">Back to practice tests</Link>
          <h1>IELTS writing practice</h1>
          <p>Choose a Task 1 or Task 2 prompt, then continue in a focused writing workspace.</p>
        </section>
        <section className="writing-page-layout">
          <div className="writing-grid">
            {siteContent.writingPrompts.map((prompt) => (
              <Link className="writing-card" href={`/writing-practice/test/${prompt.slug}`} key={prompt.slug}>
                <div className={`writing-visual writing-${prompt.visual}`} />
                <div>
                  <span>{prompt.task}</span>
                  <small>{prompt.type}</small>
                  <h2>{prompt.title}</h2>
                  <p>{prompt.prompt}</p>
                </div>
              </Link>
            ))}
          </div>
          <aside className="writing-aside">
            <article>
              <strong>Teacher feedback</strong>
              <p>Private students can submit writing tasks to the admin review queue.</p>
              <Link href="/login">Enter portal</Link>
            </article>
            <article>
              <strong>Self practice</strong>
              <p>Use the prompt, timer, and word-count target before sending work for review.</p>
            </article>
          </aside>
        </section>
      </main>
    </PublicShell>
  );
}
