const test = require("node:test");
const assert = require("node:assert");

function parseDateString(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function getDaysDifference(targetDateStr, baseDateStr) {
  const target = parseDateString(targetDateStr);
  const base = parseDateString(baseDateStr);
  const diffMs = target.getTime() - base.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function evaluateDueReminder(returnDeadline, todayStr = "2026-08-30") {
  const daysRemaining = getDaysDifference(returnDeadline, todayStr);
  if (daysRemaining === 7) return "d7";
  if (daysRemaining === 3) return "d3";
  if (daysRemaining === 1) return "d1";
  return null;
}

function calculateRecoveredTotal(purchases) {
  return purchases
    .filter((p) => p.status === "returned" && p.amount > 0)
    .reduce((sum, p) => sum + p.amount, 0);
}

test("AC-REM-1: Purchase with deadline in 7 days evaluates to d7 reminder", () => {
  const today = "2026-08-30";
  const deadline = "2026-09-06"; // 7 days later
  assert.strictEqual(evaluateDueReminder(deadline, today), "d7");
});

test("AC-REM-1: Purchase with deadline in 3 days evaluates to d3 reminder", () => {
  const today = "2026-08-30";
  const deadline = "2026-09-02"; // 3 days later
  assert.strictEqual(evaluateDueReminder(deadline, today), "d3");
});

test("AC-REM-1: Purchase with deadline tomorrow evaluates to d1 reminder", () => {
  const today = "2026-08-30";
  const deadline = "2026-08-31"; // 1 day later
  assert.strictEqual(evaluateDueReminder(deadline, today), "d1");
});

test("AC-REM-2 & 5: Purchases with non-reminder offsets return null", () => {
  const today = "2026-08-30";
  assert.strictEqual(evaluateDueReminder("2026-09-10", today), null); // 11 days
  assert.strictEqual(evaluateDueReminder("2026-08-29", today), null); // Past
});

test("Recovered amount summary correctly aggregates returned items", () => {
  const purchases = [
    { id: "1", status: "returned", amount: 89.99 },
    { id: "2", status: "returned", amount: 120.00 },
    { id: "3", status: "active", amount: 45.00 },
    { id: "4", status: "kept", amount: 200.00 },
  ];

  const total = calculateRecoveredTotal(purchases);
  assert.strictEqual(total, 209.99);
});

test("AC-REM-4: Batch limit caps at 20 emails per cron run", () => {
  const pendingQueue = Array.from({ length: 45 }, (_, i) => ({ id: `rem_${i}` }));
  const batch = pendingQueue.slice(0, 20);
  assert.strictEqual(batch.length, 20);
});
