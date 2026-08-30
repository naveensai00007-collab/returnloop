import { Database, PurchaseStatus, PurchaseSource } from './database';

export type PurchaseRow = Database['public']['Tables']['purchases']['Row'];
export type StoreRow = Database['public']['Tables']['stores']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ReminderRow = Database['public']['Tables']['reminders']['Row'];

export interface PurchaseWithStore extends PurchaseRow {
  store?: StoreRow | null;
}

export type UrgencyLevel =
  | 'overdue'
  | 'today'
  | '1day'
  | '3days'
  | '7days'
  | 'future'
  | 'completed';

export interface UrgencyInfo {
  level: UrgencyLevel;
  label: string;
  daysRemaining: number;
  isUrgent: boolean;
}

export interface ExtractedReceiptData {
  storeName: string | null;
  purchaseDate: string | null;
  itemName: string | null;
  amount: number | null;
  currency: string | null;
  returnPolicyText: string | null;
  confidence: number;
  needsReview: boolean;
}
