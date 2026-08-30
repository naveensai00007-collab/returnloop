import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Ensure profile exists
        const profileInsert: Database["public"]["Tables"]["profiles"]["Insert"] = {
          id: user.id,
          email: user.email || "",
        };

        await supabase
          .from("profiles")
          .upsert(profileInsert as never, { onConflict: "id" });

        // If next is default /dashboard, check if first-time user
        if (next === "/dashboard") {
          const { count } = await supabase
            .from("purchases")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .is("deleted_at", null);

          if (count === 0) {
            return NextResponse.redirect(new URL("/add", request.url));
          }
        }
      }

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Return to login with error if auth failed
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", "auth_callback_failed");
  return NextResponse.redirect(loginUrl);
}
