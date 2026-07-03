import { Badge, Card, StatCard, Table } from "@ielts-pro/ui";
import { createServerSupabaseClient, getSiteSettings, getSupabaseUrl } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/session";
import { updateSiteSettingsAction } from "../actions/lms";
import { AdminShell } from "../components/AdminShell";

export default async function SettingsPage() {
  const admin = await requireAdminSession();
  const settings = await getSiteSettings(createServerSupabaseClient());
  const studentUrl = settings.student_app_url || process.env.NEXT_PUBLIC_STUDENT_APP_URL || "Not configured";
  const adminEmails = process.env.ADMIN_EMAILS || admin.email;
  const updatedAt = settings.updated_at ? new Date(settings.updated_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Default settings";

  return (
    <AdminShell email={admin.email}>
      <div className="page-head page-head-hero settings-hero">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Control the public LMS identity.</h1>
          <p className="muted">
            Brand, teacher profile, contact links, and public course switches are managed here instead of hard-coded in the site.
          </p>
        </div>
        <div className="settings-live-card">
          <span>Current public brand</span>
          <strong>{settings.brand_name}</strong>
          <small>Updated: {updatedAt}</small>
        </div>
      </div>

      <section className="stats-grid settings-stats">
        <StatCard label="LMS name" value={settings.brand_name} note="student and public pages" />
        <StatCard label="Teacher" value={settings.teacher_name} note={settings.teacher_title} />
        <StatCard label="Free course" value={settings.free_course_enabled ? "On" : "Off"} note="public listening route" />
        <StatCard label="Payments" value={settings.payments_enabled ? "On" : "Off"} note="hidden when off" />
      </section>

      <section className="settings-workspace">
        <Card className="panel settings-editor">
          <div className="section-head">
            <div>
              <p className="eyebrow">Public site</p>
              <h2>Brand and landing copy</h2>
              <p className="muted">These values can be changed after the Supabase migration is applied.</p>
            </div>
            <Badge tone="success">Supabase controlled</Badge>
          </div>

          <form action={updateSiteSettingsAction} className="settings-form">
            <label>
              <span>Brand name</span>
              <input className="field" name="brand_name" defaultValue={settings.brand_name} />
            </label>
            <label>
              <span>Logo text</span>
              <input className="field" name="logo_text" maxLength={4} defaultValue={settings.logo_text} />
            </label>
            <label>
              <span>Teacher name</span>
              <input className="field" name="teacher_name" defaultValue={settings.teacher_name} />
            </label>
            <label>
              <span>Teacher title</span>
              <input className="field" name="teacher_title" defaultValue={settings.teacher_title} />
            </label>
            <label>
              <span>Teacher band / proof</span>
              <input className="field" name="teacher_band" defaultValue={settings.teacher_band} />
            </label>
            <label className="span-2">
              <span>Teacher bio</span>
              <textarea className="field textarea" name="teacher_bio" defaultValue={settings.teacher_bio} />
            </label>
            <label className="span-2">
              <span>Homepage headline</span>
              <textarea className="field textarea settings-short-textarea" name="hero_title" defaultValue={settings.hero_title} />
            </label>
            <label className="span-2">
              <span>Homepage subtitle</span>
              <textarea className="field textarea settings-short-textarea" name="hero_subtitle" defaultValue={settings.hero_subtitle} />
            </label>
            <label>
              <span>Student app URL</span>
              <input className="field" name="student_app_url" defaultValue={settings.student_app_url || ""} placeholder="https://ielts-pro-student.vercel.app" />
            </label>
            <label>
              <span>Contact email</span>
              <input className="field" name="contact_email" defaultValue={settings.contact_email || ""} placeholder="teacher@example.com" />
            </label>
            <label>
              <span>Telegram URL</span>
              <input className="field" name="telegram_url" defaultValue={settings.telegram_url || ""} placeholder="https://t.me/username" />
            </label>
            <label>
              <span>Phone</span>
              <input className="field" name="phone" defaultValue={settings.phone || ""} placeholder="+998..." />
            </label>

            <div className="settings-toggle-row span-2">
              <label className="settings-toggle">
                <input type="checkbox" name="free_course_enabled" defaultChecked={settings.free_course_enabled} />
                <span>
                  <strong>Show free listening course</strong>
                  <small>Keep public `/free-course` available in the menu.</small>
                </span>
              </label>
              <label className="settings-toggle">
                <input type="checkbox" name="payments_enabled" defaultChecked={settings.payments_enabled} />
                <span>
                  <strong>Enable optional payment blocks</strong>
                  <small>Off keeps the public site focused on private teacher-issued access.</small>
                </span>
              </label>
            </div>

            <button className="btn btn-primary span-2" type="submit">Save settings</button>
          </form>
        </Card>

        <Card className="panel settings-preview">
          <p className="eyebrow">Preview</p>
          <div className="preview-brand-row">
            <span>{settings.logo_text}</span>
            <strong>{settings.brand_name}</strong>
          </div>
          <h2>{settings.hero_title}</h2>
          <p>{settings.hero_subtitle}</p>
          <div className="preview-teacher-card">
            <small>{settings.teacher_band}</small>
            <strong>{settings.teacher_name}</strong>
            <span>{settings.teacher_title}</span>
            <p>{settings.teacher_bio}</p>
          </div>
          <div className="settings-check-list">
            <span className="ok">Public pages use original IELTS Pro branding.</span>
            <span className={settings.payments_enabled ? "warn" : "ok"}>{settings.payments_enabled ? "Payment blocks can be shown." : "Payment blocks are hidden."}</span>
            <span className={settings.free_course_enabled ? "ok" : "warn"}>{settings.free_course_enabled ? "Free course link is active." : "Free course link can be hidden later."}</span>
          </div>
        </Card>
      </section>

      <Card className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">Environment</p>
            <h2>Connected services</h2>
          </div>
          <Badge tone="neutral">Read only</Badge>
        </div>
        <Table>
          <thead>
            <tr>
              <th>Setting</th>
              <th>Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Supabase URL</td>
              <td>{getSupabaseUrl()}</td>
              <td><Badge tone="success">Connected</Badge></td>
            </tr>
            <tr>
              <td>Admin emails</td>
              <td>{adminEmails}</td>
              <td><Badge tone="success">Allowed</Badge></td>
            </tr>
            <tr>
              <td>Student app URL</td>
              <td>{studentUrl}</td>
              <td><Badge tone={studentUrl === "Not configured" ? "warning" : "success"}>{studentUrl === "Not configured" ? "Set in form" : "Ready"}</Badge></td>
            </tr>
          </tbody>
        </Table>
      </Card>
    </AdminShell>
  );
}
