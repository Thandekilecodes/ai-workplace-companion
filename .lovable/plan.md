# Planner: start time input + per-day schedule sections

## Goals
1. Replace the per-task **duration** field with a **start time** field (keeping the existing scheduled day/time picker as the single source of truth).
2. Group the generated schedule into clearly separated **sections per day**.

## Changes

### 1. Task input form (`src/routes/planner.tsx`)
- Remove the `duration` number input from each task row.
- Keep `scheduledAt` (`datetime-local`) as the required start time. Relabel it "Start time" and make it the primary field next to the title.
- Update `Task` type: drop `duration`. Validation now requires `title` + `scheduledAt` only.
- Update the empty/placeholder copy ("Add tasks with start times…").
- Activity log line becomes `Planned N tasks` (no minute total).

### 2. Server function (`src/lib/ai.functions.ts`)
- `PlannerInput.tasks[]`: remove `durationMinutes`; keep `title`, `scheduledAt`, `priority`.
- Update the prompt:
  - Tasks now come with a fixed **start time** only; the model picks a sensible duration (default 30 min, or longer for High priority / complex-sounding work) and an `endTime`.
  - Conflicts still resolved by priority (High first), shifting lower-priority tasks later.
- `ScheduleSchema`: extend each block with an optional `day` field (ISO date `YYYY-MM-DD`) so the client can group. Prompt instructs the model to set `day` on every block based on the task's scheduled date, and to emit blocks in chronological order across days.

### 3. Timeline rendering (`src/components/schedule-timeline.tsx`)
- Group `schedule.blocks` by `day` (fallback: single "Schedule" group if absent).
- Render each day as its own section with a sticky-ish header showing the formatted date (e.g. "Mon, Jun 16") and that day's task count + total minutes.
- Inside each section, reuse the existing timeline list (dot rail + cards) unchanged.
- Keep the "Why this order" rationale once at the bottom.

## Out of scope
- No changes to other tools (email, meeting, research, chat).
- No new dependencies.
- Visual style stays consistent with current tokens.
