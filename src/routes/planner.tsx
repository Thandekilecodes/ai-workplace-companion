import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, FieldLabel } from "@/components/tool-card";
import { Disclaimer, ToolHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { planTasks } from "@/lib/ai.functions";
import { pushActivity } from "@/lib/storage";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Task Planner — Nexus AI" },
      { name: "description", content: "Build a prioritized daily schedule with AI." },
    ],
  }),
  component: PlannerPage,
});

type Task = { id: string; title: string; due: string; priority: "Low" | "Medium" | "High" };

function newTask(): Task {
  return { id: crypto.randomUUID(), title: "", due: "", priority: "Medium" };
}

function PlannerPage() {
  const [tasks, setTasks] = useState<Task[]>([newTask()]);
  const [workStart, setWorkStart] = useState("08:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  function update(id: string, patch: Partial<Task>) {
    setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  async function onGenerate() {
    const cleaned = tasks
      .filter((t) => t.title.trim().length > 0)
      .map((t) => ({
        title: t.title.trim(),
        due: t.due || undefined,
        priority: t.priority,
      }));
    if (cleaned.length === 0) {
      toast.error("Add at least one task.");
      return;
    }
    setLoading(true);
    try {
      const res = await planTasks({ data: { tasks: cleaned, workStart, workEnd } });
      setOutput(res.text);
      pushActivity({ tool: "planner", label: `Planned ${cleaned.length} tasks` });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-8 md:py-12">
      <ToolHeader
        title="AI Task Planner"
        description="Add your tasks. We'll build a time-blocked schedule prioritized by urgency and importance."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <FieldLabel>Day starts</FieldLabel>
                <input
                  type="time"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                  className="w-full rounded-md border-0 bg-canvas px-3 py-2 text-sm ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Day ends</FieldLabel>
                <input
                  type="time"
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                  className="w-full rounded-md border-0 bg-canvas px-3 py-2 text-sm ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel>Tasks</FieldLabel>
              {tasks.map((t) => (
                <div key={t.id} className="space-y-1.5 rounded-md bg-canvas p-3 ring-1 ring-border">
                  <input
                    value={t.title}
                    onChange={(e) => update(t.id, { title: e.target.value })}
                    placeholder="Task title"
                    className="w-full rounded border-0 bg-transparent px-1 py-1 text-sm focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={t.due}
                      onChange={(e) => update(t.id, { due: e.target.value })}
                      className="rounded border-0 bg-surface px-2 py-1 text-xs ring-1 ring-border focus:outline-none"
                    />
                    <div className="flex rounded-md ring-1 ring-border overflow-hidden">
                      {(["Low", "Medium", "High"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => update(t.id, { priority: p })}
                          className={cn(
                            "px-2 py-1 text-[10px] font-semibold uppercase",
                            t.priority === p
                              ? "bg-primary text-primary-foreground"
                              : "bg-surface text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setTasks((cur) => cur.filter((x) => x.id !== t.id))}
                      className="ml-auto rounded p-1 text-muted-foreground hover:bg-surface hover:text-destructive"
                      aria-label="Remove task"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setTasks((cur) => [...cur, newTask()])}
                className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border bg-canvas py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <Plus className="size-3.5" /> Add task
              </button>
            </div>

            <Button onClick={onGenerate} disabled={loading} className="w-full">
              {loading ? <Spinner /> : null}
              {loading ? "Planning…" : "Build my day"}
            </Button>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="flex min-h-[420px] flex-col p-6">
            <div className="mb-4">
              <span className="text-xs font-semibold text-muted-foreground">Your Schedule</span>
            </div>
            {loading && !output ? (
              <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Spinner /> Building your schedule…
                </div>
              </div>
            ) : output ? (
              <div className="flex-1 rounded-lg bg-canvas p-5 ring-1 ring-border overflow-auto">
                <Markdown>{output}</Markdown>
              </div>
            ) : (
              <div className="grid flex-1 place-items-center rounded-lg bg-canvas p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
                Your time-blocked schedule will appear here.
              </div>
            )}
          </Card>
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}
