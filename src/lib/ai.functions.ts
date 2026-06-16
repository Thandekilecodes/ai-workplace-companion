import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

async function runPrompt(system: string, prompt: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
  const gateway = createLovableAiGatewayProvider(key);
  try {
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system,
      prompt,
    });
    return text;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("429")) throw new Error("Rate limit reached. Please try again in a moment.");
    if (message.includes("402")) throw new Error("AI credits exhausted. Add credits in workspace settings.");
    throw new Error(message);
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
        due: z.string().optional(),
        priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
      }),
    )
    .min(1),
  workStart: z.string().default("08:00"),
  workEnd: z.string().default("18:00"),
});

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PlannerInput.parse(d))
  .handler(async ({ data }) => {
    const list = data.tasks
      .map((t, i) => `${i + 1}. ${t.title}${t.due ? ` (due ${t.due})` : ""} — ${t.priority} priority`)
      .join("\n");
    const text = await runPrompt(
      "You are an executive productivity coach. Build realistic, prioritized daily schedules.",
      `Create a daily schedule between ${data.workStart} and ${data.workEnd}, prioritizing by urgency and importance. Use a markdown table with columns "Time" and "Task". Add a short "Notes" section below with rationale.

Tasks:
${list}`,
    );
    return { text };
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
