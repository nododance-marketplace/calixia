import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SideNav, AdminMobileNav } from "@/components/admin/side-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "trainer") redirect("/today");

  const { count: unread } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  return (
    <div className="flex min-h-dvh">
      <SideNav unreadCount={unread ?? 0} />
      <div className="flex min-h-dvh flex-1 flex-col">
        <main className="flex-1 px-4 py-4 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
        <AdminMobileNav unreadCount={unread ?? 0} />
      </div>
    </div>
  );
}
