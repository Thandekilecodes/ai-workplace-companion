// localStorage helpers — all SSR-safe.

const isBrowser = () => typeof window !== "undefined";

export function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function removeKey(key: string): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(key);
}

export function clearNamespace(prefix: string): void {
  if (!isBrowser()) return;
  const toRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(prefix)) toRemove.push(k);
  }
  toRemove.forEach((k) => window.localStorage.removeItem(k));
}

// Recent activity (cross-tool).
export type ActivityItem = {
  id: string;
  tool: "email" | "meeting" | "planner" | "research" | "chat";
  label: string;
  at: number;
};

const ACTIVITY_KEY = "nexus.activity";

export function pushActivity(item: Omit<ActivityItem, "id" | "at">) {
  const list = readJSON<ActivityItem[]>(ACTIVITY_KEY, []);
  const next: ActivityItem[] = [
    { ...item, id: crypto.randomUUID(), at: Date.now() },
    ...list,
  ].slice(0, 20);
  writeJSON(ACTIVITY_KEY, next);
}

export function readActivity(): ActivityItem[] {
  return readJSON<ActivityItem[]>(ACTIVITY_KEY, []);
}
