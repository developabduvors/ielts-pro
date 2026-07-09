import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// Saytga kirilganda birinchi login sahifasi ochiladi; sessiyasi bor
// o'quvchilar to'g'ridan-to'g'ri dashboardga o'tadi.
export default async function HomePage() {
  const session = await getStudentSession();
  redirect(session ? "/dashboard" : "/login");
}
