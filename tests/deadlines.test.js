const test = require("node:test");
const assert = require("node:assert");

// Pure math unit testing
function parseDateString(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateToISO(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateReturnDeadline(purchaseDateStr, returnWindowDays) {
  if (!purchaseDateStr) throw new Error("Purchase date is required.");
  if (returnWindowDays < 1 || returnWindowDays > 365) {
    throw new Error("Return window must be between 1 and 365 days.");
  }
  const purchaseDate = parseDateString(purchaseDateStr);
  const deadlineDate = new Date(purchaseDate.getTime());
  deadlineDate.setUTCDate(deadlineDate.getUTCDate() + returnWindowDays);
  return formatDateToISO(deadlineDate);
}

function getDaysDifference(targetDateStr, baseDateStr) {
  const target = parseDateString(targetDateStr);
  const base = parseDateString(baseDateStr);
  const diffMs = target.getTime() - base.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function getUrgency(deadlineStr, status = "active", referenceDateStr) {
  if (status === "returned") {
    return { level: "completed", label: "Returned", daysRemaining: 0, isUrgent: false };
  }
  if (status === "kept") {
    return { level: "completed", label: "Kept", daysRemaining: 0, isUrgent: false };
  }
  const todayStr = referenceDateStr || "2026-08-30";
  const daysDiff = getDaysDifference(deadlineStr, todayStr);

  if (daysDiff < 0) return { level: "overdue", label: "Overdue", daysRemaining: daysDiff, isUrgent: true };
  if (daysDiff === 0) return { level: "today", label: "Due today", daysRemaining: 0, isUrgent: true };
  if (daysDiff === 1) return { level: "1day", label: "Due in 1 day", daysRemaining: 1, isUrgent: true };
  if (daysDiff === 3) return { level: "3days", label: "Due in 3 days", daysRemaining: 3, isUrgent: true };
  if (daysDiff === 7) return { level: "7days", label: "Due in 7 days", daysRemaining: 7, isUrgent: false };
  return { level: "future", label: `Due in ${daysDiff} days`, daysRemaining: daysDiff, isUrgent: false };
}

function calculateReminderDates(deadlineStr) {
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

test("Deadline calculation with 30-day window", () => {
  const result = calculateReturnDeadline("2026-08-01", 30);
  assert.strictEqual(result, "2026-08-31");
});

test("Deadline calculation crossing month boundary", () => {
  const result = calculateReturnDeadline("2026-08-25", 14);
  assert.strictEqual(result, "2026-09-08");
});

test("Deadline calculation crossing year boundary", () => {
  const result = calculateReturnDeadline("2026-12-20", 30);
  assert.strictEqual(result, "2027-01-19");
});

test("Deadline calculation during leap year (2028-02-20 + 10 days)", () => {
  const result = calculateReturnDeadline("2028-02-20", 10);
  assert.strictEqual(result, "2028-03-01");
});

test("Deadline calculation 1-day minimum and 365-day maximum", () => {
  assert.strictEqual(calculateReturnDeadline("2026-01-01", 1), "2026-01-02");
  assert.strictEqual(calculateReturnDeadline("2026-01-01", 365), "2027-01-01");
});

test("Urgency evaluation: Overdue, Due today, 1 day, 3 days, 7 days, and future", () => {
  const today = "2026-08-30";
  assert.strictEqual(getUrgency("2026-08-28", "active", today).label, "Overdue");
  assert.strictEqual(getUrgency("2026-08-30", "active", today).label, "Due today");
  assert.strictEqual(getUrgency("2026-08-31", "active", today).label, "Due in 1 day");
  assert.strictEqual(getUrgency("2026-09-02", "active", today).label, "Due in 3 days");
  assert.strictEqual(getUrgency("2026-09-06", "active", today).label, "Due in 7 days");
  assert.strictEqual(getUrgency("2026-09-20", "active", today).label, "Due in 21 days");
});

test("Urgency evaluation: Returned and Kept items", () => {
  assert.strictEqual(getUrgency("2026-08-10", "returned", "2026-08-30").label, "Returned");
  assert.strictEqual(getUrgency("2026-08-10", "kept", "2026-08-30").label, "Kept");
});

test("Reminder offsets calculation (d7, d3, d1)", () => {
  const offsets = calculateReminderDates("2026-09-10");
  assert.strictEqual(offsets.d7, "2026-09-03");
  assert.strictEqual(offsets.d3, "2026-09-07");
  assert.strictEqual(offsets.d1, "2026-09-09");
});
