import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IELTS Pro",
  description: "IELTS Pro learning platform."
};

// Root layout owns the single <html>/<body>. Student and admin each bring their
// own global stylesheet in their segment layout so the two design systems never
// load together (no class-name collisions).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
