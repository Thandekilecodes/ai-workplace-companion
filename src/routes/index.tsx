import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarClock,
  Mail,
  MessageSquare,
  ScrollText,
  Telescope,
  ArrowUpRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/tool-card";
import { Disclaimer, ToolHeader } from "@/components/app-shell";
import { readActivity, type ActivityItem } from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Nexus AI" },
      { name: "description", content: "Your AI workplace productivity dashboard." },
    ],
  }),
  component: Dashboard,
});

const TOOLS = [
  {
    to: "/email" as const,
    label: "Smart Email Generator",
    desc: "Draft tone-matched professional emails in seconds.",
    Icon: Mail,
  },
  {
    to: "/meeting" as const,
    label: "Meeting Summarizer",
    desc: "Turn rambling notes into decisions, actions, and deadlines.",
    Icon: ScrollText,
  },
  {
    to: "/planner" as const,
    label: "AI Task Planner",
    desc: "Prioritize your day with a time-blocked schedule.",
    Icon: CalendarClock,
  },
  {
    to: "/research" as const,
    label: "Research Assistant",
    desc: "Get a structured briefing on any topic.",
    Icon: Telescope,
  },
  {
    to: "/chat" as const,
    label: "AI Chatbot",
    desc: "Conversational assistant for everything workplace.",
    Icon: MessageSquare,
  },
];

const TOOL_LABEL: Record<ActivityItem["tool"], string> = {
  email: "Email",
  meeting: "Meeting",
  planner: "Planner",
  research: "Research",
  chat: "Chat",
};

function Dashboard() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  useEffect(() => {
    setActivity(readActivity().slice(0, 6));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-8 md:py-12">
      <ToolHeader
        title="Good to see you"
        description="Pick a tool to get started, or jump back into a recent generation."
      />

      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          AI Tools
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map(({ to, label, desc, Icon }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-xl bg-surface p-5 ring-1 ring-black/5 transition-all hover:ring-primary/30 dark:ring-white/5"
            >
              <div className="flex items-start justify-between">
                <div className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
              </div>
              <div className="mt-4 text-sm font-semibold">{label}</div>
              <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Activity
        </h2>
        <Card className="p-0">
          {activity.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No activity yet. Run a tool to see it appear here.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {activity.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                      {TOOL_LABEL[a.tool]}
                    </span>
                    <span className="truncate text-foreground">{a.label}</span>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {new Date(a.at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <Disclaimer />
    </div>
  );
}
