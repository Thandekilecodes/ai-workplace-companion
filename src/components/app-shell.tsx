import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarClock,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Moon,
  ScrollText,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Sun,
  Telescope,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/email", label: "Email Generator", Icon: Mail },
  { to: "/meeting", label: "Meeting Summarizer", Icon: ScrollText },
  { to: "/planner", label: "Task Planner", Icon: CalendarClock },
  { to: "/research", label: "Research Assistant", Icon: Telescope },
  { to: "/chat", label: "AI Chatbot", Icon: MessageSquare },
] as const;

const BREADCRUMBS: Record<string, string> = {
  "/": "Dashboard",
  "/email": "Email Generator",
  "/meeting": "Meeting Summarizer",
  "/planner": "Task Planner",
  "/research": "Research Assistant",
  "/chat": "AI Chatbot",
  "/settings": "Settings",
};

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("nexus.theme")) as
      | "light"
      | "dark"
      | null;
    const next: "light" | "dark" =
      saved ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("nexus.theme", next);
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle theme"
      className="size-8 rounded-full"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const crumb =
    BREADCRUMBS[pathname] ??
    (pathname.startsWith("/chat") ? "AI Chatbot" : "Workspace");

  return (
    <div className="flex h-screen w-full bg-canvas text-foreground selection:bg-primary/15 selection:text-primary">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar p-4">
        <Link to="/" className="mb-8 flex items-center gap-2.5 px-2">
          <div className="grid size-7 place-items-center rounded-md bg-primary">
            <Sparkles className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold uppercase tracking-[0.14em]">
            Nexus AI
          </span>
        </Link>

        <nav className="flex-1 space-y-0.5">
          {NAV.map(({ to, label, Icon }) => {
            const active =
              to === "/"
                ? pathname === "/"
                : pathname === to || pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border pt-3">
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
              pathname === "/settings"
                ? "bg-sidebar-accent text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <SettingsIcon className="size-4" />
            Settings
          </Link>
        </div>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-canvas px-6 md:px-8">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-muted-foreground">Workspace</span>
            <span className="text-border">/</span>
            <span className="font-medium text-foreground">{crumb}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Quick find…"
                className="h-8 w-56 rounded-md border border-border bg-surface pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <ThemeToggle />
            <div
              className="ml-1 grid size-8 place-items-center rounded-full bg-accent text-[11px] font-semibold text-accent-foreground ring-1 ring-border"
              aria-label="User"
            >
              YOU
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}

export function ToolHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
      {description ? (
        <p className="mt-1 max-w-[60ch] text-sm text-muted-foreground text-pretty">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Disclaimer() {
  return (
    <footer className="mt-12 border-t border-border pt-4">
      <p className="text-center text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Content generated by AI may contain inaccuracies. Review before professional use.
      </p>
    </footer>
  );
}
