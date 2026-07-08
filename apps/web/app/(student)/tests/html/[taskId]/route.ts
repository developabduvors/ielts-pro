import { NextResponse } from "next/server";
import { createServerSupabaseClient, getPublishedTaskByIdForStudent, getStudentById } from "@ielts-pro/shared";
import { requireStudentSession } from "@/lib/session";

// Serves an uploaded interactive HTML test from private storage on our own
// origin, injecting a bridge so the test can report its score back through the
// student's HTTP-only session cookie (no anon key or secrets in the page).
export async function GET(_request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const session = await requireStudentSession();
  const supabase = createServerSupabaseClient();
  const student = await getStudentById(supabase, session.id);
  const groupId = student?.group_id ?? session.group_id;
  const task = await getPublishedTaskByIdForStudent(supabase, taskId, groupId);

  if (!task || task.source_type !== "html" || !task.html_path) {
    return new NextResponse("This test is not available.", { status: 404 });
  }

  const download = await supabase.storage.from("html-tests").download(task.html_path);
  if (download.error || !download.data) {
    return new NextResponse("Test file is missing. Ask your teacher to re-upload it.", { status: 404 });
  }

  const rawHtml = await download.data.text();
  const bridge = renderBridgeScript(taskId);
  const html = rawHtml.includes("</body>")
    ? rawHtml.replace("</body>", `${bridge}</body>`)
    : `${rawHtml}${bridge}`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store"
    }
  });
}

function renderBridgeScript(taskId: string) {
  return `<script>
(function(){
  var TASK_ID = ${JSON.stringify(taskId)};
  window.submitIeltsScore = async function(result){
    result = result || {};
    try {
      var res = await fetch('/api/html-attempts', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ taskId: TASK_ID, score: result.score, total: result.total, answers: result.answers || null })
      });
      var json = await res.json();
      if (!json || !json.ok) console.error('submitIeltsScore rejected', json);
      return json;
    } catch (err) {
      console.error('submitIeltsScore failed', err);
      return { ok: false };
    }
  };
})();
</script>`;
}
