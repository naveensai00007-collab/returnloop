import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Restore purchase by setting deleted_at = null
    const { data: restored, error } = await supabase
      .from("purchases")
      .update({ deleted_at: null } as never)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*, store:stores(id, name, slug, default_return_window_days)")
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: "restore_failed", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Purchase restored.",
      purchase: restored,
    });
  } catch {
    return NextResponse.json(
      { error: { code: "server_error", message: "Could not restore purchase." } },
      { status: 500 }
    );
  }
}
