import Link from "next/link";
import { PublicShell } from "../components/PublicShell";

export default function ContactPage() {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL || "/admin";

  return (
    <PublicShell>
      <main className="public-main">
        <section className="public-page-hero compact align-left">
          <p className="public-kicker">Contact</p>
          <h1>Need access or feedback?</h1>
          <p>Ask the teacher to create your Student Access ID, assign lessons, or review writing work.</p>
        </section>
        <section className="contact-panel">
          <article>
            <strong>Student access</strong>
            <p>Use your full name and access ID exactly as created in the admin panel.</p>
            <Link href="/login">Go to login</Link>
          </article>
          <article>
            <strong>Teacher operations</strong>
            <p>Admins manage lessons, students, writing review, imported tests, and analytics from the admin web app.</p>
            <a href={adminUrl}>Open admin panel</a>
          </article>
        </section>
      </main>
    </PublicShell>
  );
}
