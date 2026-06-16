## AI Workplace Productivity Assistant

A dashboard SaaS app with 5 AI-powered tools, threaded chatbot, and a calm teal "Nexus AI" design. No login — outputs and chat threads persist in browser localStorage.

### Design system (from chosen direction)
- Tokens: `--canvas #fafafa`, `--surface #f4f4f5`, `--brand #0d9488` (teal), text `#18181b` / muted `#71717a`, Inter font. Ported verbatim into `src/styles.css` as semantic tokens (background, card, primary, muted, etc.), with dark-mode equivalents.
- Layout: 256px sidebar (surface bg) + main column with breadcrumb header + scrollable workspace + thin disclaimer footer.
- Components: rounded-xl surface cards with `ring-1 ring-black/5`, pill tone chips, uppercase micro-labels.

### Routes (TanStack Start, file-based)
- `_layout.tsx` — sidebar + header + footer shell, `<Outlet />`
  - `index.tsx` → `/` Dashboard (tool cards + recent activity)
  - `email.tsx` → `/email` Smart Email Generator
  - `meeting.tsx` → `/meeting` Meeting Notes Summarizer
  - `planner.tsx` → `/planner` AI Task Planner
  - `research.tsx` → `/research` Research Assistant
  - `chat.tsx` → `/chat` chatbot index (auto-create/select thread, navigate)
  - `chat.$threadId.tsx` → `/chat/:threadId` active conversation
  - `settings.tsx` → `/settings`

### Chatbot (threads + localStorage)
- AI Elements: install `conversation message prompt-input shimmer tool` via `bun x ai-elements@latest add ...`.
- Thread list in chat layout sub-sidebar; each thread has its own URL; new-thread button creates id and navigates; bootstrap default thread idempotently (no useEffect-only creation); per-thread `UIMessage[]` stored under `nexus.threads` / `nexus.messages.<id>` in localStorage.
- `useChat` keyed by `threadId`, transport → `/api/chat`, persist completed assistant message in onFinish via client-side effect.
- Assistant messages: no bubble background; user messages: `bg-primary text-primary-foreground` pill.

### Tools (each tool view)
- Two-column grid: input card (left, col-span-5) + output card (right, col-span-7).
- Output state: empty placeholder → "Generating..." shimmer → editable result with Copy / Regenerate.
- Outputs cached to localStorage so they persist across reload.

Tool-specific inputs:
- **Email**: recipient, subject, purpose textarea, tone chips (Formal/Professional/Friendly/Persuasive). Output: editable `<textarea>` with subject + body.
- **Meeting**: large notes textarea. Output: structured cards — Summary, Key Decisions, Action Items, Deadlines.
- **Planner**: dynamic task rows (title, due date, priority). Output: time-blocked schedule table.
- **Research**: topic/article textarea. Output: Summary, Key Insights, Recommendations sections.

### AI backend (Lovable AI Gateway)
- Enable Lovable Cloud (provisions `LOVABLE_API_KEY`).
- `src/lib/ai-gateway.server.ts` — provider helper using `@ai-sdk/openai-compatible` against `https://ai.gateway.lovable.dev/v1`.
- `src/routes/api/chat.ts` — server route, `streamText` with `google/gemini-3-flash-preview`, `toUIMessageStreamResponse`.
- `src/lib/ai.functions.ts` — `createServerFn` endpoints for the 4 non-chat tools:
  - `generateEmail`, `summarizeMeeting` (structured Output via Zod), `planTasks` (structured), `researchTopic` (structured).
- Surface 429 / 402 / validation errors via toast.

### Dashboard
- 5 tool cards (icon, title, description, link) + "Recent activity" list pulled from localStorage (last 5 generations across tools).

### Settings
- Theme toggle (light/dark), default tone, "Clear all stored data" button.

### Shared UI
- AppSidebar with active route highlighting via `useRouterState`.
- Header: breadcrumb (current route name), theme toggle, notifications dot, avatar.
- Footer: AI disclaimer on every tool view.
- Toast (`sonner`) for errors and copy confirmations.

### Technical notes
- Stack: TanStack Start, React 19, Tailwind v4, shadcn, AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/openai-compatible`), Zod, AI Elements.
- All chat-shape per `chat-agent-ui-contract`: dedicated `chat.$threadId` route, key chat by threadId, idempotent bootstrap, no nested buttons in thread list.
- No Sparkles icon as logo — use a small teal square logomark matching the prototype.
- Mobile: sidebar collapses to a `Sheet` toggle in header.
