import Link from "next/link";
import { siteContent } from "@ielts-pro/shared";
import { PublicShell } from "../components/PublicShell";

export default function BlogPage() {
  return (
    <PublicShell>
      <main className="public-main">
        <section className="public-page-hero compact align-left">
          <p className="public-kicker">Blog</p>
          <h1>IELTS study notes</h1>
          <p>Short strategies for reading, listening, writing, and weekly study planning.</p>
        </section>
        <section className="blog-grid">
          {siteContent.articles.slice(0, 3).map((article) => (
            <Link className="blog-card" href={`/article/${article.slug}`} key={article.slug}>
              <span>{article.category}</span>
              <h2>{article.title}</h2>
              <p>{article.excerpt}</p>
              <small>{article.readTime} - {article.reads} reads</small>
            </Link>
          ))}
        </section>
      </main>
    </PublicShell>
  );
}
