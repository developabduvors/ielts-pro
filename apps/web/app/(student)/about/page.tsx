import Link from "next/link";
import { PublicShell } from "../components/PublicShell";

export default function AboutPage() {
  return (
    <PublicShell>
      <main className="public-main">
        <section className="public-page-hero compact align-left">
          <p className="public-kicker">About IELTS Pro</p>
          <h1>A private IELTS learning workspace by Miravzal.</h1>
          <p>
            IELTS Pro connects teacher-created lessons, HTML test imports, student access IDs, writing review,
            and progress analytics in one LMS.
          </p>
          <Link className="public-primary" href="/practice-tests">Explore practice</Link>
        </section>
        <section className="about-grid">
          <article><strong>For students</strong><p>Clean assignments, exam-style practice, and reviewed feedback history.</p></article>
          <article><strong>For teachers</strong><p>Content Studio, Test Builder, student access, and control tables.</p></article>
          <article><strong>For IELTS work</strong><p>Reading, listening, writing, articles, and full-test workflows are organized by skill.</p></article>
        </section>
      </main>
    </PublicShell>
  );
}
