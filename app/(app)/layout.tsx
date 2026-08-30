import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/navbar";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userEmail: string | null = null;

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    userEmail = user.email || null;
  } catch {
    // If Supabase env vars not configured in dev, allow shell rendering
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar userEmail={userEmail} />
      <main className="flex-1 pb-16">{children}</main>
    </div>
  );
}
