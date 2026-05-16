"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, timeAgo } from "@/lib/utils";
import type { Message } from "@/types/database.types";

export function MessageThread({
  meId,
  partnerId,
  partnerName,
  initial,
}: {
  meId: string;
  partnerId: string;
  partnerName: string;
  initial: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  useEffect(() => {
    const unreadIds = messages
      .filter((m) => m.recipient_id === meId && !m.read_at)
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    void supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);
  }, [messages, meId, supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${meId}-${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const m = payload.new as Message;
          const involvesUs =
            (m.sender_id === meId && m.recipient_id === partnerId) ||
            (m.sender_id === partnerId && m.recipient_id === meId);
          if (!involvesUs) return;
          setMessages((prev) =>
            prev.find((x) => x.id === m.id) ? prev : [...prev, m],
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, meId, partnerId]);

  async function send() {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      sender_id: meId,
      recipient_id: partnerId,
      body: text,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setBody("");
    const { data, error } = await supabase
      .from("messages")
      .insert({ sender_id: meId, recipient_id: partnerId, body: text })
      .select()
      .single();
    setSending(false);
    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      return;
    }
    setMessages((prev) =>
      prev.map((m) => (m.id === optimistic.id ? (data as Message) : m)),
    );
  }

  return (
    <div className="flex h-[calc(100dvh-10rem)] flex-col md:h-[calc(100dvh-3rem)] animate-fade-in">
      <div className="flex items-center gap-3 border-b border-border/60 px-1 pb-4 pt-1">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/12 font-mono-num text-sm text-accent ring-1 ring-inset ring-accent/25">
          {partnerName?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted">
            Conversation
          </p>
          <p className="font-display text-base text-text-primary">
            {partnerName}
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto py-4"
      >
        {messages.length === 0 ? (
          <p className="py-16 text-center text-xs uppercase tracking-[0.18em] text-text-muted">
            No messages yet · Say hello
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === meId;
            return (
              <div
                key={m.id}
                className={cn(
                  "flex w-full animate-slide-up",
                  mine ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                    mine
                      ? "bg-accent-gradient text-[#0A0E13] shadow-glow-sm"
                      : "border border-border bg-surface/70 text-text-primary backdrop-blur-sm",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={cn(
                      "mt-1 font-mono-num text-[10px]",
                      mine ? "text-[#0A0E13]/60" : "text-text-muted",
                    )}
                  >
                    {timeAgo(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-end gap-2 border-t border-border/60 bg-background/60 py-3 backdrop-blur-sm">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message"
          rows={1}
          className="min-h-[44px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <Button
          size="icon"
          onClick={send}
          disabled={!body.trim() || sending}
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
