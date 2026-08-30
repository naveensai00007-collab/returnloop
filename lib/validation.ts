import { z } from "zod";

export const MagicLinkSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export const StoreSearchSchema = z.object({
  q: z.string().optional().default(""),
});

export const PurchaseCreateSchema = z.object({
  storeId: z.string().uuid("Invalid store identifier.").nullable().optional(),
  customStoreName: z.string().trim().max(100, "Store name too long.").nullable().optional(),
  itemName: z.string().trim().max(150, "Item name too long.").nullable().optional(),
  amount: z
    .number({ invalid_type_error: "Amount must be a number." })
    .positive("Amount must be greater than zero.")
    .max(1000000, "Amount exceeds limit.")
    .nullable()
    .optional(),
  currency: z.string().length(3, "Currency code must be 3 letters.").default("USD"),
  purchaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid purchase date (YYYY-MM-DD)."),
  returnWindowDays: z
    .number({ invalid_type_error: "Return window is required." })
    .int("Return window must be an integer.")
    .min(1, "Return window must be at least 1 day.")
    .max(365, "Return window cannot exceed 365 days."),
  source: z.enum(["manual", "receipt", "import"]).default("manual"),
  receiptPath: z.string().nullable().optional(),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters.").nullable().optional(),
}).refine((data) => data.storeId || (data.customStoreName && data.customStoreName.trim().length > 0), {
  message: "Choose a store or enter another store.",
  path: ["customStoreName"],
});

export const PurchaseUpdateSchema = z.object({
  storeId: z.string().uuid().nullable().optional(),
  customStoreName: z.string().trim().max(100).nullable().optional(),
  itemName: z.string().trim().max(150).nullable().optional(),
  amount: z.number().positive().max(1000000).nullable().optional(),
  currency: z.string().length(3).optional(),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  returnWindowDays: z.number().int().min(1).max(365).optional(),
  status: z.enum(["active", "returned", "kept"]).optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const ReceiptExtractSchema = z.object({
  imageBase64: z.string().min(1, "Image payload is required."),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"], {
    errorMap: () => ({ message: "Use a JPEG, PNG, or WEBP image under 4 MB." }),
  }),
});

export const ExtractedFieldsSchema = z.object({
  storeName: z.string().nullable(),
  purchaseDate: z.string().nullable(),
  itemName: z.string().nullable(),
  amount: z.number().positive().nullable(),
  currency: z.string().length(3).nullable().default("USD"),
  returnPolicyText: z.string().nullable(),
  confidence: z.number().min(0).max(1).default(0.5),
});

export const SettingsUpdateSchema = z.object({
  timezone: z.string().min(1, "Timezone is required.").default("UTC"),
  reminder_enabled: z.boolean().default(true),
});
