import { createFileRoute } from "@tanstack/react-router";

// Placeholder leaf: parent /chat layout handles redirect to a thread.
export const Route = createFileRoute("/chat/")({
  component: () => (
    <div className="grid h-full place-items-center p-8 text-sm text-muted-foreground">
      Loading conversation…
    </div>
  ),
});
