import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PurchaseCreateSchema } from "@/lib/validation";
import { calculateReturnDeadline } from "@/lib/deadlines";
import { Database } from "@/types/database";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    let query = supabase
      .from("purchases")
      .select("*, store:stores(id, name, slug, default_return_window_days, policy_notes)")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("return_deadline", { ascending: true });

    if (statusFilter && ["active", "returned", "kept"].includes(statusFilter)) {
      query = query.eq("status", statusFilter as "active" | "returned" | "kept");
    }

    const { data: purchases, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: { code: "database_error", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ purchases: purchases || [] });
  } catch {
    return NextResponse.json(
      { error: { code: "server_error", message: "Could not load purchases." } },
      { status: 500 }
    );
  }
}

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
    const validation = PurchaseCreateSchema.safeParse(body);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const path = err.path.join(".");
        fieldErrors[path] = err.message;
      });

      return NextResponse.json(
        {
          error: {
            code: "validation_error",
            message: validation.error.errors[0]?.message || "Invalid purchase details.",
            fields: fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const {
      storeId,
      customStoreName,
      itemName,
      amount,
      currency,
      purchaseDate,
      returnWindowDays,
      source,
      receiptPath,
      notes,
    } = validation.data;

    // Calculate deadline using pure calendar date arithmetic
    const returnDeadline = calculateReturnDeadline(purchaseDate, returnWindowDays);

    const insertPayload: Database["public"]["Tables"]["purchases"]["Insert"] = {
      user_id: user.id,
      store_id: storeId || null,
      custom_store_name: customStoreName || null,
      item_name: itemName || null,
      amount: amount || null,
      currency: currency || "USD",
      purchase_date: purchaseDate,
      return_window_days: returnWindowDays,
      return_deadline: returnDeadline,
      status: "active",
      source: source || "manual",
      receipt_path: receiptPath || null,
      notes: notes || null,
    };

    const { data: purchase, error } = await supabase
      .from("purchases")
      .insert(insertPayload as never)
      .select("*, store:stores(id, name, slug, default_return_window_days)")
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: "insert_failed", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ purchase }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not create purchase.";
    return NextResponse.json(
      { error: { code: "server_error", message } },
      { status: 500 }
    );
  }
}
