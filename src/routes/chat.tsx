import { createFileRoute, Link, Outlet, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deleteThread,
  listThreads,
  newThread,
  upsertThread,
  type Thread,
} from "@/lib/threads";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chatbot — Nexus AI" },
      { name: "description", content: "Conversational AI workplace assistant." },
    ],
  }),
  component: ChatLayout,
});

function ChatLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const params = useParams({ strict: false });
  const activeId = (params as { threadId?: string }).threadId;

  const [threads, setThreads] = useState<Thread[]>([]);
  const bootstrapped = useRef(false);

  // Idempotent bootstrap: only runs once, picks/creates a thread, navigates.
  useEffect(() => {
    if (bootstrapped.current) return;
    if (typeof window === "undefined") return;
    bootstrapped.current = true;

    const existing = listThreads();
    if (pathname === "/chat") {
      if (existing.length > 0) {
        navigate({ to: "/chat/$threadId", params: { threadId: existing[0].id }, replace: true });
        setThreads(existing);
      } else {
        const t = newThread();
        upsertThread(t);
        setThreads([t]);
        navigate({ to: "/chat/$threadId", params: { threadId: t.id }, replace: true });
      }
    } else {
      setThreads(existing);
    }
  }, [navigate, pathname]);

  // Refresh thread list when active thread changes (titles may update).
  useEffect(() => {
    setThreads(listThreads());
  }, [activeId]);

  // Listen for storage events from message saves in child route.
  useEffect(() => {
    function onUpdate() {
      setThreads(listThreads());
    }
    window.addEventListener("nexus:threads-updated", onUpdate);
    return () => window.removeEventListener("nexus:threads-updated", onUpdate);
  }, []);

  function onNewThread() {
    const t = newThread();
    upsertThread(t);
    setThreads(listThreads());
    navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
  }

  function onDelete(id: string) {
    deleteThread(id);
    const remaining = listThreads();
    setThreads(remaining);
    if (id === activeId) {
      if (remaining.length > 0) {
        navigate({ to: "/chat/$threadId", params: { threadId: remaining[0].id }, replace: true });
      } else {
        const t = newThread();
        upsertThread(t);
        setThreads([t]);
        navigate({ to: "/chat/$threadId", params: { threadId: t.id }, replace: true });
      }
    }
  }

  return (
    <div className="flex h-full">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex items-center justify-between p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Conversations
          </div>
          <button
            type="button"
            onClick={onNewThread}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-canvas hover:text-primary"
            aria-label="New conversation"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {threads.length === 0 ? (
            <div className="px-2 py-8 text-center text-xs text-muted-foreground">
              No conversations yet.
            </div>
          ) : (
            <ul className="space-y-0.5">
              {threads.map((t) => {
                const isActive = t.id === activeId;
                return (
                  <li key={t.id} className="group relative">
                    <Link
                      to="/chat/$threadId"
                      params={{ threadId: t.id }}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-2 pr-8 text-sm transition-colors",
                        isActive
                          ? "bg-canvas text-primary"
                          : "text-muted-foreground hover:bg-canvas/60 hover:text-foreground",
                      )}
                    >
                      <MessageSquare className="size-3.5 shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onDelete(t.id);
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
