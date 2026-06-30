import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: Variant }) {
  return <button className={`btn btn-${variant} ${className}`.trim()} {...props} />;
}

export function LinkButton({
  variant = "primary",
  className = "",
  ...props
}: ComponentPropsWithoutRef<"a"> & { variant?: Variant }) {
  return <a className={`btn btn-${variant} ${className}`.trim()} {...props} />;
}

export function Card({ className = "", ...props }: ComponentPropsWithoutRef<"section">) {
  return <section className={`card ${className}`.trim()} {...props} />;
}

export function Badge({ tone = "neutral", children }: { tone?: "neutral" | "reading" | "listening" | "writing" | "success" | "warning"; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Input(props: ComponentPropsWithoutRef<"input">) {
  return <input className="field" {...props} />;
}

export function Textarea(props: ComponentPropsWithoutRef<"textarea">) {
  return <textarea className="field textarea" {...props} />;
}

export function Select(props: ComponentPropsWithoutRef<"select">) {
  return <select className="field" {...props} />;
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-mark" aria-hidden="true">IELTS</div>
      <h3>{title}</h3>
      {body ? <p>{body}</p> : null}
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", body }: { title?: string; body: string }) {
  return (
    <div className="error-state" role="alert">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="skeleton-stack" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => <div className="skeleton" key={index} />)}
    </div>
  );
}

export function StatCard({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <Card className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </Card>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="progress-wrap" aria-label={label} aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={100} role="progressbar">
      <div className="progress-fill" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return <div className="table-shell"><table>{children}</table></div>;
}

export function AppShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">{sidebar}</aside>
      <main className="main-panel">{children}</main>
    </div>
  );
}
