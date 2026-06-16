import type { UIMessage } from "ai";
import { readJSON, removeKey, writeJSON } from "./storage";

export type Thread = {
  id: string;
  title: string;
  updatedAt: number;
};

const THREADS_KEY = "nexus.threads";
const messagesKey = (id: string) => `nexus.messages.${id}`;

export function listThreads(): Thread[] {
  return readJSON<Thread[]>(THREADS_KEY, []).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function saveThreads(threads: Thread[]) {
  writeJSON(THREADS_KEY, threads);
}

export function upsertThread(thread: Thread) {
  const all = readJSON<Thread[]>(THREADS_KEY, []);
  const idx = all.findIndex((t) => t.id === thread.id);
  if (idx >= 0) all[idx] = thread;
  else all.push(thread);
  saveThreads(all);
}

export function deleteThread(id: string) {
  const all = readJSON<Thread[]>(THREADS_KEY, []).filter((t) => t.id !== id);
  saveThreads(all);
  removeKey(messagesKey(id));
}

export function loadMessages(id: string): UIMessage[] {
  return readJSON<UIMessage[]>(messagesKey(id), []);
}

export function saveMessages(id: string, messages: UIMessage[]) {
  writeJSON(messagesKey(id), messages);
}

export function newThread(): Thread {
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    updatedAt: Date.now(),
  };
}

export function deriveTitle(messages: UIMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New conversation";
  const text = firstUser.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
  if (!text) return "New conversation";
  return text.length > 48 ? text.slice(0, 48) + "…" : text;
}
