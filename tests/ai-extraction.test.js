const test = require("node:test");
const assert = require("node:assert");

function validateReceiptFile(file) {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSizeBytes = 4 * 1024 * 1024; // 4 MB

  if (!allowedMimeTypes.includes(file.type)) {
    return { isValid: false, error: "Use a JPEG, PNG, or WEBP image under 4 MB." };
  }

  if (file.size > maxSizeBytes) {
    return { isValid: false, error: "Image must be under 4 MB." };
  }

  return { isValid: true };
}

function parseAiOutput(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("AI failed: Invalid output");
  }

  return {
    storeName: typeof raw.storeName === "string" && raw.storeName.trim() ? raw.storeName.trim() : null,
    purchaseDate: typeof raw.purchaseDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.purchaseDate) ? raw.purchaseDate : null,
    itemName: typeof raw.itemName === "string" && raw.itemName.trim() ? raw.itemName.trim() : null,
    amount: typeof raw.amount === "number" && raw.amount > 0 ? raw.amount : null,
    currency: "USD",
    confidence: typeof raw.confidence === "number" && raw.confidence >= 0 && raw.confidence <= 1 ? raw.confidence : 0.5,
    needsReview: true,
  };
}

function checkDailyRateLimit(extractionCount) {
  const MAX_DAILY = 5;
  return extractionCount < MAX_DAILY;
}

test("AC-AI-5: File type validation rejects PDF and GIF files", () => {
  assert.strictEqual(validateReceiptFile({ type: "application/pdf", size: 1024 }).isValid, false);
  assert.strictEqual(validateReceiptFile({ type: "image/gif", size: 1024 }).isValid, false);
  assert.strictEqual(validateReceiptFile({ type: "image/jpeg", size: 1024 }).isValid, true);
  assert.strictEqual(validateReceiptFile({ type: "image/png", size: 1024 }).isValid, true);
  assert.strictEqual(validateReceiptFile({ type: "image/webp", size: 1024 }).isValid, true);
});

test("AC-AI-5: File size validation rejects files over 4 MB", () => {
  const over4MB = 4.5 * 1024 * 1024;
  const under4MB = 2.5 * 1024 * 1024;
  assert.strictEqual(validateReceiptFile({ type: "image/jpeg", size: over4MB }).isValid, false);
  assert.strictEqual(validateReceiptFile({ type: "image/jpeg", size: under4MB }).isValid, true);
});

test("AC-AI-2: AI output parser extracts structured fields with mandatory human review", () => {
  const mockAiOutput = {
    storeName: "Apple",
    purchaseDate: "2026-08-25",
    itemName: "iPhone Case",
    amount: 49.00,
    confidence: 0.95,
  };

  const parsed = parseAiOutput(mockAiOutput);
  assert.strictEqual(parsed.storeName, "Apple");
  assert.strictEqual(parsed.purchaseDate, "2026-08-25");
  assert.strictEqual(parsed.itemName, "iPhone Case");
  assert.strictEqual(parsed.amount, 49.00);
  assert.strictEqual(parsed.needsReview, true);
});

test("AC-AI-4: Daily rate limit caps at 5 extractions per user per day", () => {
  assert.strictEqual(checkDailyRateLimit(0), true);
  assert.strictEqual(checkDailyRateLimit(4), true);
  assert.strictEqual(checkDailyRateLimit(5), false);
  assert.strictEqual(checkDailyRateLimit(10), false);
});
