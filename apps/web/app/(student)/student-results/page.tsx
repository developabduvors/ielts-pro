import Link from "next/link";
import { siteContent } from "@ielts-pro/shared";
import { PublicShell } from "../components/PublicShell";

export default function StudentResultsPage() {
  return (
    <PublicShell>
      <main className="public-main">
        <section className="public-page-hero compact">
          <p className="public-kicker">Student progress</p>
          <h1>Student success stories</h1>
          <p>Example progress cards that show how the LMS tracks before/after results, feedback, and improvement direction.</p>
        </section>
        <section className="result-stats">
          <div><strong>500+</strong><span>students trained</span></div>
          <div><strong>95%</strong><span>active study plans</span></div>
          <div><strong>1.5+</strong><span>average band lift</span></div>
          <div><strong>50+</strong><span>Band 8+ results</span></div>
        </section>
        <section className="results-grid">
          {siteContent.successStories.map((story) => (
            <article className="result-card" key={story.name}>
              <div className="result-head">
                <span>{story.name.split(" ").map((part) => part[0]).join("")}</span>
                <div>
                  <h2>{story.name}</h2>
                  <small>{story.skill}</small>
                </div>
              </div>
              <div className="band-row">
                <div><small>Before</small><strong>{story.before}</strong></div>
                <b>-&gt;</b>
                <div><small>After</small><strong>{story.after}</strong></div>
                <em>+{(Number(story.after) - Number(story.before)).toFixed(1)}</em>
              </div>
              <p>{story.quote}</p>
            </article>
          ))}
        </section>
        <section className="public-cta-band">
          <h2>Ready to track your own progress?</h2>
          <p>Enter the private portal if your teacher has created your Student Access ID.</p>
          <Link href="/login">Student login</Link>
        </section>
      </main>
    </PublicShell>
  );
}
