"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import { Badge, Button, Card, Input, Select, Textarea } from "@ielts-pro/ui";
import {
  createListeningAudioUploadAction,
  importHtmlContentAction,
  previewHtmlImportAction,
  type HtmlPreviewState
} from "../../actions/lms";

const readingTypes = [
  "Matching Headings",
  "True / False / Not Given",
  "Yes / No / Not Given",
  "Multiple Choice",
  "Matching Information",
  "Matching Features",
  "Matching Sentence Endings",
  "Sentence Completion",
  "Summary Completion",
  "Note Completion",
  "Table Completion",
  "Flow-chart Completion",
  "Diagram Label Completion",
  "Short Answer Questions"
];

const listeningTypes = [
  "Form Completion",
  "Note Completion",
  "Table Completion",
  "Flow-chart Completion",
  "Multiple Choice",
  "Matching",
  "Plan / Map / Diagram Labelling",
  "Sentence Completion",
  "Short Answer Questions"
];

const writingTypes = ["Writing Task 1", "Writing Task 2", "Full Writing"];

const initialPreviewState: HtmlPreviewState = { status: "idle" };

type Skill = "auto" | "reading" | "listening" | "writing" | "full_test";

export function TestBuilderWizard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewState, previewAction, previewPending] = useActionState(previewHtmlImportAction, initialPreviewState);
  const [importMode, setImportMode] = useState("separate_skill");
  const [skill, setSkill] = useState<Skill>("auto");
  const [structure, setStructure] = useState("auto_detect");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientError, setClientError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [contentName, setContentName] = useState("");
  const [rawHtml, setRawHtml] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioUpload, setAudioUpload] = useState<{ status: "idle" | "uploading" | "success" | "error"; fileName?: string; error?: string }>({ status: "idle" });

  const questionTypes = useMemo(() => {
    if (skill === "listening") return listeningTypes;
    if (skill === "writing") return writingTypes;
    return readingTypes;
  }, [skill]);

  const validFile = selectedFile ? isHtmlFile(selectedFile) : false;
  const previewMatchesCurrentFile =
    previewState.status === "success" &&
    !!selectedFile &&
    previewState.data?.fileName === selectedFile.name &&
    Number(previewState.data?.fileSize || 0) === Number(selectedFile.size || 0);
  const fileReady = Boolean(validFile && rawHtml.trim());
  const canPreview = Boolean(fileReady && !clientError);
  const canSave = Boolean(canPreview && previewMatchesCurrentFile && !previewPending && audioUpload.status !== "uploading");
  const uploadStatus = getUploadStatus(selectedFile, clientError, previewState, previewMatchesCurrentFile);

  useEffect(() => {
    if (previewMatchesCurrentFile && previewState.data?.title && !contentName) {
      setContentName(previewState.data.title);
    }
  }, [contentName, previewMatchesCurrentFile, previewState.data?.title]);

  useEffect(() => {
    if (skill === "auto") setStructure("auto_detect");
    if (skill === "listening") setStructure("listening_part_1");
    if (skill === "writing") setStructure("writing_task_1");
    if (skill === "full_test") setStructure("full_ielts_test");
    if (skill === "reading") setStructure("reading_passage_1");
  }, [skill]);

  async function handleFile(file: File | null) {
    if (!file) return;
    const validationError = validateFile(file);
    setSelectedFile(file);
    setClientError(validationError);
    setRawHtml("");
    if (validationError && fileInputRef.current) fileInputRef.current.value = "";
    if (!validationError) assignFile(fileInputRef.current, file);
    if (validationError) return;

    try {
      setRawHtml(await file.text());
    } catch {
      setClientError("Could not read this HTML file. Choose the file again and try preview parse.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFile(event.target.files?.[0] || null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void handleFile(event.dataTransfer.files?.[0] || null);
  }

  function handleDropzoneKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    fileInputRef.current?.click();
  }

  async function handleAudioFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAudioUpload({ status: "uploading", fileName: file.name });
    try {
      const ticket = await createListeningAudioUploadAction(file.name, file.size);
      if (ticket.status === "error") {
        setAudioUpload({ status: "error", fileName: file.name, error: ticket.error });
        return;
      }
      const response = await fetch(ticket.signedUrl, {
        method: "PUT",
        headers: { "content-type": file.type || "audio/mpeg", "x-upsert": "true" },
        body: file
      });
      if (!response.ok) {
        setAudioUpload({ status: "error", fileName: file.name, error: `Audio upload failed (${response.status}). Try again.` });
        return;
      }
      setAudioUrl(ticket.publicUrl);
      setAudioUpload({ status: "success", fileName: file.name });
    } catch {
      setAudioUpload({ status: "error", fileName: file.name, error: "Audio upload failed. Check your connection and try again." });
    }
  }

  function removeFile() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSelectedFile(null);
    setClientError("");
    setRawHtml("");
  }

  return (
    <Card className="panel wizard-card builder-wizard-card">
      <div className="wizard-steps" aria-label="Test Builder steps">
        <span className="is-active"><i>1</i> Import mode</span>
        <span><i>2</i> Test structure</span>
        <span><i>3</i> HTML upload</span>
        <span><i>4</i> Parsed preview</span>
        <span><i>5</i> Save to Content Studio</span>
      </div>

      <form action={importHtmlContentAction} className="html-import-form">
        <section className="builder-section">
          <div className="builder-section-copy">
            <p className="eyebrow">Step 1</p>
            <h2>Import mode</h2>
            <p className="muted">Pick how this upload should be treated after it lands in Content Studio.</p>
          </div>
          <div className="mode-grid">
            <label className={`mode-option ${importMode === "full_mock" ? "is-selected" : ""}`}>
              <input type="radio" name="import_mode" value="full_mock" checked={importMode === "full_mock"} onChange={() => setImportMode("full_mock")} />
              <strong>Full Mock</strong>
              <span>Complete exam or multiple sections prepared as one mock set.</span>
            </label>
            <label className={`mode-option ${importMode === "full_test" ? "is-selected" : ""}`}>
              <input type="radio" name="import_mode" value="full_test" checked={importMode === "full_test"} onChange={() => setImportMode("full_test")} />
              <strong>Full Test</strong>
              <span>Full Reading, Listening, Writing, Speaking, or full IELTS bundle.</span>
            </label>
            <label className={`mode-option ${importMode === "separate_skill" ? "is-selected" : ""}`}>
              <input type="radio" name="import_mode" value="separate_skill" checked={importMode === "separate_skill"} onChange={() => setImportMode("separate_skill")} />
              <strong>Separate Skill</strong>
              <span>Single passage, listening part, writing task, or speaking prompt.</span>
            </label>
          </div>
        </section>

        <section className="builder-section">
          <div className="builder-section-copy">
            <p className="eyebrow">Step 2</p>
            <h2>Test structure</h2>
            <p className="muted">These settings guide the parser and the student-facing renderer.</p>
          </div>
          <div className="builder-fields-grid builder-fields-grid-readable">
            <label>
              Skill
              <Select name="skill" value={skill} onChange={(event) => setSkill(event.target.value as Skill)}>
                <option value="auto">Auto detect from HTML</option>
                <option value="reading">Reading</option>
                <option value="listening">Listening</option>
                <option value="writing">Writing</option>
                <option value="full_test">Full IELTS Test</option>
              </Select>
            </label>
            <label>
              Structure
              <Select name="import_structure" value={structure} onChange={(event) => setStructure(event.target.value)}>
                <option value="auto_detect">Auto detect from file</option>
                <optgroup label="Reading">
                  <option value="reading_full">Full Reading</option>
                  <option value="reading_passage_1">Reading Passage 1</option>
                  <option value="reading_passage_2">Reading Passage 2</option>
                  <option value="reading_passage_3">Reading Passage 3</option>
                </optgroup>
                <optgroup label="Listening">
                  <option value="listening_full">Full Listening</option>
                  <option value="listening_part_1">Listening Part 1</option>
                  <option value="listening_part_2">Listening Part 2</option>
                  <option value="listening_part_3">Listening Part 3</option>
                  <option value="listening_part_4">Listening Part 4</option>
                </optgroup>
                <optgroup label="Writing">
                  <option value="writing_task_1">Writing Task 1</option>
                  <option value="writing_task_2">Writing Task 2</option>
                  <option value="writing_both_tasks">Writing Tasks 1 and 2</option>
                </optgroup>
                <optgroup label="Full">
                  <option value="full_mock_one_file">One full mock HTML</option>
                  <option value="full_ielts_test">Full IELTS Test</option>
                </optgroup>
              </Select>
            </label>
            <label>
              Question type
              <Select name="question_type" defaultValue="" key={skill}>
                <option value="">Auto detect</option>
                {questionTypes.map((type) => <option value={type} key={type}>{type}</option>)}
              </Select>
            </label>
            <label>
              Subtype label
              <Input name="subtype" placeholder="Passage 1, Part 3, Task 2..." />
            </label>
          </div>
        </section>

        <section className="builder-section">
          <div className="builder-section-copy">
            <p className="eyebrow">Step 3</p>
            <h2>HTML upload</h2>
            <p className="muted">Upload one exported IELTS HTML file. Other document formats are blocked.</p>
          </div>
          <div className="upload-workspace">
            <div
              role="button"
              tabIndex={0}
              className={`builder-upload-dropzone ${isDragging ? "is-dragging" : ""} ${clientError ? "has-error" : ""} ${validFile ? "has-file" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={handleDropzoneKeyDown}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                className="hidden-file-input"
                data-testid="html-file-input"
                name="html_file"
                type="file"
                accept=".html,.htm,text/html"
                onChange={handleInputChange}
                tabIndex={-1}
                aria-hidden="true"
              />
              <textarea
                className="hidden-html-source"
                name="html_text"
                value={rawHtml}
                readOnly
                tabIndex={-1}
                aria-hidden="true"
              />
              <input type="hidden" name="html_text_file_name" value={selectedFile?.name || ""} />
              <input type="hidden" name="html_text_file_size" value={selectedFile?.size || 0} />
              <span className="upload-icon" aria-hidden="true">HTML</span>
              <strong>Drop your HTML file here</strong>
              <span className="upload-choose-text">or choose file</span>
              <small>Only .html and .htm files are accepted</small>
            </div>

            {selectedFile ? (
              <div className="upload-selected-file">
                <div>
                  <span>{validFile ? "Selected file" : "Unsupported file"}</span>
                  <strong>{selectedFile.name}</strong>
                  <small>{formatFileSize(selectedFile.size)}</small>
                </div>
                <Button type="button" variant="ghost" onClick={removeFile}>Remove</Button>
              </div>
            ) : null}

            <div className={`upload-validation upload-validation-${uploadStatus.tone}`} role={clientError || previewState.status === "error" ? "alert" : "status"}>
              {uploadStatus.message}
            </div>

            <div className="builder-fields-grid two-fields">
              <label>
                Content name
                <Input name="content_name" value={contentName} onChange={(event) => setContentName(event.target.value)} placeholder="RT11 Reading Passage 1" />
              </label>
              <label>
                Listening audio URL
                <Input name="manual_audio_url" value={audioUrl} onChange={(event) => setAudioUrl(event.target.value)} placeholder="Paste a URL or upload a file below" />
              </label>
            </div>
            <div className="builder-fields-grid two-fields">
              <label>
                Listening audio file (MP3, M4A, WAV, OGG, AAC)
                {/* No name attribute: the file must not ride the form POST (Vercel 4.5MB body cap). It goes straight to storage. */}
                <input
                  type="file"
                  accept=".mp3,.m4a,.wav,.ogg,.aac,audio/*"
                  onChange={handleAudioFile}
                  disabled={audioUpload.status === "uploading"}
                  data-testid="audio-file-input"
                />
              </label>
              <AudioUploadStatus upload={audioUpload} audioUrl={audioUrl} />
            </div>
          </div>
        </section>

        <section className="builder-section">
          <div className="builder-section-copy">
            <p className="eyebrow">Step 4</p>
            <h2>Parsed preview</h2>
            <p className="muted">Run parser before saving to confirm title, skill, questions, answers, and audio detection.</p>
          </div>
          <ParsedPreview
            previewState={previewState}
            previewPending={previewPending}
            selectedFile={selectedFile}
            previewMatchesCurrentFile={previewMatchesCurrentFile}
          />
        </section>

        <section className="builder-section save-draft-section">
          <div className="builder-section-copy">
            <p className="eyebrow">Step 5</p>
            <h2>Save to Content Studio</h2>
            <p className="muted">Imported content stays draft and hidden until you attach it to a lesson and publish the lesson.</p>
          </div>
          <div className="save-draft-controls">
            <label>
              Teacher note
              <Textarea name="content_description" placeholder="Optional internal note for Content Studio" />
            </label>
            <div className="builder-action-row">
              <Button type="submit" variant="secondary" formAction={previewAction} disabled={!canPreview || previewPending} data-testid="preview-parse-button">
                {previewPending ? "Parsing..." : "Preview parse"}
              </Button>
              <Button type="submit" disabled={!canSave} data-testid="save-content-button">
                Save to Content Studio
              </Button>
            </div>
            {!canPreview ? <small className="muted">Choose a valid .html or .htm file before previewing or saving.</small> : null}
            {canPreview && !canSave ? <small className="muted">Preview the current HTML file before saving so Content Studio gets the exact parsed questions, answers, and audio.</small> : null}
          </div>
        </section>
      </form>
    </Card>
  );
}

function ParsedPreview({
  previewState,
  previewPending,
  selectedFile,
  previewMatchesCurrentFile
}: {
  previewState: HtmlPreviewState;
  previewPending: boolean;
  selectedFile: File | null;
  previewMatchesCurrentFile: boolean;
}) {
  if (previewPending) {
    return (
      <div className="parsed-preview-panel is-loading" data-testid="parsed-preview-loading">
        <span className="preview-spinner" aria-hidden="true" />
        <strong>Parsing uploaded HTML...</strong>
        <small>Checking structure, questions, answers, audio, and safe HTML.</small>
      </div>
    );
  }

  if (previewState.status === "error") {
    return (
      <div className="parsed-preview-panel has-error" role="alert" data-testid="parsed-preview-error">
        <strong>Parser could not read this file</strong>
        <small>{previewState.error}</small>
      </div>
    );
  }

  if (!selectedFile || previewState.status !== "success" || !previewState.data) {
    return (
      <div className="parsed-preview-panel" data-testid="parsed-preview-empty">
        <strong>No parsed preview yet</strong>
        <small>Upload an HTML file and click Preview parse. This does not save anything.</small>
      </div>
    );
  }

  if (!previewMatchesCurrentFile) {
    return (
      <div className="parsed-preview-panel is-stale" role="alert" data-testid="parsed-preview-stale">
        <strong>Preview belongs to another file</strong>
        <small>Current file: {selectedFile.name}. Click Preview parse again before saving.</small>
      </div>
    );
  }

  const data = previewState.data;
  return (
    <div className="parsed-preview-panel has-preview" data-testid="parsed-preview-success">
      <div className="parsed-preview-head">
        <div>
          <Badge tone="success">Parser ready</Badge>
          <h3>{data.title}</h3>
          <small>{data.fileName} · {formatFileSize(data.fileSize)}</small>
        </div>
        <Badge tone={data.skill === "listening" ? "listening" : data.skill === "writing" ? "writing" : data.skill === "full_test" ? "full" : "reading"}>
          {labelFor(data.skill)}
        </Badge>
      </div>
      <div className="preview-grid">
        <Summary label="Questions" value={String(data.questionCount)} />
        <Summary label="Answer keys" value={String(data.answerCount)} />
        <Summary label="Audio" value={data.audioDetected ? "Detected" : "Not detected"} />
        <Summary label="Subtype" value={data.subtype || "Auto"} />
      </div>
      {data.audioUrl ? <p className="preview-audio-line">Audio source: {data.audioUrl}</p> : null}
      {data.warnings.length ? (
        <div className="preview-warnings">
          {data.warnings.map((warning) => <span key={warning}>{warning}</span>)}
        </div>
      ) : null}
      <div className="preview-text">
        <span>Preview text</span>
        <p>{data.previewText || "No readable text detected."}</p>
      </div>
    </div>
  );
}

function AudioUploadStatus({ upload, audioUrl }: { upload: { status: string; fileName?: string; error?: string }; audioUrl: string }) {
  if (upload.status === "uploading") {
    return <div className="upload-validation upload-validation-warning" role="status">Uploading {upload.fileName}... Keep this page open.</div>;
  }
  if (upload.status === "error") {
    return <div className="upload-validation upload-validation-error" role="alert">{upload.error}</div>;
  }
  if (upload.status === "success" && audioUrl) {
    return (
      <div className="upload-validation upload-validation-success" role="status">
        {upload.fileName} uploaded. Students will stream it from the audio URL field.
      </div>
    );
  }
  return <div className="upload-validation upload-validation-neutral" role="status">Optional: upload the listening audio and the URL fills in automatically.</div>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="parsed-summary">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function isHtmlFile(file: File) {
  return /\.(html|htm)$/i.test(file.name);
}

function validateFile(file: File) {
  if (isHtmlFile(file)) return "";
  return "Only .html and .htm files are accepted. JSON, PDF, DOCX, TXT are rejected.";
}

function assignFile(input: HTMLInputElement | null, file: File) {
  if (!input || typeof DataTransfer === "undefined") return;
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
}

function formatFileSize(bytes: number) {
  if (!bytes) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function labelFor(skill: string) {
  if (skill === "reading") return "Reading";
  if (skill === "listening") return "Listening";
  if (skill === "writing") return "Writing";
  if (skill === "full_test") return "Full Test";
  return skill;
}

function getUploadStatus(selectedFile: File | null, clientError: string, previewState: HtmlPreviewState, previewMatchesCurrentFile: boolean) {
  if (clientError) return { tone: "error", message: clientError };
  if (!selectedFile) return { tone: "neutral", message: "No file selected yet." };
  if (previewState.status === "error") return { tone: "error", message: previewState.error || "Parser failed." };
  if (previewState.status === "success" && previewMatchesCurrentFile) return { tone: "success", message: "HTML parsed successfully. You can save it to Content Studio." };
  if (previewState.status === "success" && !previewMatchesCurrentFile) return { tone: "warning", message: "Selected file changed after preview. Parse this file before saving." };
  return { tone: "success", message: "Valid HTML file selected. Preview parse it before saving." };
}
