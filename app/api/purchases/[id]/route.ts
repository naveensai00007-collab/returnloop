import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PurchaseUpdateSchema } from "@/lib/validation";
import { calculateReturnDeadline } from "@/lib/deadlines";
import { Database } from "@/types/database";
import { PurchaseRow } from "@/types/purchase";

export async function PATCH(
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
    const body = await request.json();
    const validation = PurchaseUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: "validation_error",
            message: validation.error.errors[0]?.message || "Invalid update data.",
          },
        },
        { status: 400 }
      );
    }

    // Fetch existing record to check ownership and date fields
    const { data: rawExisting, error: fetchError } = await supabase
      .from("purchases")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (fetchError || !rawExisting) {
      return NextResponse.json(
        { error: { code: "not_found", message: "Purchase not found." } },
        { status: 404 }
      );
    }

    const existing = rawExisting as unknown as PurchaseRow;
    const updatePayload: Database["public"]["Tables"]["purchases"]["Update"] = {};

    if (validation.data.customStoreName !== undefined) updatePayload.custom_store_name = validation.data.customStoreName;
    if (validation.data.storeId !== undefined) updatePayload.store_id = validation.data.storeId;
    if (validation.data.itemName !== undefined) updatePayload.item_name = validation.data.itemName;
    if (validation.data.amount !== undefined) updatePayload.amount = validation.data.amount;
    if (validation.data.currency !== undefined) updatePayload.currency = validation.data.currency;
    if (validation.data.status !== undefined) updatePayload.status = validation.data.status;
    if (validation.data.notes !== undefined) updatePayload.notes = validation.data.notes;

    // Recalculate deadline if date or window was updated
    const targetDate = validation.data.purchaseDate || existing.purchase_date;
    const targetWindow =
      validation.data.returnWindowDays !== undefined
        ? validation.data.returnWindowDays
        : existing.return_window_days;

    if (
      validation.data.purchaseDate ||
      validation.data.returnWindowDays !== undefined
    ) {
      updatePayload.purchase_date = targetDate;
      updatePayload.return_window_days = targetWindow;
      updatePayload.return_deadline = calculateReturnDeadline(
        targetDate,
        targetWindow
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("purchases")
      .update(updatePayload as never)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*, store:stores(id, name, slug, default_return_window_days)")
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: { code: "update_failed", message: updateError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ purchase: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not update purchase.";
    return NextResponse.json(
      { error: { code: "server_error", message } },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Soft delete by updating deleted_at
    const { error } = await supabase
      .from("purchases")
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: { code: "delete_failed", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Purchase deleted." });
  } catch {
    return NextResponse.json(
      { error: { code: "server_error", message: "Could not delete purchase." } },
      { status: 500 }
    );
  }
}
