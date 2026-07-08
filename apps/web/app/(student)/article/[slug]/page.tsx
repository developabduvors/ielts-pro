import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticle } from "@ielts-pro/shared";
import { PublicShell } from "../../components/PublicShell";

export default async function ArticleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <PublicShell>
      <main className="public-main">
        <article className="article-detail">
          <div className={`article-detail-hero article-art-${article.theme}`} />
          <div className="article-detail-body">
            <Link href="/article-lessons" className="back-link">Back to articles</Link>
            <div className="article-pills">
              <span>{article.level}</span>
              <span>{article.category}</span>
            </div>
            <h1>{article.title}</h1>
            <div className="article-meta detail-meta">
              <span>{article.words} words</span>
              <span>{article.readTime}</span>
              <span>{article.reads} reads</span>
            </div>
            <div className="article-progress-panel">
              <strong>Your progress</strong>
              <label><input type="checkbox" /> Article read</label>
              <label><input type="checkbox" /> Test done</label>
              <label><input type="checkbox" /> Vocabulary done</label>
            </div>
            <div className="article-tabs">
              <button type="button">Article</button>
              <button type="button">Test</button>
              <button type="button">Vocab quiz</button>
              <button type="button">Read aloud</button>
            </div>
            <div className="reading-copy">
              {article.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
        </article>
      </main>
    </PublicShell>
  );
}
