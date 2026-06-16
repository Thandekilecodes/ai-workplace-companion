import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, FieldLabel } from "@/components/tool-card";
import { Disclaimer, ToolHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { planTasks, type Schedule } from "@/lib/ai.functions";
import { pushActivity } from "@/lib/storage";
import { ScheduleTimeline } from "@/components/schedule-timeline";
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

type Task = {
  id: string;
  title: string;
  scheduledAt: string;
  priority: "Low" | "Medium" | "High";
};

function defaultScheduledAt(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T09:00`;
}

function newTask(): Task {
  return {
    id: crypto.randomUUID(),
    title: "",
    scheduledAt: defaultScheduledAt(),
    priority: "Medium",
  };
}

function PlannerPage() {
  const [tasks, setTasks] = useState<Task[]>([newTask()]);
  const [workStart, setWorkStart] = useState("08:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Set<string>>(new Set());

  function update(id: string, patch: Partial<Task>) {
    setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  async function onGenerate() {
    const invalid = new Set<string>();
    tasks.forEach((t) => {
      if (!t.title.trim() || !t.scheduledAt) invalid.add(t.id);
    });
    if (invalid.size > 0) {
      setErrors(invalid);
      toast.error("Each task needs a name and start time.");
      return;
    }
    setErrors(new Set());
    const cleaned = tasks.map((t) => ({
      title: t.title.trim(),
      scheduledAt: t.scheduledAt,
      priority: t.priority,
    }));
    setLoading(true);
    try {
      const res = await planTasks({ data: { tasks: cleaned, workStart, workEnd } });
      setSchedule(res.schedule);
      pushActivity({ tool: "planner", label: `Planned ${cleaned.length} task${cleaned.length === 1 ? "" : "s"}` });
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
        description="Add your tasks with start times. We'll build a time-blocked schedule prioritized by urgency and importance."
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
              {tasks.map((t) => {
                const hasError = errors.has(t.id);
                return (
                  <div
                    key={t.id}
                    className={cn(
                      "space-y-2 rounded-md bg-canvas p-3 ring-1",
                      hasError ? "ring-destructive/60" : "ring-border",
                    )}
                  >
                    <input
                      value={t.title}
                      onChange={(e) => update(t.id, { title: e.target.value })}
                      placeholder="Task name (required)"
                      className="w-full rounded border-0 bg-transparent px-1 py-1 text-sm focus:outline-none"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded bg-surface px-2 py-1 ring-1 ring-border">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Start
                        </span>
                        <input
                          type="datetime-local"
                          value={t.scheduledAt}
                          onChange={(e) => update(t.id, { scheduledAt: e.target.value })}
                          className="border-0 bg-transparent text-xs focus:outline-none"
                          aria-label="Start day and time"
                        />
                      </div>
                      <div className="flex overflow-hidden rounded-md ring-1 ring-border">
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
                );
              })}
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
            {loading && !schedule ? (
              <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Spinner /> Building your schedule…
                </div>
              </div>
            ) : schedule ? (
              <ScheduleTimeline schedule={schedule} />
            ) : (
              <div className="grid flex-1 place-items-center rounded-lg bg-canvas p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
                Add tasks with start times to see your time-blocked schedule here.
              </div>
            )}
          </Card>
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}
