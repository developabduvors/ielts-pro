// Shown instantly by Next.js while the next page's Server Component renders and
// fetches data. Without it, navigation to a dynamic page leaves the screen
// frozen on the previous view until the server responds — the main reason
// page-to-page felt "stuck". This gives immediate feedback so nav feels instant.
export default function StudentLoading() {
  return (
    <div className="student-route-loading" role="status" aria-live="polite" aria-busy="true">
      <div className="student-route-loading-bar" aria-hidden="true" />
      <div className="student-route-loading-inner">
        <span className="student-brand-spinner" aria-hidden="true" />
        <span className="student-route-loading-text">Loading…</span>
      </div>
    </div>
  );
}
