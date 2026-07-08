import Link from "next/link";
import { createServerSupabaseClient, getDefaultSiteSettings, getSiteSettings, siteContent } from "@ielts-pro/shared";
import { PublicShell } from "./components/PublicShell";

export const dynamic = "force-dynamic";

async function loadSettings() {
  try {
    return await getSiteSettings(createServerSupabaseClient());
  } catch {
    return getDefaultSiteSettings();
  }
}

export default async function HomePage() {
  const settings = await loadSettings();

  return (
    <PublicShell settings={settings}>
      <main className="public-main">
        <section className="home-hero">
          <div className="home-hero-copy">
            <p className="public-kicker">Teacher-guided IELTS practice</p>
            <h1>{settings.hero_title}</h1>
            <p>{settings.hero_subtitle}</p>
            <div className="home-hero-actions">
              <Link className="public-primary" href="/practice-tests">Choose a skill</Link>
              <Link className="public-secondary" href="/login">Student login</Link>
            </div>
          </div>
          <div className="home-hero-board" aria-label="IELTS practice overview">
            <div className="board-top">
              <span>{settings.brand_name} workspace</span>
              <strong>Live</strong>
            </div>
            <div className="board-split">
              <div>
                <small>Reading passage</small>
                <i />
                <i />
                <i />
              </div>
              <div>
                <small>Questions 1-7</small>
                <b>1</b>
                <b>2</b>
                <b>3</b>
              </div>
            </div>
            <div className="board-footer">
              <span>59:54</span>
              <span>Review answers</span>
            </div>
          </div>
        </section>

        <section className="public-card-grid" aria-label="IELTS platform areas">
          {siteContent.homeCards.map((card) => (
            <article className={`public-feature-card card-${card.tone}`} key={card.title}>
              <span>{card.label}</span>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
              <Link href={card.href}>{card.action} <small aria-hidden="true">-&gt;</small></Link>
            </article>
          ))}
        </section>

        <section className="public-news">
          <div className="section-title-row">
            <h2>What is ready</h2>
            <Link href="/student-results">View student results</Link>
          </div>
          <div className="news-panel">
            {siteContent.updates.map((item) => (
              <Link href={item.href} key={item.title} className="news-row">
                <span>{item.label}</span>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <small>{item.action} -&gt;</small>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
