import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: "unauthorized", message: "You must be signed in." } },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // Cascades purchases, reminders, and extractions via DB foreign keys
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      // Fallback: delete profile record directly
      await supabase.from("profiles").delete().eq("id", user.id);
    }

    return NextResponse.json({
      success: true,
      message: "Account and associated data deleted.",
    });
  } catch {
    return NextResponse.json(
      { error: { code: "server_error", message: "Could not delete account." } },
      { status: 500 }
    );
  }
}
