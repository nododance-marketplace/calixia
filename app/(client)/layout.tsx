import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/client/bottom-nav";
import { ClientHeader } from "@/components/client/client-header";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role === "trainer") redirect("/admin");

  const { count: unread } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <ClientHeader />
      <main className="flex-1 px-4 py-4">{children}</main>
      <BottomNav unreadCount={unread ?? 0} />
    </div>
  );
}
