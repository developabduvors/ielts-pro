import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IELTS Pro Student",
  description: "Student learning dashboard for IELTS practice."
};

// Student segment layout: loads only the student design system. No <html>/<body>
// here — the root layout owns those.
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
