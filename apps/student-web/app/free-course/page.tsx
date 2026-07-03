import Link from "next/link";
import { siteContent } from "@ielts-pro/shared";
import { PublicShell } from "../components/PublicShell";

export default function FreeCoursePage() {
  return (
    <PublicShell>
      <main className="public-main">
        <section className="public-page-hero compact align-left">
          <p className="public-kicker">Free listening course</p>
          <h1>Build the first listening routine.</h1>
          <p>Short lessons for understanding IELTS listening sections, answer prediction, and map language.</p>
        </section>
        <section className="listening-layout">
          <div className="listening-grid">
            {siteContent.listeningCourse.map((lesson) => (
              <article className="listening-card" key={lesson.day}>
                <span>{lesson.day}</span>
                <h2>{lesson.title}</h2>
                <p>{lesson.description}</p>
                <div className="mini-icons">
                  {lesson.icons.map((icon) => <small key={icon}>{icon}</small>)}
                </div>
                <Link href="/login">Start -&gt;</Link>
              </article>
            ))}
          </div>
          <aside className="course-aside">
            <strong>Unlock private assignments</strong>
            <p>Teacher-issued access IDs show the exact lessons and tests assigned to each student.</p>
            <Link href="/login">Enter portal</Link>
          </aside>
        </section>
      </main>
    </PublicShell>
  );
}
