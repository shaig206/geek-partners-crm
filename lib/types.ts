import type { BusinessType, DraftStatus, LeadStatus, SendStatus } from "@/lib/constants";

export type Lead = {
  id: string;
  name: string;
  website: string | null;
  category: string | null;
  city: string;
  business_type: BusinessType | null;
  size_signal: string | null;
  lag_score: number | null;
  why_lagging: string | null;
  peer_gap: string | null;
  phone: string | null;
  email: string | null;
  contact_name: string | null;
  status: LeadStatus;
  warming_notes: string | null;
  source_url: string | null;
  priority: boolean;
  found_at: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EmailDraft = {
  id: string;
  lead_id: string;
  to_email: string;
  to_name: string | null;
  subject: string;
  body: string;
  status: DraftStatus;
  reject_reason: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Send = {
  id: string;
  lead_id: string;
  draft_id: string | null;
  from_email: string;
  to_email: string;
  subject: string;
  body: string;
  provider: string;
  provider_message_id: string | null;
  status: SendStatus;
  error: string | null;
  sent_at: string | null;
  created_at: string;
};

export type InboundEvent = {
  id: string;
  payload: Record<string, unknown>;
  from_email: string | null;
  matched_lead_id: string | null;
  previous_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
};

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };
