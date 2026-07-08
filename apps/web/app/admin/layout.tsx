import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IELTS Pro Admin",
  description: "Teacher workspace for IELTS Pro."
};

// Admin segment layout: loads only the admin design system. No <html>/<body>
// (root owns those) and no session guard here — the /admin login page lives in
// this segment, so each admin page enforces requireAdminSession itself.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
