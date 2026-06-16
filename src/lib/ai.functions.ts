import { createServerFn } from "@tanstack/react-start";
import { generateObject, generateText } from "ai";
import { z } from "zod";

function mapAiError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("429")) return new Error("Rate limit reached. Please try again in a moment.");
  if (message.includes("402")) return new Error("AI credits exhausted. Add credits in workspace settings.");
  return new Error(message);
}

async function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
  return createLovableAiGatewayProvider(key)("google/gemini-3-flash-preview");
}

async function runPrompt(system: string, prompt: string): Promise<string> {
  const model = await getModel();
  try {
    const { text } = await generateText({ model, system, prompt });
    return text;
  } catch (err: unknown) {
    throw mapAiError(err);
  }
}

const EmailInput = z.object({
  recipient: z.string().min(1),
  subject: z.string().min(1),
  purpose: z.string().min(1),
  tone: z.enum(["Formal", "Professional", "Friendly", "Persuasive"]),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => EmailInput.parse(d))
  .handler(async ({ data }) => {
    const prompt = `Write an email.

Recipient: ${data.recipient}
Subject: ${data.subject}
Purpose: ${data.purpose}
Tone: ${data.tone}

Output the email starting with "Subject:" on its own line, then the body. No commentary.`;
    const text = await runPrompt(
      "You are an expert email writer for busy professionals. Produce clear, well-formatted emails.",
      prompt,
    );
    return { text };
  });

const MeetingInput = z.object({ notes: z.string().min(10) });

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => MeetingInput.parse(d))
  .handler(async ({ data }) => {
    const text = await runPrompt(
      "You summarize meeting notes for executives. Be concise and structured.",
      `Summarize these meeting notes. Use markdown with these exact sections:

## Summary
## Key Decisions
## Action Items
## Deadlines

Notes:
${data.notes}`,
    );
    return { text };
  });

const PlannerInput = z.object({
  tasks: z
    .array(
      z.object({
        title: z.string().min(1),
        durationMinutes: z.number().int().min(5).max(480),
        due: z.string().optional(),
        priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
      }),
    )
    .min(1),
  workStart: z.string().default("08:00"),
  workEnd: z.string().default("18:00"),
});

const ScheduleSchema = z.object({
  blocks: z.array(
    z.object({
      startTime: z.string(),
      endTime: z.string(),
      title: z.string(),
      type: z.enum(["task", "break", "buffer"]),
      priority: z.enum(["Low", "Medium", "High"]).optional(),
      notes: z.string().optional(),
    }),
  ),
  rationale: z.string(),
});

export type Schedule = z.infer<typeof ScheduleSchema>;

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PlannerInput.parse(d))
  .handler(async ({ data }) => {
    const list = data.tasks
      .map(
        (t, i) =>
          `${i + 1}. ${t.title} — ${t.durationMinutes} min, ${t.priority} priority${t.due ? `, due ${t.due}` : ""}`,
      )
      .join("\n");
    try {
      const text = await runPrompt(
        "You are an executive productivity coach. Build realistic, prioritized daily schedules with clear time blocks. Always respond with valid JSON only — no markdown fences, no commentary.",
        `Build a daily schedule between ${data.workStart} and ${data.workEnd}.

Rules:
- Honor each task's stated duration exactly.
- Order by urgency (due date) and priority (High first).
- Insert short breaks (10-15 min) between long focus blocks (>60 min).
- Optionally add buffer blocks for transitions.
- Times must be in 24h "HH:MM" format and not overlap.
- Each task in the input must appear as exactly one block of type "task".

Tasks:
${list}

Respond ONLY with a JSON object of this exact shape:
{
  "blocks": [
    { "startTime": "HH:MM", "endTime": "HH:MM", "title": "string", "type": "task" | "break" | "buffer", "priority": "Low" | "Medium" | "High", "notes": "string" }
  ],
  "rationale": "string"
}
priority and notes are optional on each block.`,
      );
      const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const s = cleaned.search(/[{[]/);
      const e = cleaned.lastIndexOf("}");
      if (s === -1 || e === -1) throw new Error("AI returned no JSON");
      const parsed = JSON.parse(cleaned.substring(s, e + 1));
      return { schedule: ScheduleSchema.parse(parsed) };
    } catch (err) {
      throw mapAiError(err);
    }
  });

const ResearchInput = z.object({ topic: z.string().min(3) });

export const researchTopic = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ResearchInput.parse(d))
  .handler(async ({ data }) => {
    const text = await runPrompt(
      "You are a sharp research analyst. Synthesize topics into clear actionable briefings.",
      `Analyze the following topic. Use markdown with these exact sections:

## Summary
## Key Insights
## Recommendations

Topic:
${data.topic}`,
    );
    return { text };
  });
