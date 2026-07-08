import { notFound } from "next/navigation";
import Link from "next/link";
import { getWritingPrompt } from "@ielts-pro/shared";
import { PublicShell } from "../../../components/PublicShell";

export default async function WritingPromptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const prompt = getWritingPrompt(slug);
  if (!prompt) notFound();

  return (
    <PublicShell>
      <main className="public-main">
        <section className="writing-detail">
          <Link href="/writing-practice" className="back-link">All writing tests</Link>
          <div className="article-pills">
            <span>{prompt.task}</span>
            <span>{prompt.type}</span>
            <span>{prompt.time}</span>
            <span>{prompt.minWords}+ words</span>
          </div>
          <h1>{prompt.title}</h1>
          <p>Choose how you want to practice.</p>
          <div className="writing-mode-grid">
            <Link href="/login" className="writing-mode mode-ai">
              <span>Check</span>
              <strong>Teacher review</strong>
              <small>Submit through the private portal</small>
            </Link>
            <a href="#prompt" className="writing-mode mode-self">
              <span>Self</span>
              <strong>Self practice</strong>
              <small>Timed prompt and word target</small>
            </a>
            <Link href="/contact" className="writing-mode mode-help">
              <span>Ask</span>
              <strong>Need feedback?</strong>
              <small>Contact the teacher</small>
            </Link>
          </div>
          <div className={`writing-prompt-visual writing-${prompt.visual}`} aria-label={`${prompt.title} visual`} />
          <article className="prompt-card" id="prompt">
            <p className="public-kicker">Prompt</p>
            <p>{prompt.prompt}</p>
          </article>
        </section>
      </main>
    </PublicShell>
  );
}
