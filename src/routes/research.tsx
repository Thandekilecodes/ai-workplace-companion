import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, FieldLabel } from "@/components/tool-card";
import { Disclaimer, ToolHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { researchTopic } from "@/lib/ai.functions";
import { pushActivity } from "@/lib/storage";
import { Markdown } from "@/components/markdown";
import { Copy } from "lucide-react";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Assistant — Nexus AI" },
      { name: "description", content: "Get a structured AI briefing on any topic." },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const [topic, setTopic] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function onGenerate() {
    if (topic.trim().length < 3) {
      toast.error("Add a topic or article text.");
      return;
    }
    setLoading(true);
    try {
      const res = await researchTopic({ data: { topic } });
      setOutput(res.text);
      pushActivity({ tool: "research", label: topic.slice(0, 50) });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to analyze");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-8 md:py-12">
      <ToolHeader
        title="AI Research Assistant"
        description="Paste a topic, question, or article. Get summary, key insights, and recommendations."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card className="space-y-4">
            <div className="space-y-1.5">
              <FieldLabel>Topic or article</FieldLabel>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={12}
                placeholder="e.g. The impact of generative AI on knowledge work productivity…"
                className="w-full resize-none rounded-md border-0 bg-canvas px-3 py-2 text-sm leading-relaxed ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button onClick={onGenerate} disabled={loading} className="w-full">
              {loading ? <Spinner /> : null}
              {loading ? "Researching…" : "Analyze"}
            </Button>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="flex min-h-[420px] flex-col p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Briefing</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(output);
                  toast.success("Copied");
                }}
                disabled={!output}
                className="text-xs"
              >
                <Copy className="mr-1 size-3" /> Copy
              </Button>
            </div>
            {loading && !output ? (
              <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Spinner /> Synthesizing…
                </div>
              </div>
            ) : output ? (
              <div className="flex-1 rounded-lg bg-canvas p-5 ring-1 ring-border overflow-auto">
                <Markdown>{output}</Markdown>
              </div>
            ) : (
              <div className="grid flex-1 place-items-center rounded-lg bg-canvas p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
                Summary, insights, and recommendations will appear here.
              </div>
            )}
          </Card>
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}
