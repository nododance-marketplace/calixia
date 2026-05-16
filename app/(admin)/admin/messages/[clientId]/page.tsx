import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MessageThread } from "@/components/message-thread";

export const dynamic = "force-dynamic";

export default async function AdminThreadPage({
  params,
}: {
  params: { clientId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: client } = await supabase
    .from("profiles")
    .select("id,full_name,email")
    .eq("id", params.clientId)
    .eq("role", "client")
    .maybeSingle();
  if (!client) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${client.id}),and(sender_id.eq.${client.id},recipient_id.eq.${user.id})`,
    )
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-3 pb-2 animate-fade-in">
      <div className="flex items-center gap-3 pt-1">
        <Link
          href="/admin/messages"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/60 text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <p className="text-[10px] uppercase tracking-[0.22em] text-text-muted">
          Conversation
        </p>
      </div>
      <MessageThread
        meId={user.id}
        partnerId={client.id}
        partnerName={client.full_name ?? client.email}
        initial={messages ?? []}
      />
    </div>
  );
}
