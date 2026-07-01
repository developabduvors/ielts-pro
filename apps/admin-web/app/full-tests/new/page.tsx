import Link from "next/link";
import { Badge, Button, Card, ErrorState, Input, Select, Textarea } from "@ielts-pro/ui";
import { requireAdminSession } from "@/lib/session";
import { AdminShell } from "../../components/AdminShell";
import { createFullTestDraftAction, importFullTestJsonAction, importSkillJsonAction } from "../../actions/lms";

const sampleImport = `{
  "title": "Academic Full Test 1",
  "description": "Reading, listening, and writing practice",
  "published": false,
  "duration_minutes": 180,
  "difficulty": "academic",
  "sections": [
    {
      "skill": "reading",
      "title": "Reading Passage 1",
      "passage_html": "<h2>Urban transport</h2><p>Passage text...</p>",
      "questions": [
        {
          "type": "mcq",
          "question": "What is the main idea?",
          "options": ["Transport cost", "City planning", "Rail history"],
          "answer": "B"
        }
      ]
    },
    {
      "skill": "listening",
      "title": "Listening Section 1",
      "audio_url": "https://example.com/audio.mp3",
      "questions": [
        { "type": "short_answer", "question": "What time does it start?", "answer": "9:30" }
      ]
    },
    {
      "skill": "writing",
      "title": "Writing Task 2",
      "prompt": "Some people believe..."
    }
  ]
}`;

const readingImport = `{
  "title": "Reading Passage 1",
  "passage_html": "<h2>The Davies Sisters</h2><p>Passage text...</p>",
  "questions": [
    {
      "type": "note_completion",
      "question": "Complete the notes below.",
      "items": [
        { "label": "their grandfather's wealth came from ___ and transportation businesses", "answer": "coal" }
      ]
    }
  ]
}`;

const listeningImport = `{
  "title": "Listening Section 1",
  "audio_url": "https://example.com/listening.mp3",
  "questions": [
    {
      "type": "short_answer",
      "question": "What time does the session begin?",
      "answer": "9:30"
    }
  ]
}`;

const writingImport = `{
  "title": "Writing Task 2",
  "prompt": "Some people believe that online learning is more effective than classroom learning. Discuss both views and give your opinion."
}`;

export default async function NewFullTestPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const admin = await requireAdminSession();
  const params = searchParams ? await searchParams : {};
  const error = params.error ? decodeURIComponent(params.error) : "";

  return (
    <AdminShell email={admin.email}>
      <div className="page-head">
        <div>
          <p className="eyebrow">Full test builder</p>
          <h1>Create IELTS exam practice</h1>
          <p className="muted">Build a student-ready full test with Reading, Listening audio, Writing prompts, and objective answer keys.</p>
        </div>
        <Link className="btn btn-secondary" href="/full-tests">Back to library</Link>
      </div>

      {error ? <ErrorState title="Builder error" body={error} /> : null}

      <div className="builder-layout">
        <form action={createFullTestDraftAction} className="builder-form">
          <Card className="builder-card">
            <div className="builder-step"><span>1</span><div><Badge tone="full">Full test</Badge><h2>Exam setup</h2></div></div>
            <div className="two-col">
              <label>Title<Input name="title" required placeholder="Academic Full Test 1" /></label>
              <label>Difficulty<Select name="difficulty" defaultValue="academic"><option value="academic">Academic</option><option value="general">General Training</option><option value="foundation">Foundation</option></Select></label>
            </div>
            <label>Description<Textarea name="description" placeholder="Short teacher note shown inside the admin studio." /></label>
            <div className="two-col">
              <label>Duration minutes<Input name="duration_minutes" type="number" defaultValue={180} min={1} /></label>
              <label>Lesson order<Input name="order" type="number" defaultValue={1} min={1} /></label>
            </div>
            <label>Student instructions<Textarea name="instructions" placeholder="Complete all sections before submitting." /></label>
            <label className="check-row"><input type="checkbox" name="published" /> Publish immediately after saving</label>
          </Card>

          <Card className="builder-card">
            <div className="builder-step"><span>2</span><div><Badge tone="reading">Reading</Badge><h2>Reading section</h2></div></div>
            <label>Section title<Input name="reading_title" defaultValue="Reading Passage 1" /></label>
            <label>Passage text<Textarea name="reading_passage" placeholder="Paste the reading passage. Paragraph breaks are preserved for the student view." /></label>
            <div className="two-col">
              <label>Question type<Select name="reading_question_type" defaultValue="note_completion"><option value="note_completion">Note completion</option><option value="mcq">Multiple choice</option><option value="short_answer">Short answer</option><option value="summary_completion">Summary completion</option><option value="table_completion">Table completion</option><option value="mcq_multi">Multiple answers</option></Select></label>
              <label>Question<Input name="reading_question" placeholder="Complete the notes below." /></label>
            </div>
            <label>Options, one per line<Textarea name="reading_options" placeholder={"Use for MCQ only:\nA. Explain a problem\nB. Compare two ideas\nC. Describe a solution"} /></label>
            <label>Gap lines for completion questions<Textarea name="reading_note_items" placeholder={"their grandfather's wealth came from ___ and transportation businesses\ntheir ___ was designed to encourage collecting art"} /></label>
            <label>Completion answers, one per line<Textarea name="reading_note_answers" placeholder={"coal\neducation"} /></label>
            <label>Correct answer<Input name="reading_answer" placeholder="A" /></label>
          </Card>

          <Card className="builder-card">
            <div className="builder-step"><span>3</span><div><Badge tone="listening">Listening</Badge><h2>Listening section</h2></div></div>
            <label>Section title<Input name="listening_title" defaultValue="Listening Section 1" /></label>
            <div className="two-col">
              <label>Upload audio<Input name="audio_file" type="file" accept="audio/*" /></label>
              <label>Or paste audio URL<Input name="audio_url" placeholder="https://..." /></label>
            </div>
            <label>Transcript / teacher note<Textarea name="listening_transcript" placeholder="Optional transcript for internal checking." /></label>
            <div className="two-col">
              <label>Question type<Select name="listening_question_type" defaultValue="short_answer"><option value="short_answer">Short answer</option><option value="note_completion">Note completion</option><option value="mcq">Multiple choice</option><option value="summary_completion">Summary completion</option><option value="table_completion">Table completion</option><option value="mcq_multi">Multiple answers</option></Select></label>
              <label>Question<Input name="listening_question" placeholder="What time does the session begin?" /></label>
            </div>
            <label>Options, one per line<Textarea name="listening_options" placeholder={"Use for MCQ only:\nA. 9:00\nB. 9:30\nC. 10:00"} /></label>
            <label>Gap lines for completion questions<Textarea name="listening_note_items" placeholder={"The session begins at ___\nStudents should bring ___"} /></label>
            <label>Completion answers, one per line<Textarea name="listening_note_answers" placeholder={"9:30\npassport"} /></label>
            <label>Correct answer<Input name="listening_answer" placeholder="B" /></label>
          </Card>

          <Card className="builder-card">
            <div className="builder-step"><span>4</span><div><Badge tone="writing">Writing</Badge><h2>Writing section</h2></div></div>
            <label>Writing instructions<Textarea name="writing_instructions" placeholder="Answer both tasks. Task 2 should be at least 250 words." /></label>
            <label>Task 1 prompt<Textarea name="writing_task_1" placeholder="The chart below shows..." /></label>
            <label>Task 2 prompt<Textarea name="writing_task_2" placeholder="Some people think..." /></label>
          </Card>

          <Card className="builder-card publish-card">
            <div>
              <p className="eyebrow">Save</p>
              <h2>Student visibility checklist</h2>
              <ul className="studio-list">
                <li>Draft tests stay hidden until the lesson is published.</li>
                <li>Published tests appear in the student dashboard automatically.</li>
                <li>Direct preview uses `NEXT_PUBLIC_STUDENT_APP_URL` in production.</li>
              </ul>
            </div>
            <Button type="submit">Save full test</Button>
          </Card>
        </form>

        <aside className="builder-aside">
          <Card className="panel">
            <p className="eyebrow">Import</p>
            <h2>Full test JSON</h2>
            <p className="muted">Use this only when the JSON already contains all sections. If one section is broken, use the separate skill imports below.</p>
            <form action={importFullTestJsonAction} className="form-stack">
              <label>Upload JSON<Input name="json_file" type="file" accept="application/json,.json" /></label>
              <label>Paste JSON<Textarea name="import_json" defaultValue={sampleImport} /></label>
              <Button type="submit" variant="secondary">Import full test</Button>
            </form>
          </Card>

          <Card className="panel split-imports">
            <p className="eyebrow">Separate imports</p>
            <h2>Import by skill</h2>
            <p className="muted">Reading, Listening, and Writing can be created separately, so errors are easier to edit.</p>
            <SkillImportForm skill="reading" label="Reading JSON" sample={readingImport} />
            <SkillImportForm skill="listening" label="Listening JSON" sample={listeningImport} />
            <SkillImportForm skill="writing" label="Writing JSON" sample={writingImport} />
          </Card>

          <Card className="panel">
            <p className="eyebrow">Quality gate</p>
            <h2>Before publish</h2>
            <div className="checklist">
              <span>Reading has passage text and answer key.</span>
              <span>Listening has audio URL or uploaded audio file.</span>
              <span>Writing prompts are visible in the student test screen.</span>
              <span>Student preview opens after the lesson is published.</span>
            </div>
            <Link className="btn btn-secondary" href="/lessons">Check Visibility</Link>
          </Card>
        </aside>
      </div>
    </AdminShell>
  );
}

function SkillImportForm({ skill, label, sample }: { skill: "reading" | "listening" | "writing"; label: string; sample: string }) {
  return (
    <form action={importSkillJsonAction} className="skill-import-form">
      <input type="hidden" name="skill" value={skill} />
      <h3>{label}</h3>
      <label>Upload JSON<Input name={`${skill}_json_file`} type="file" accept="application/json,.json" /></label>
      <label>Paste JSON<Textarea name={`${skill}_import_json`} defaultValue={sample} /></label>
      <Button type="submit" variant="secondary">Import {skill}</Button>
    </form>
  );
}
