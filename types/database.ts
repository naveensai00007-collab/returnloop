export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PurchaseStatus = 'active' | 'returned' | 'kept';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'skipped';
export type ReminderType = 'd7' | 'd3' | 'd1';
export type PurchaseSource = 'manual' | 'receipt' | 'import';
export type ExtractionStatus = 'succeeded' | 'failed' | 'needs_review';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          timezone: string;
          reminder_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          timezone?: string;
          reminder_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          timezone?: string;
          reminder_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      stores: {
        Row: {
          id: string;
          name: string;
          slug: string;
          default_return_window_days: number | null;
          policy_notes: string | null;
          policy_source: string;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          default_return_window_days?: number | null;
          policy_notes?: string | null;
          policy_source?: string;
          verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          default_return_window_days?: number | null;
          policy_notes?: string | null;
          policy_source?: string;
          verified?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          store_id: string | null;
          custom_store_name: string | null;
          item_name: string | null;
          amount: number | null;
          currency: string;
          purchase_date: string;
          return_window_days: number;
          return_deadline: string;
          status: PurchaseStatus;
          source: PurchaseSource;
          receipt_path: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          store_id?: string | null;
          custom_store_name?: string | null;
          item_name?: string | null;
          amount?: number | null;
          currency?: string;
          purchase_date: string;
          return_window_days: number;
          return_deadline: string;
          status?: PurchaseStatus;
          source?: PurchaseSource;
          receipt_path?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          store_id?: string | null;
          custom_store_name?: string | null;
          item_name?: string | null;
          amount?: number | null;
          currency?: string;
          purchase_date?: string;
          return_window_days?: number;
          return_deadline?: string;
          status?: PurchaseStatus;
          source?: PurchaseSource;
          receipt_path?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "purchases_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchases_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          purchase_id: string;
          reminder_date: string;
          reminder_type: ReminderType;
          status: ReminderStatus;
          attempts: number;
          sent_at: string | null;
          provider_message_id: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          purchase_id: string;
          reminder_date: string;
          reminder_type: ReminderType;
          status?: ReminderStatus;
          attempts?: number;
          sent_at?: string | null;
          provider_message_id?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          purchase_id?: string;
          reminder_date?: string;
          reminder_type?: ReminderType;
          status?: ReminderStatus;
          attempts?: number;
          sent_at?: string | null;
          provider_message_id?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminders_purchase_id_fkey";
            columns: ["purchase_id"];
            isOneToOne: false;
            referencedRelation: "purchases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reminders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      ai_extractions: {
        Row: {
          id: string;
          user_id: string;
          source: string;
          status: ExtractionStatus;
          extracted: Json;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source?: string;
          status: ExtractionStatus;
          extracted?: Json;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source?: string;
          status?: ExtractionStatus;
          extracted?: Json;
          error?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_extractions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      purchase_status: PurchaseStatus;
      reminder_status: ReminderStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
