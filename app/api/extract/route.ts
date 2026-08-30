import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ReceiptExtractSchema } from "@/lib/validation";
import { extractReceiptFromImage } from "@/lib/ai";
import { getTodayString } from "@/lib/deadlines";

export async function POST(request: NextRequest) {
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
    const validation = ReceiptExtractSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_file_type",
            message: validation.error.errors[0]?.message || "Use a JPEG, PNG, or WEBP image under 4 MB.",
          },
        },
        { status: 400 }
      );
    }

    const { imageBase64, mimeType } = validation.data;

    // Check approximate byte size of base64 payload (4MB = ~5.4MB in base64)
    if (imageBase64.length > 5.5 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: {
            code: "file_too_large",
            message: "Image must be under 4 MB.",
          },
        },
        { status: 400 }
      );
    }

    // Check daily rate limit for user (max 5 extractions per day)
    const today = getTodayString();
    const todayStart = `${today}T00:00:00.000Z`;
    const todayEnd = `${today}T23:59:59.999Z`;

    const { count: dailyCount, error: countError } = await supabase
      .from("ai_extractions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd);

    if (!countError && dailyCount !== null && dailyCount >= 5) {
      return NextResponse.json(
        {
          error: {
            code: "ai_quota_exceeded",
            message: "Daily receipt scanning limit reached (5 per day). You can add purchases manually.",
          },
        },
        { status: 429 }
      );
    }

    try {
      const extracted = await extractReceiptFromImage({
        imageBase64,
        mimeType,
      });

      // Audit log extraction attempt
      await supabase.from("ai_extractions").insert({
        user_id: user.id,
        source: "receipt_image",
        status: "needs_review",
        extracted: extracted as never,
      } as never);

      return NextResponse.json({
        success: true,
        extraction: extracted,
      });
    } catch (aiErr: unknown) {
      const errMsg = aiErr instanceof Error ? aiErr.message : "Receipt extraction failed.";

      // Log failure in extractions audit
      await supabase.from("ai_extractions").insert({
        user_id: user.id,
        source: "receipt_image",
        status: "failed",
        error: errMsg,
      } as never);

      return NextResponse.json(
        {
          error: {
            code: "ai_failed",
            message: "Could not read this receipt. You can add the purchase manually.",
          },
        },
        { status: 422 }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not process image.";
    return NextResponse.json(
      { error: { code: "server_error", message } },
      { status: 500 }
    );
  }
}
