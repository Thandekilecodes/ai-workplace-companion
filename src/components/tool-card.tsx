import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl bg-surface p-5 ring-1 ring-black/5 dark:ring-white/5",
        className,
      )}
      {...props}
    />
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </label>
  );
}
