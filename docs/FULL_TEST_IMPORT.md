# Full Test Import Format

Admin route: `/full-tests/new`

The full-test JSON import creates one `lessons` row and one `tasks` row with `skill = "full_test"`.

The builder also supports separate Reading, Listening, and Writing JSON imports. Use those when a teacher wants easier editing and smaller failure scope.

## Minimal Shape

```json
{
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
        {
          "type": "short_answer",
          "question": "What time does it start?",
          "answer": "9:30"
        }
      ]
    },
    {
      "skill": "writing",
      "title": "Writing Task 2",
      "prompt": "Some people believe..."
    }
  ]
}
```

## Supported Question Types

- `mcq`: stores options and one answer letter.
- `mcq_multi`: stores options and multiple answer letters.
- `short_answer`: text answer.
- `gap_fill`, `summary_completion`, `table_completion`, `note_completion`, `flow_chart`, `diagram_label`: use `items`.
- `matching`, `sentence_endings`: use `items` and optional `matchOptions`.

## Note Completion

Use `___` or `[blank]` inside the item label where the student input should appear.

```json
{
  "type": "note_completion",
  "question": "Complete the notes below.",
  "items": [
    {
      "label": "their grandfather's wealth came from ___ and transportation businesses",
      "answer": "coal"
    },
    {
      "label": "their ___ was designed to encourage collecting art",
      "answer": "education"
    }
  ]
}
```

## Separate Skill Imports

Reading JSON:

```json
{
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
}
```

Listening JSON:

```json
{
  "title": "Listening Section 1",
  "audio_url": "https://example.com/listening.mp3",
  "questions": [
    { "type": "short_answer", "question": "What time does it start?", "answer": "9:30" }
  ]
}
```

Writing JSON:

```json
{
  "title": "Writing Task 2",
  "prompt": "Some people believe..."
}
```

If JSON parsing, upload, or Supabase write fails, the builder redirects back to `/full-tests/new` with a visible error message instead of crashing the page.

## Audio

The manual builder can upload audio to the Supabase `task-media` bucket through the server action. JSON import expects an existing `audio_url`.

For production playback, the uploaded object must be publicly readable or served through a signed URL strategy.

## Publishing

- `published: false` keeps the full test hidden from students.
- `published: true` makes the lesson visible immediately.
- Admin direct preview needs `NEXT_PUBLIC_STUDENT_APP_URL` on the admin Vercel project.
