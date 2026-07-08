import Link from "next/link";
import { siteContent } from "@ielts-pro/shared";
import { PublicShell } from "../components/PublicShell";

export default function MockExamPage() {
  return (
    <PublicShell>
      <main className="public-main">
        <section className="public-page-hero">
          <p className="public-kicker">Full IELTS simulation</p>
          <h1>Mock exam workspace for serious practice.</h1>
          <p>Listening, Reading, Writing, and Speaking flow are organized around the same progress model used in the private student portal.</p>
          <Link className="public-primary" href="/login">Enter private portal</Link>
        </section>

        <section className="mock-modules" aria-label="Exam modules">
          {siteContent.mockExam.modules.map((module) => (
            <article className="mock-module-card" key={module.title}>
              <span>{module.title.slice(0, 1)}</span>
              <h2>{module.title}</h2>
              <small>{module.duration}</small>
              <p>{module.description}</p>
            </article>
          ))}
        </section>

        <section className="exam-preview-section">
          <p className="public-kicker">Computer-based feel</p>
          <h2>Practice on a split test interface</h2>
          <p>Passage or audio context stays on the left. Questions, answer inputs, review status, and submit controls stay on the right.</p>
          <div className="exam-window" aria-label="IELTS interface preview">
            <div className="exam-window-bar"><span /><span /><span /><strong>IELTS Pro test</strong></div>
            <div className="exam-window-body">
              <div>
                <h3>Reading passage</h3>
                <i /><i /><i /><i />
              </div>
              <div>
                <h3>Questions 1-5</h3>
                <b>1</b><b>2</b><b>3</b>
              </div>
            </div>
          </div>
        </section>

        <section className="included-grid" aria-label="What is included">
          {siteContent.mockExam.included.map((item) => (
            <article className="included-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </section>
      </main>
    </PublicShell>
  );
}
