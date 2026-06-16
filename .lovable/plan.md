## Enhance AI Task Planner

Two changes: stricter task input (name + duration required) and a structured, visually appealing schedule output (timeline cards instead of a markdown blob).

### 1. Input form (`src/routes/planner.tsx`)

- Add a required `duration` field (minutes) to each task row alongside title, due date, and priority.
  - Number input, min 5, step 5, default 30, with a "min" suffix label.
  - Title input also marked required (red ring if empty on submit).
- Client validation before calling the server fn:
  - Every kept task must have non-empty title AND duration ≥ 5.
  - Show inline error state on the offending row + a toast ("Each task needs a name and duration").
- Keep the existing add/remove row, priority chips, and day start/end controls.

### 2. Server function (`src/lib/ai.functions.ts`)

- Extend `PlannerInput` task schema with `durationMinutes: z.number().int().min(5).max(480)`.
- Switch `planTasks` from free-form markdown to **structured output** using `generateObject` with this Zod schema:

  ```ts
  z.object({
    blocks: z.array(z.object({
      startTime: z.string(),     // "HH:MM"
      endTime: z.string(),       // "HH:MM"
      title: z.string(),
      type: z.enum(["task", "break", "buffer"]),
      priority: z.enum(["Low","Medium","High"]).optional(),
      notes: z.string().optional(),
    })),
    rationale: z.string(),
  })
  ```
- Prompt instructs the model to honor each task's duration, fit within work hours, insert short breaks between long blocks, and order by priority/urgency.
- Return `{ schedule }` (object) instead of `{ text }`. Update the activity log entry to match.

### 3. Output UI — timeline cards

Replace the current `<Markdown>` block with a dedicated `<ScheduleTimeline blocks={...} />` rendered inside the existing output card.

Layout per block (card row):

```text
┌──────────────────────────────────────────────────────────┐
│  09:00          ●  Draft Q3 roadmap          [HIGH]      │
│  10:30             45 min · task                          │
│  ─────             Notes: pull metrics from dashboard     │
└──────────────────────────────────────────────────────────┘
```

- Left rail: start time (mono, large), end time (muted, smaller), connected by a vertical line through a colored dot.
- Dot color by `type`: task → `bg-primary`, break → `bg-muted-foreground`, buffer → `ring-1 ring-border bg-canvas`.
- Right side: title (semibold), priority pill (`Low` muted / `Medium` secondary / `High` primary), duration + type meta row, optional notes line.
- Cards: `rounded-lg bg-canvas ring-1 ring-border p-4`, stacked with `space-y-3`. Subtle hover lift.
- Above the list: small header row with total scheduled time and task count.
- Below the list: collapsible "Why this order" panel showing `rationale`.
- Empty state and loading shimmer stay as today.

All colors via existing semantic tokens (`primary`, `muted-foreground`, `border`, `canvas`, `surface`) — no hardcoded hex.

### 4. Persistence

- `localStorage` cache key for planner output stores the new schedule object (versioned key bump or simple shape check to ignore stale string payloads).
- Activity entry label updates to `Planned N tasks · M min`.

### Files touched
- `src/routes/planner.tsx` — add duration field, validation, new output renderer.
- `src/lib/ai.functions.ts` — schema + `generateObject` for `planTasks`.
- `src/components/schedule-timeline.tsx` *(new)* — timeline card component.
- `src/lib/storage.ts` — only if planner cache shape needs a guard (minor).

No routing, auth, or backend infra changes.
