import type { ConfiguratorState } from "./configurator-data";
import type {
  AdminUserRow,
  AdminUserInsert,
  AdminUserUpdate,
  HubSpotFieldMappingRow,
  HubSpotFieldMappingInsert,
  HubSpotFieldMappingUpdate,
} from "./admin/types";

/**
 * Database types for Supabase
 */
export interface Database {
  public: {
    Tables: {
      configurations: {
        Row: ConfigurationRow;
        Insert: ConfigurationInsert;
        Update: ConfigurationUpdate;
      };
      configuration_views: {
        Row: ConfigurationViewRow;
        Insert: ConfigurationViewInsert;
        Update: ConfigurationViewUpdate;
      };
      admin_users: {
        Row: AdminUserRow;
        Insert: AdminUserInsert;
        Update: AdminUserUpdate;
      };
      hubspot_field_mappings: {
        Row: HubSpotFieldMappingRow;
        Insert: HubSpotFieldMappingInsert;
        Update: HubSpotFieldMappingUpdate;
      };
      email_verification_codes: {
        Row: EmailVerificationCodeRow;
        Insert: EmailVerificationCodeInsert;
        Update: EmailVerificationCodeUpdate;
      };
      dealers: {
        Row: DealerRow;
        Insert: DealerInsert;
        Update: DealerUpdate;
      };
      dealer_sessions: {
        Row: DealerSessionRow;
        Insert: DealerSessionInsert;
        Update: DealerSessionUpdate;
      };
      dealer_quotes: {
        Row: DealerQuoteRow;
        Insert: DealerQuoteInsert;
        Update: DealerQuoteUpdate;
      };
      dealer_customers: {
        Row: DealerCustomerRow;
        Insert: DealerCustomerInsert;
        Update: DealerCustomerUpdate;
      };
    };
  };
}

/**
 * Configuration row as stored in database
 */
export interface ConfigurationRow {
  id: string;
  reference: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string;
  country: string;
  farm_size: string | null;
  hectares_for_farmdroid: string | null;
  crops: string | null;
  contact_by_partner: boolean;
  marketing_consent: boolean;
  config: ConfiguratorState;
  locale: string;
  total_price: number;
  currency: string;
  hubspot_contact_id: string | null;
  hubspot_company_id: string | null;
  hubspot_deal_id: string | null;
  hubspot_note_id: string | null;
  hubspot_note_synced_at: string | null;
  status: "submitted" | "contacted" | "quoted" | "converted";
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Configuration insert (for creating new rows)
 */
export interface ConfigurationInsert {
  id?: string;
  reference: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  company: string;
  country: string;
  farm_size?: string | null;
  hectares_for_farmdroid?: string | null;
  crops?: string | null;
  contact_by_partner?: boolean;
  marketing_consent?: boolean;
  config: ConfiguratorState;
  locale: string;
  total_price: number;
  currency: string;
  hubspot_contact_id?: string | null;
  hubspot_company_id?: string | null;
  hubspot_deal_id?: string | null;
  hubspot_note_id?: string | null;
  hubspot_note_synced_at?: string | null;
  status?: "submitted" | "contacted" | "quoted" | "converted";
  view_count?: number;
  last_viewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Configuration update (for updating existing rows)
 */
export interface ConfigurationUpdate {
  id?: string;
  reference?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string | null;
  company?: string;
  country?: string;
  farm_size?: string | null;
  hectares_for_farmdroid?: string | null;
  crops?: string | null;
  contact_by_partner?: boolean;
  marketing_consent?: boolean;
  config?: ConfiguratorState;
  locale?: string;
  total_price?: number;
  currency?: string;
  hubspot_contact_id?: string | null;
  hubspot_company_id?: string | null;
  hubspot_deal_id?: string | null;
  hubspot_note_id?: string | null;
  hubspot_note_synced_at?: string | null;
  status?: "submitted" | "contacted" | "quoted" | "converted";
  view_count?: number;
  last_viewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Configuration view row (analytics)
 */
export interface ConfigurationViewRow {
  id: string;
  configuration_id: string;
  viewed_at: string;
  viewer_type: "farmer" | "distributor" | "internal" | null;
  user_agent: string | null;
  ip_hash: string | null;
}

/**
 * Configuration view insert
 */
export interface ConfigurationViewInsert {
  id?: string;
  configuration_id: string;
  viewed_at?: string;
  viewer_type?: "farmer" | "distributor" | "internal" | null;
  user_agent?: string | null;
  ip_hash?: string | null;
}

/**
 * Configuration view update
 */
export interface ConfigurationViewUpdate {
  id?: string;
  configuration_id?: string;
  viewed_at?: string;
  viewer_type?: "farmer" | "distributor" | "internal" | null;
  user_agent?: string | null;
  ip_hash?: string | null;
}

/**
 * Email verification code row
 */
export type EmailVerificationPurpose = "email_lookup" | "my_configs";

export interface EmailVerificationCodeRow {
  id: string;
  email: string;
  code: string;
  purpose: EmailVerificationPurpose;
  attempts: number;
  max_attempts: number;
  expires_at: string;
  verified_at: string | null;
  ip_hash: string | null;
  created_at: string;
}

/**
 * Email verification code insert
 */
export interface EmailVerificationCodeInsert {
  id?: string;
  email: string;
  code: string;
  purpose: EmailVerificationPurpose;
  attempts?: number;
  max_attempts?: number;
  expires_at: string;
  verified_at?: string | null;
  ip_hash?: string | null;
  created_at?: string;
}

/**
 * Email verification code update
 */
export interface EmailVerificationCodeUpdate {
  id?: string;
  email?: string;
  code?: string;
  purpose?: EmailVerificationPurpose;
  attempts?: number;
  max_attempts?: number;
  expires_at?: string;
  verified_at?: string | null;
  ip_hash?: string | null;
  created_at?: string;
}

export type DealerStatus = "pending" | "approved" | "rejected";
export type DealerRole = "admin" | "salesperson";
export type DealerQuoteStatus = "draft" | "sent" | "viewed" | "accepted" | "expired";

export interface DealerRow {
  id: string;
  email: string;
  company_name: string;
  contact_name: string;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  password_hash: string;
  status: DealerStatus;
  role: DealerRole;
  created_at: string;
  approved_at: string | null;
}

export type DealerInsert = Omit<DealerRow, "id" | "created_at" | "approved_at"> & {
  id?: string;
  created_at?: string;
  approved_at?: string | null;
};

export type DealerUpdate = Partial<DealerInsert>;

export interface DealerSessionRow {
  id: string;
  dealer_id: string;
  token: string;
  expires_at: string;
}

export type DealerSessionInsert = Omit<DealerSessionRow, "id"> & { id?: string };
export type DealerSessionUpdate = Partial<DealerSessionInsert>;

export interface DealerCustomerRow {
  id: string;
  dealer_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  created_at: string;
}

export type DealerCustomerInsert = Omit<DealerCustomerRow, "id" | "created_at"> & { id?: string; created_at?: string };
export type DealerCustomerUpdate = Partial<DealerCustomerInsert>;

export interface DealerQuoteRow {
  id: string;
  dealer_id: string;
  customer_id: string;
  config_data: ConfiguratorState | Record<string, unknown>;
  total_price: number;
  currency: string;
  status: DealerQuoteStatus;
  share_token: string;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type DealerQuoteInsert = Omit<DealerQuoteRow, "id" | "created_at" | "updated_at" | "view_count" | "last_viewed_at"> & {
  id?: string;
  view_count?: number;
  last_viewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type DealerQuoteUpdate = Partial<DealerQuoteInsert>;
