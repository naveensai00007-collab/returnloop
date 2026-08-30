import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { StoreSearchSchema } from "@/lib/validation";
import { StoreRow } from "@/types/purchase";

interface StoreItem {
  id: string;
  name: string;
  slug: string;
  defaultReturnWindowDays: number;
  policyNotes: string | null;
  verified: boolean;
}

// Fallback seed stores if database has not been seeded yet
const DEFAULT_STORES: StoreItem[] = [
  { id: "10000000-0000-0000-0000-000000000001", name: "Amazon", slug: "amazon", defaultReturnWindowDays: 30, policyNotes: "Common estimate. Many categories differ.", verified: false },
  { id: "10000000-0000-0000-0000-000000000002", name: "Target", slug: "target", defaultReturnWindowDays: 90, policyNotes: "Common estimate. Many categories differ.", verified: false },
  { id: "10000000-0000-0000-0000-000000000003", name: "Walmart", slug: "walmart", defaultReturnWindowDays: 90, policyNotes: "Common estimate. Many categories differ.", verified: false },
  { id: "10000000-0000-0000-0000-000000000004", name: "Best Buy", slug: "best-buy", defaultReturnWindowDays: 15, policyNotes: "Common estimate. Electronics may differ.", verified: false },
  { id: "10000000-0000-0000-0000-000000000005", name: "Apple", slug: "apple", defaultReturnWindowDays: 14, policyNotes: "Common estimate.", verified: false },
  { id: "10000000-0000-0000-0000-000000000006", name: "Zara", slug: "zara", defaultReturnWindowDays: 30, policyNotes: "Common estimate.", verified: false },
  { id: "10000000-0000-0000-0000-000000000007", name: "Nike", slug: "nike", defaultReturnWindowDays: 30, policyNotes: "Common estimate.", verified: false },
  { id: "10000000-0000-0000-0000-000000000008", name: "Adidas", slug: "adidas", defaultReturnWindowDays: 30, policyNotes: "Common estimate.", verified: false },
  { id: "10000000-0000-0000-0000-000000000009", name: "H&M", slug: "hm", defaultReturnWindowDays: 30, policyNotes: "Common estimate.", verified: false },
  { id: "10000000-0000-0000-0000-000000000010", name: "IKEA", slug: "ikea", defaultReturnWindowDays: 365, policyNotes: "Common estimate. Conditions apply.", verified: false },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParam = searchParams.get("q") || "";
    const parsed = StoreSearchSchema.safeParse({ q: queryParam });
    const query = parsed.success ? parsed.data.q.toLowerCase().trim() : "";

    let stores: StoreItem[] = DEFAULT_STORES;

    try {
      const supabase = createServerSupabaseClient();
      let dbQuery = supabase
        .from("stores")
        .select("id, name, slug, default_return_window_days, policy_notes, verified")
        .limit(20);

      if (query) {
        dbQuery = dbQuery.ilike("name", `%${query}%`);
      }

      const { data, error } = await dbQuery;

      if (!error && data && data.length > 0) {
        const rows = data as unknown as StoreRow[];
        stores = rows.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          defaultReturnWindowDays: s.default_return_window_days || 30,
          policyNotes: s.policy_notes,
          verified: s.verified,
        }));
      } else if (query) {
        stores = DEFAULT_STORES.filter((s) =>
          s.name.toLowerCase().includes(query)
        );
      }
    } catch {
      // If database is offline or not connected, filter in-memory catalog
      if (query) {
        stores = DEFAULT_STORES.filter((s) =>
          s.name.toLowerCase().includes(query)
        );
      }
    }

    return NextResponse.json({ stores: stores.slice(0, 20) });
  } catch {
    return NextResponse.json(
      { error: { code: "server_error", message: "Could not fetch stores." } },
      { status: 500 }
    );
  }
}
