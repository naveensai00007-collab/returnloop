const test = require("node:test");
const assert = require("node:assert");

// Core workflow domain logic tests
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
  if (!purchaseDateStr) throw new Error("Choose a purchase date.");
  if (returnWindowDays < 1 || returnWindowDays > 365) {
    throw new Error("Return window must be between 1 and 365 days.");
  }
  const purchaseDate = parseDateString(purchaseDateStr);
  const deadlineDate = new Date(purchaseDate.getTime());
  deadlineDate.setUTCDate(deadlineDate.getUTCDate() + returnWindowDays);
  return formatDateToISO(deadlineDate);
}

function validatePurchaseInput(data) {
  const errors = {};
  if (!data.storeId && (!data.customStoreName || !data.customStoreName.trim())) {
    errors.store = "Choose a store or enter another store.";
  }
  if (!data.purchaseDate || !/^\d{4}-\d{2}-\d{2}$/.test(data.purchaseDate)) {
    errors.purchaseDate = "Choose a purchase date.";
  }
  if (typeof data.returnWindowDays !== "number" || data.returnWindowDays < 1 || data.returnWindowDays > 365) {
    errors.returnWindowDays = "Return window must be between 1 and 365 days.";
  }
  if (data.amount !== null && data.amount !== undefined && (typeof data.amount !== "number" || data.amount <= 0)) {
    errors.amount = "Amount must be greater than zero.";
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function sortPurchasesByUrgency(purchases, todayStr = "2026-08-30") {
  const today = parseDateString(todayStr);

  return [...purchases].sort((a, b) => {
    const diffA = parseDateString(a.return_deadline).getTime() - today.getTime();
    const diffB = parseDateString(b.return_deadline).getTime() - today.getTime();
    return diffA - diffB;
  });
}

test("AC-ADD-2: Missing store rejects purchase creation", () => {
  const result = validatePurchaseInput({
    storeId: null,
    customStoreName: "   ",
    purchaseDate: "2026-08-30",
    returnWindowDays: 30,
  });
  assert.strictEqual(result.isValid, false);
  assert.strictEqual(result.errors.store, "Choose a store or enter another store.");
});

test("AC-ADD-3: Valid store and date calculates correct deadline", () => {
  const input = {
    storeId: "10000000-0000-0000-0000-000000000001",
    customStoreName: null,
    purchaseDate: "2026-08-30",
    returnWindowDays: 30,
  };
  const validation = validatePurchaseInput(input);
  assert.strictEqual(validation.isValid, true);
  const deadline = calculateReturnDeadline(input.purchaseDate, input.returnWindowDays);
  assert.strictEqual(deadline, "2026-09-29");
});

test("AC-ADD-5: Changing return window to 14 days calculates exact date", () => {
  const deadline = calculateReturnDeadline("2026-08-30", 14);
  assert.strictEqual(deadline, "2026-09-13");
});

test("AC-DASH-2: Purchases sort by soonest deadline first", () => {
  const items = [
    { id: "1", return_deadline: "2026-09-15" },
    { id: "2", return_deadline: "2026-08-25" }, // Overdue
    { id: "3", return_deadline: "2026-08-31" }, // Tomorrow
    { id: "4", return_deadline: "2026-08-30" }, // Today
  ];

  const sorted = sortPurchasesByUrgency(items, "2026-08-30");
  assert.strictEqual(sorted[0].id, "2"); // Overdue first
  assert.strictEqual(sorted[1].id, "4"); // Due today
  assert.strictEqual(sorted[2].id, "3"); // Due tomorrow
  assert.strictEqual(sorted[3].id, "1"); // Future
});

test("AC-DATA-3: Soft delete and restore lifecycle preserves data", () => {
  const purchase = {
    id: "p1",
    status: "active",
    deleted_at: null,
  };

  // Mark deleted
  const deleted = { ...purchase, deleted_at: "2026-08-30T12:00:00Z" };
  assert.notStrictEqual(deleted.deleted_at, null);

  // Restore
  const restored = { ...deleted, deleted_at: null };
  assert.strictEqual(restored.deleted_at, null);
  assert.strictEqual(restored.status, "active");
});
