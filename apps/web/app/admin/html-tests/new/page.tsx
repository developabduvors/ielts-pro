import Link from "next/link";
import { Badge, Card, ErrorState } from "@ielts-pro/ui";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminShell } from "../../components/AdminShell";
import { uploadHtmlTestAction } from "../../actions/lms";

export default async function NewHtmlTestPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; saved?: string; title?: string; skill?: string; published?: string }>;
}) {
  const admin = await requireAdminSession();
  const params = searchParams ? await searchParams : {};
  const error = params.error ? decodeURIComponent(params.error) : "";
  const saved = params.saved === "1";

  return (
    <AdminShell email={admin.email}>
      <div className="page-head page-head-hero">
        <div>
          <p className="eyebrow">HTML Tests</p>
          <h1>Upload HTML test</h1>
          <p className="muted">Upload a self-contained interactive HTML test. Students open it in a new tab and their score is saved automatically.</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/admin/lessons">Open Content Studio</Link>
        </div>
      </div>

      {error ? <ErrorState title="Upload failed" body={error} /> : null}

      {saved ? (
        <Card className="panel">
          <Badge tone="success">Saved</Badge>
          <h2>{params.title || "HTML test"}</h2>
          <p className="muted">
            {params.published === "yes"
              ? "Published — visible to students in the matching skill now."
              : "Saved as a draft. Publish its lesson in Content Studio to show it to students."}
          </p>
          <Link className="btn btn-secondary" href="/admin/lessons">Manage in Content Studio</Link>
        </Card>
      ) : null}

      <Card className="panel">
        <form action={uploadHtmlTestAction} className="stack-form" encType="multipart/form-data">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" placeholder="e.g. Reading Passage 1 — Urban transport" required />
          </div>

          <div className="form-group">
            <label htmlFor="skill">Skill</label>
            <select id="skill" name="skill" defaultValue="reading">
              <option value="reading">Reading</option>
              <option value="listening">Listening</option>
              <option value="writing">Writing</option>
              <option value="full_test">Full Test</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subtype">Question type / label <span className="muted">(optional)</span></label>
            <input id="subtype" name="subtype" placeholder="e.g. Note completion" />
          </div>

          <div className="form-group">
            <label htmlFor="html_file">HTML file</label>
            <input id="html_file" type="file" name="html_file" accept=".html,.htm,text/html" required />
            <p className="muted">The file must call <code>window.submitIeltsScore(&#123; score, total, answers &#125;)</code> when finished. See docs/HTML_TEST_UPLOAD.md.</p>
          </div>

          <label className="checkbox-row">
            <input type="checkbox" name="published" />
            <span>Publish now (make visible to students immediately)</span>
          </label>

          <button className="btn btn-primary" type="submit">Upload HTML test</button>
        </form>
      </Card>
    </AdminShell>
  );
}
