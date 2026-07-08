import Link from "next/link";
import { Badge, Card, ErrorState } from "@ielts-pro/ui";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminShell } from "../../components/AdminShell";
import { TestBuilderWizard } from "./TestBuilderWizard";

export default async function NewFullTestPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; saved?: string; task?: string; name?: string; skill?: string; questions?: string; answers?: string; audio?: string; warnings?: string }>;
}) {
  const admin = await requireAdminSession();
  const params = searchParams ? await searchParams : {};
  const error = params.error ? decodeURIComponent(params.error) : "";
  const saved = params.saved === "1";

  return (
    <AdminShell email={admin.email}>
      <div className="page-head page-head-hero builder-hero-light builder-page-head">
        <div>
          <p className="eyebrow">Test Builder</p>
          <h1>Test Builder</h1>
          <p className="muted">Import IELTS HTML tests and save them to Content Studio</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/admin/full-tests/new">New content</Link>
          <Link className="btn btn-secondary" href="/admin/lessons">Open Content Studio</Link>
          <Link className="btn btn-primary" href="/admin/lessons#lesson-builder">New lesson</Link>
        </div>
      </div>

      {error ? <ErrorState title="Import failed" body={error} /> : null}

      {saved ? (
        <Card className="panel import-success-panel">
          <div>
            <Badge tone="success">Saved to Content Studio</Badge>
            <h2>{params.name || "Imported HTML content"}</h2>
            <p className="muted">Draft content was created. It is hidden from students until a teacher attaches it to a lesson and publishes that lesson.</p>
          </div>
          <div className="parsed-summary-grid">
            <Summary label="Skill" value={labelFor(params.skill || "reading")} />
            <Summary label="Questions" value={params.questions || "0"} />
            <Summary label="Answer keys" value={params.answers || "0"} />
            <Summary label="Audio" value={params.audio === "yes" ? "Detected" : "Not detected"} />
            <Summary label="Warnings" value={params.warnings || "0"} />
          </div>
          <div className="success-actions">
            <Link className="btn btn-primary" href="/admin/lessons">Open in Content Studio</Link>
            <Link className="btn btn-secondary" href="/admin/lessons#content-library">Attach to lesson now</Link>
            <Link className="btn btn-secondary" href="/admin/full-tests/new">Import another</Link>
          </div>
        </Card>
      ) : null}

      <div className="test-builder-grid">
        <TestBuilderWizard />
      </div>
    </AdminShell>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="parsed-summary">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function labelFor(skill: string) {
  if (skill === "reading") return "Reading";
  if (skill === "listening") return "Listening";
  if (skill === "writing") return "Writing";
  if (skill === "full_test") return "Full Test";
  return skill;
}
