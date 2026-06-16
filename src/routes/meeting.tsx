import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, FieldLabel } from "@/components/tool-card";
import { Disclaimer, ToolHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { summarizeMeeting } from "@/lib/ai.functions";
import { pushActivity } from "@/lib/storage";
import { Markdown } from "@/components/markdown";
import { Copy } from "lucide-react";

export const Route = createFileRoute("/meeting")({
  head: () => ({
    meta: [
      { title: "Meeting Summarizer — Nexus AI" },
      { name: "description", content: "Convert raw meeting notes into a structured summary." },
    ],
  }),
  component: MeetingPage,
});

function MeetingPage() {
  const [notes, setNotes] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function onGenerate() {
    if (notes.trim().length < 10) {
      toast.error("Add more meeting notes first.");
      return;
    }
    setLoading(true);
    try {
      const res = await summarizeMeeting({ data: { notes } });
      setOutput(res.text);
      pushActivity({ tool: "meeting", label: notes.slice(0, 40) + (notes.length > 40 ? "…" : "") });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to summarize");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-8 md:py-12">
      <ToolHeader
        title="Meeting Notes Summarizer"
        description="Paste raw notes from a meeting. Get a structured summary with decisions, actions, and deadlines."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card className="space-y-4">
            <div className="space-y-1.5">
              <FieldLabel>Raw Meeting Notes</FieldLabel>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={14}
                placeholder="Paste your meeting notes here…"
                className="w-full resize-none rounded-md border-0 bg-canvas px-3 py-2 text-sm leading-relaxed ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button onClick={onGenerate} disabled={loading} className="w-full">
              {loading ? <Spinner /> : null}
              {loading ? "Summarizing…" : "Summarize"}
            </Button>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="flex min-h-[420px] flex-col p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Summary</span>
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
                  <Spinner /> Reading your notes…
                </div>
              </div>
            ) : output ? (
              <div className="flex-1 rounded-lg bg-canvas p-5 ring-1 ring-border">
                <Markdown>{output}</Markdown>
              </div>
            ) : (
              <div className="grid flex-1 place-items-center rounded-lg bg-canvas p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
                Summary, decisions, action items, and deadlines will appear here.
              </div>
            )}
          </Card>
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}
