import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Coffee, CircleDashed, Calendar } from "lucide-react";
import type { Schedule } from "@/lib/ai.functions";

type Block = Schedule["blocks"][number];

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
}

function priorityClasses(p?: Block["priority"]) {
  switch (p) {
    case "High":
      return "bg-primary/10 text-primary ring-1 ring-primary/20";
    case "Medium":
      return "bg-secondary text-secondary-foreground ring-1 ring-border";
    case "Low":
      return "bg-muted text-muted-foreground ring-1 ring-border";
    default:
      return "";
  }
}

function formatDay(iso: string): string {
  // iso expected YYYY-MM-DD; build local date to avoid TZ shifts
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TypeDot({ type }: { type: Block["type"] }) {
  if (type === "break") {
    return (
      <div className="grid size-7 place-items-center rounded-full bg-muted text-muted-foreground ring-4 ring-surface">
        <Coffee className="size-3.5" />
      </div>
    );
  }
  if (type === "buffer") {
    return (
      <div className="grid size-7 place-items-center rounded-full bg-canvas text-muted-foreground ring-1 ring-border ring-offset-2 ring-offset-surface">
        <CircleDashed className="size-3.5" />
      </div>
    );
  }
  return (
    <div className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground ring-4 ring-surface">
      <div className="size-2 rounded-full bg-primary-foreground" />
    </div>
  );
}

function BlockList({ blocks }: { blocks: Block[] }) {
  return (
    <ol className="relative space-y-3">
      <div aria-hidden className="absolute left-[13px] top-3 bottom-3 w-px bg-border" />
      {blocks.map((b, i) => {
        const duration = minutesBetween(b.startTime, b.endTime);
        return (
          <li key={i} className="relative flex gap-4">
            <div className="relative z-10 flex flex-col items-center pt-3">
              <TypeDot type={b.type} />
            </div>
            <div className="flex-1 rounded-lg bg-canvas p-4 ring-1 ring-border transition hover:ring-primary/30">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 font-mono text-xs text-muted-foreground">
                    <span className="text-sm font-semibold text-foreground">{b.startTime}</span>
                    <span>→</span>
                    <span>{b.endTime}</span>
                    <span className="text-[10px] uppercase tracking-wider">· {duration} min</span>
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-foreground">{b.title}</h3>
                  {b.notes ? (
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{b.notes}</p>
                  ) : null}
                </div>
                {b.priority && b.type === "task" ? (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      priorityClasses(b.priority),
                    )}
                  >
                    {b.priority}
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {b.type}
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function ScheduleTimeline({ schedule }: { schedule: Schedule }) {
  const [showRationale, setShowRationale] = useState(false);
  const { blocks, rationale } = schedule;

  const groups = useMemo(() => {
    const map = new Map<string, Block[]>();
    for (const b of blocks) {
      const key = b.day || "Schedule";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [blocks]);

  const totalTasks = blocks.filter((b) => b.type === "task").length;
  const totalMinutes = blocks.reduce((s, b) => s + minutesBetween(b.startTime, b.endTime), 0);
  const totalLabel = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-muted-foreground">
          {totalTasks} task{totalTasks === 1 ? "" : "s"} · {groups.length} day{groups.length === 1 ? "" : "s"} · {totalLabel}
        </span>
      </div>

      {groups.map(([day, dayBlocks]) => {
        const dayTasks = dayBlocks.filter((b) => b.type === "task").length;
        const dayMins = dayBlocks.reduce((s, b) => s + minutesBetween(b.startTime, b.endTime), 0);
        return (
          <section key={day} className="space-y-3">
            <header className="flex items-center justify-between gap-3 border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="size-3.5 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">
                  {day === "Schedule" ? "Schedule" : formatDay(day)}
                </h2>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {dayTasks} task{dayTasks === 1 ? "" : "s"} · {Math.floor(dayMins / 60)}h {dayMins % 60}m
              </span>
            </header>
            <BlockList blocks={dayBlocks} />
          </section>
        );
      })}

      {rationale ? (
        <div className="rounded-lg bg-canvas ring-1 ring-border">
          <button
            type="button"
            onClick={() => setShowRationale((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Why this order
            <ChevronDown
              className={cn("size-3.5 transition-transform", showRationale && "rotate-180")}
            />
          </button>
          {showRationale ? (
            <p className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              {rationale}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
