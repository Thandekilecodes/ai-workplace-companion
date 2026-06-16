import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, FieldLabel } from "@/components/tool-card";
import { Disclaimer, ToolHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { generateEmail } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";
import { pushActivity } from "@/lib/storage";
import { Copy } from "lucide-react";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Email Generator — Nexus AI" },
      { name: "description", content: "Generate professional, tone-matched emails with AI." },
    ],
  }),
  component: EmailPage,
});

const TONES = ["Formal", "Professional", "Friendly", "Persuasive"] as const;
type Tone = (typeof TONES)[number];

function EmailPage() {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState<Tone>("Professional");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function onGenerate() {
    if (!recipient.trim() || !subject.trim() || !purpose.trim()) {
      toast.error("Please fill recipient, subject, and purpose.");
      return;
    }
    setLoading(true);
    try {
      const res = await generateEmail({
        data: { recipient, subject, purpose, tone },
      });
      setOutput(res.text);
      pushActivity({ tool: "email", label: subject || "Email draft" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate email");
    } finally {
      setLoading(false);
    }
  }

  async function onCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-8 md:py-12">
      <ToolHeader
        title="Smart Email Generator"
        description="Draft professional correspondence with tone control. Edit the output before sending."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card className="space-y-4">
            <div className="space-y-1.5">
              <FieldLabel>Recipient</FieldLabel>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full rounded-md border-0 bg-canvas px-3 py-2 text-sm ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Subject</FieldLabel>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Project timeline adjustment"
                className="w-full rounded-md border-0 bg-canvas px-3 py-2 text-sm ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Purpose</FieldLabel>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={5}
                placeholder="What does the recipient need to know or do?"
                className="w-full resize-none rounded-md border-0 bg-canvas px-3 py-2 text-sm ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel>Tone</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setTone(t)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors",
                      tone === t
                        ? "bg-primary text-primary-foreground ring-primary"
                        : "bg-canvas text-muted-foreground ring-border hover:text-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={onGenerate}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:brightness-110"
            >
              {loading ? <Spinner /> : null}
              {loading ? "Generating…" : "Generate Draft"}
            </Button>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="flex min-h-[420px] flex-col p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Generated Draft
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopy}
                disabled={!output}
                className="text-xs"
              >
                <Copy className="mr-1 size-3" /> Copy
              </Button>
            </div>
            {loading && !output ? (
              <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Spinner /> Drafting your email…
                </div>
              </div>
            ) : output ? (
              <textarea
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                className="flex-1 resize-none rounded-lg bg-canvas p-5 font-sans text-sm leading-relaxed ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <div className="grid flex-1 place-items-center rounded-lg bg-canvas p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
                Your generated email will appear here.
              </div>
            )}
          </Card>
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}
