import { Card, EmptyState, Table } from "@ielts-pro/ui";
import { createServerSupabaseClient, getAllStudents } from "@ielts-pro/shared";
import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "../components/AdminShell";

export default async function StudentsPage() {
  const admin = await requireAdminSession();
  const students = await getAllStudents(createServerSupabaseClient());
  return (
    <AdminShell email={admin.email}>
      <div className="page-head">
        <div><p className="eyebrow">Students</p><h1>Student Roster</h1></div>
      </div>
      <Card className="panel">
        {students.length ? (
          <Table>
            <thead><tr><th>Name</th><th>Student ID</th><th>Group</th><th>Created</th></tr></thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td><strong>{student.name}</strong></td>
                  <td>{student.student_code}</td>
                  <td>{student.groups?.name || "No group"}</td>
                  <td>{student.created_at ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(student.created_at)) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : <EmptyState title="No students" body="Add students in Supabase or extend this admin screen with create student forms next." />}
      </Card>
    </AdminShell>
  );
}
