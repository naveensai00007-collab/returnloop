import { UrgencyInfo, UrgencyLevel } from "@/types/purchase";
import { formatDate } from "./utils";

export { formatDate };

/**
 * Returns today's date formatted as YYYY-MM-DD in UTC/local date space.
 */
export function getTodayString(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD string into a safe UTC Date object to prevent timezone shifts.
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error(`Invalid date string format: ${dateStr}`);
  }
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Formats a Date object to YYYY-MM-DD in UTC.
 */
export function formatDateToISO(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates return deadline: deadline = purchaseDate + returnWindowDays
 */
export function calculateReturnDeadline(purchaseDateStr: string, returnWindowDays: number): string {
  if (!purchaseDateStr) throw new Error("Purchase date is required.");
  if (returnWindowDays < 1 || returnWindowDays > 365) {
    throw new Error("Return window must be between 1 and 365 days.");
  }

  const purchaseDate = parseDateString(purchaseDateStr);
  const deadlineDate = new Date(purchaseDate.getTime());
  deadlineDate.setUTCDate(deadlineDate.getUTCDate() + returnWindowDays);

  return formatDateToISO(deadlineDate);
}

/**
 * Computes difference in calendar days: targetDate - baseDate
 */
export function getDaysDifference(targetDateStr: string, baseDateStr: string): number {
  const target = parseDateString(targetDateStr);
  const base = parseDateString(baseDateStr);
  const diffMs = target.getTime() - base.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Evaluates urgency status and human-readable label according to specs.
 */
export function getUrgency(deadlineStr: string, status: string = "active", referenceDateStr?: string): UrgencyInfo {
  if (status === "returned") {
    return {
      level: "completed",
      label: "Returned",
      daysRemaining: 0,
      isUrgent: false,
    };
  }

  if (status === "kept") {
    return {
      level: "completed",
      label: "Kept",
      daysRemaining: 0,
      isUrgent: false,
    };
  }

  const todayStr = referenceDateStr || getTodayString();
  const daysDiff = getDaysDifference(deadlineStr, todayStr);

  if (daysDiff < 0) {
    return {
      level: "overdue",
      label: "Overdue",
      daysRemaining: daysDiff,
      isUrgent: true,
    };
  }

  if (daysDiff === 0) {
    return {
      level: "today",
      label: "Due today",
      daysRemaining: 0,
      isUrgent: true,
    };
  }

  if (daysDiff === 1) {
    return {
      level: "1day",
      label: "Due in 1 day",
      daysRemaining: 1,
      isUrgent: true,
    };
  }

  if (daysDiff === 3) {
    return {
      level: "3days",
      label: "Due in 3 days",
      daysRemaining: 3,
      isUrgent: true,
    };
  }

  if (daysDiff === 7) {
    return {
      level: "7days",
      label: "Due in 7 days",
      daysRemaining: 7,
      isUrgent: false,
    };
  }

  return {
    level: "future",
    label: `Due in ${daysDiff} days`,
    daysRemaining: daysDiff,
    isUrgent: false,
  };
}

/**
 * Calculates reminder dispatch dates for d7, d3, and d1 offsets.
 */
export function calculateReminderDates(deadlineStr: string): { d7: string; d3: string; d1: string } {
  const deadline = parseDateString(deadlineStr);

  const d7 = new Date(deadline.getTime());
  d7.setUTCDate(d7.getUTCDate() - 7);

  const d3 = new Date(deadline.getTime());
  d3.setUTCDate(d3.getUTCDate() - 3);

  const d1 = new Date(deadline.getTime());
  d1.setUTCDate(d1.getUTCDate() - 1);

  return {
    d7: formatDateToISO(d7),
    d3: formatDateToISO(d3),
    d1: formatDateToISO(d1),
  };
}
