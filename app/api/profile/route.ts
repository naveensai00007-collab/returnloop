import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SettingsUpdateSchema } from "@/lib/validation";

export async function GET() {
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

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      // If profile doesn't exist yet, return user email default
      return NextResponse.json({
        profile: {
          id: user.id,
          email: user.email || "",
          timezone: "UTC",
          reminder_enabled: true,
        },
      });
    }

    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json(
      { error: { code: "server_error", message: "Could not fetch profile." } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const validation = SettingsUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: "validation_error",
            message: validation.error.errors[0]?.message || "Invalid settings input.",
          },
        },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email || "",
          timezone: validation.data.timezone,
          reminder_enabled: validation.data.reminder_enabled,
        } as never,
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: "update_failed", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Settings saved.",
      profile: updated,
    });
  } catch {
    return NextResponse.json(
      { error: { code: "server_error", message: "Could not save settings." } },
      { status: 500 }
    );
  }
}
