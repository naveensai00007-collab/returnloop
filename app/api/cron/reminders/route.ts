import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTodayString, getDaysDifference, formatDate } from "@/lib/deadlines";
import { sendReminderEmail } from "@/lib/email";
import { ReminderType } from "@/types/database";
import { PurchaseRow, ReminderRow, ProfileRow } from "@/types/purchase";

interface PurchaseWithStoreName extends PurchaseRow {
  store?: { name: string } | null;
}

interface PendingReminderWithPurchase extends ReminderRow {
  purchase?: PurchaseWithStoreName | null;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify CRON_SECRET
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (
      cronSecret &&
      authHeader !== `Bearer ${cronSecret}` &&
      request.headers.get("x-cron-secret") !== cronSecret
    ) {
      return NextResponse.json(
        { error: { code: "unauthorized", message: "Invalid or missing cron secret." } },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const today = getTodayString();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let processedCount = 0;
    let sentCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // 2. Fetch active purchases where return_deadline >= today
    const { data: rawActivePurchases, error: fetchError } = await supabase
      .from("purchases")
      .select("id, user_id, store_id, custom_store_name, item_name, return_deadline, status, deleted_at, store:stores(name)")
      .eq("status", "active")
      .is("deleted_at", null)
      .gte("return_deadline", today);

    if (fetchError) {
      return NextResponse.json(
        { error: { code: "database_error", message: fetchError.message } },
        { status: 500 }
      );
    }

    const activePurchases = (rawActivePurchases || []) as unknown as PurchaseWithStoreName[];

    // 3. Evaluate due reminders for each purchase (d7, d3, d1)
    for (const purchase of activePurchases) {
      const daysRemaining = getDaysDifference(purchase.return_deadline, today);

      let dueReminderType: ReminderType | null = null;
      if (daysRemaining === 7) dueReminderType = "d7";
      else if (daysRemaining === 3) dueReminderType = "d3";
      else if (daysRemaining === 1) dueReminderType = "d1";

      if (!dueReminderType) {
        skippedCount++;
        continue;
      }

      // Check if profile has reminders enabled
      const { data: rawProfile } = await supabase
        .from("profiles")
        .select("email, reminder_enabled")
        .eq("id", purchase.user_id)
        .single();

      const profile = rawProfile as unknown as ProfileRow | null;

      if (!profile || profile.reminder_enabled === false) {
        skippedCount++;
        continue;
      }

      // Check if reminder was already recorded
      const { data: existingReminder } = await supabase
        .from("reminders")
        .select("id, status, attempts")
        .eq("purchase_id", purchase.id)
        .eq("reminder_type", dueReminderType)
        .maybeSingle();

      if (!existingReminder) {
        // Insert pending reminder
        await supabase.from("reminders").insert({
          user_id: purchase.user_id,
          purchase_id: purchase.id,
          reminder_date: today,
          reminder_type: dueReminderType,
          status: "pending",
          attempts: 0,
        } as never);
      }
    }

    // 4. Select max 20 pending reminders for batch processing (free tier quota control)
    const { data: rawPendingReminders, error: pendingError } = await supabase
      .from("reminders")
      .select("id, user_id, purchase_id, reminder_type, attempts, purchase:purchases(id, custom_store_name, item_name, return_deadline, status, deleted_at, store:stores(name))")
      .eq("status", "pending")
      .lt("attempts", 3)
      .order("created_at", { ascending: true })
      .limit(20);

    if (pendingError) {
      return NextResponse.json(
        { error: { code: "database_error", message: pendingError.message } },
        { status: 500 }
      );
    }

    const pendingReminders = (rawPendingReminders || []) as unknown as PendingReminderWithPurchase[];

    // 5. Dispatch reminder emails
    for (const item of pendingReminders) {
      processedCount++;

      const purchase = item.purchase;

      if (!purchase || purchase.status !== "active" || purchase.deleted_at) {
        await supabase
          .from("reminders")
          .update({ status: "skipped" } as never)
          .eq("id", item.id);
        skippedCount++;
        continue;
      }

      // Fetch user profile email
      const { data: rawUserProfile } = await supabase
        .from("profiles")
        .select("email, reminder_enabled")
        .eq("id", item.user_id)
        .single();

      const userProfile = rawUserProfile as unknown as ProfileRow | null;

      if (!userProfile || !userProfile.email || userProfile.reminder_enabled === false) {
        await supabase
          .from("reminders")
          .update({ status: "skipped" } as never)
          .eq("id", item.id);
        skippedCount++;
        continue;
      }

      const storeName = purchase.custom_store_name || purchase.store?.name || "Order";
      const daysRemaining = getDaysDifference(purchase.return_deadline, today);

      const emailResult = await sendReminderEmail({
        toEmail: userProfile.email,
        storeName,
        itemName: purchase.item_name,
        returnDeadline: formatDate(purchase.return_deadline),
        daysRemaining,
        appUrl,
      });

      if (emailResult.success) {
        sentCount++;
        await supabase
          .from("reminders")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            provider_message_id: emailResult.messageId || null,
          } as never)
          .eq("id", item.id);
      } else {
        failedCount++;
        const nextAttempts = item.attempts + 1;
        await supabase
          .from("reminders")
          .update({
            attempts: nextAttempts,
            status: nextAttempts >= 3 ? "failed" : "pending",
            error: emailResult.error || "Email delivery failed",
          } as never)
          .eq("id", item.id);
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      sent: sentCount,
      failed: failedCount,
      skipped: skippedCount,
      batchLimit: 20,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Cron execution failed.";
    return NextResponse.json(
      { error: { code: "cron_error", message } },
      { status: 500 }
    );
  }
}

// Allow GET for Vercel Cron invocation
export async function GET(request: NextRequest) {
  return POST(request);
}
