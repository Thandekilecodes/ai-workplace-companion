import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, FieldLabel } from "@/components/tool-card";
import { Disclaimer, ToolHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { clearNamespace } from "@/lib/storage";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — Nexus AI" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const t = (localStorage.getItem("nexus.theme") as "light" | "dark" | null) ?? "light";
    setTheme(t);
  }, []);

  function setThemeAndApply(t: "light" | "dark") {
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    localStorage.setItem("nexus.theme", t);
  }

  function clearAll() {
    if (!confirm("Clear all stored conversations and activity? This cannot be undone.")) return;
    clearNamespace("nexus.");
    toast.success("All local data cleared");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-8 md:py-12">
      <ToolHeader title="Settings" description="Local preferences. Everything is stored in this browser." />

      <div className="space-y-6">
        <Card>
          <FieldLabel>Appearance</FieldLabel>
          <div className="mt-3 flex gap-2">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setThemeAndApply(t)}
                className={
                  "rounded-full px-4 py-1.5 text-xs font-medium capitalize ring-1 transition-colors " +
                  (theme === t
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "bg-canvas text-muted-foreground ring-border hover:text-foreground")
                }
              >
                {t}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <FieldLabel>Data</FieldLabel>
          <p className="mt-2 text-sm text-muted-foreground">
            Conversations, generated outputs, and activity history are saved in this browser only.
          </p>
          <Button variant="outline" onClick={clearAll} className="mt-4">
            Clear all stored data
          </Button>
        </Card>

        <Card>
          <FieldLabel>About</FieldLabel>
          <p className="mt-2 text-sm text-muted-foreground">
            Nexus AI is built with Lovable AI. No account required — your data lives locally.
          </p>
        </Card>
      </div>

      <Disclaimer />
    </div>
  );
}
