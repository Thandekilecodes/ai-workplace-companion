import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Disclaimer } from "@/components/app-shell";
import {
  deriveTitle,
  loadMessages,
  saveMessages,
  upsertThread,
} from "@/lib/threads";
import { pushActivity } from "@/lib/storage";

export const Route = createFileRoute("/chat/$threadId")({
  component: ChatThreadPage,
});

function ChatThreadPage() {
  const { threadId } = Route.useParams();
  const initialMessages = useMemo(() => loadMessages(threadId), [threadId]);

  return <ChatWindow key={threadId} threadId={threadId} initialMessages={initialMessages} />;
}

function ChatWindow({
  threadId,
  initialMessages,
}: {
  threadId: string;
  initialMessages: ReturnType<typeof loadMessages>;
}) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (e) => toast.error(e.message || "Chat error"),
  });

  // Persist messages and update thread title.
  useEffect(() => {
    if (status === "streaming" || status === "submitted") return;
    if (messages.length === 0) return;
    saveMessages(threadId, messages);
    const title = deriveTitle(messages);
    upsertThread({ id: threadId, title, updatedAt: Date.now() });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("nexus:threads-updated"));
    }
  }, [messages, status, threadId]);

  // Focus textarea on mount + after streaming completes + on thread switch.
  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId]);
  useEffect(() => {
    if (status === "ready") inputRef.current?.focus();
  }, [status]);

  function handleSubmit() {
    const text = input.trim();
    if (!text) return;
    if (messages.length === 0) {
      pushActivity({ tool: "chat", label: text.slice(0, 50) });
    }
    sendMessage({ text });
    setInput("");
  }

  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 min-h-0">
        <Conversation className="h-full">
          <ConversationContent className="mx-auto max-w-3xl px-4 py-6">
            {messages.length === 0 ? (
              <div className="grid h-full min-h-[60vh] place-items-center text-center">
                <div className="max-w-md">
                  <h2 className="text-lg font-semibold tracking-tight">
                    How can I help with your workday?
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ask about emails, scheduling, research, or workplace productivity.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const text = m.parts
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join("");
                return (
                  <Message key={m.id} from={m.role}>
                    <MessageContent>
                      {m.role === "assistant" ? (
                        <MessageResponse>{text}</MessageResponse>
                      ) : (
                        <div className="whitespace-pre-wrap">{text}</div>
                      )}
                    </MessageContent>
                  </Message>
                );
              })
            )}
            {status === "submitted" ? (
              <Message from="assistant">
                <MessageContent>
                  <Shimmer>Thinking…</Shimmer>
                </MessageContent>
              </Message>
            ) : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      <div className="border-t border-border bg-canvas px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <PromptInput
            onSubmit={() => {
              handleSubmit();
            }}
          >
            <PromptInputBody>
              <PromptInputTextarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Nexus anything about your workday…"
                disabled={busy}
              />
            </PromptInputBody>
            <div className="flex items-center justify-end gap-2 px-2 pb-2">
              <PromptInputSubmit status={status} disabled={!input.trim() || busy} />
            </div>
          </PromptInput>
          <p className="mt-2 text-center text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            AI-generated content may contain inaccuracies. Review before professional use.
          </p>
        </div>
      </div>
    </div>
  );
}
