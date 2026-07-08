import Link from "next/link";
import { siteContent } from "@ielts-pro/shared";
import { PublicShell } from "../components/PublicShell";

export default function ArticleLessonsPage() {
  return (
    <PublicShell>
      <main className="public-main">
        <section className="public-page-hero compact">
          <p className="public-kicker">Article lessons</p>
          <h1>Improve reading with leveled articles.</h1>
          <p>Use article reading, vocabulary review, and comprehension practice to build IELTS reading habits.</p>
        </section>

        <section className="article-toolbar" aria-label="Article filters">
          <label>
            Search articles
            <input placeholder="Search articles..." />
          </label>
          <button type="button">All categories</button>
          <button type="button">All levels</button>
          <button type="button">Newest</button>
        </section>

        <section className="article-grid">
          {siteContent.articles.map((article) => (
            <article className="article-card" key={article.slug}>
              <div className={`article-art article-art-${article.theme}`}><span>{article.category}</span></div>
              <div>
                <h2>{article.title}</h2>
                <p>{article.excerpt}</p>
                <div className="article-meta">
                  <span>{article.level}</span>
                  <span>{article.readTime}</span>
                  <span>{article.reads} reads</span>
                </div>
                <Link href={`/article/${article.slug}`}>Start reading -&gt;</Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </PublicShell>
  );
}
