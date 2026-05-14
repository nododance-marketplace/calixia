import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MessageThread } from "@/components/message-thread";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientMessagesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: trainer } = await supabase
    .from("profiles")
    .select("id,full_name,email")
    .eq("role", "trainer")
    .maybeSingle();

  if (!trainer) {
    return (
      <EmptyState
        icon={<MessageCircle className="h-6 w-6" />}
        title="No coach assigned yet"
        description="Your trainer hasn't set things up yet."
      />
    );
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${trainer.id}),and(sender_id.eq.${trainer.id},recipient_id.eq.${user.id})`,
    )
    .order("created_at", { ascending: true });

  return (
    <MessageThread
      meId={user.id}
      partnerId={trainer.id}
      partnerName={trainer.full_name ?? trainer.email}
      initial={messages ?? []}
    />
  );
}
