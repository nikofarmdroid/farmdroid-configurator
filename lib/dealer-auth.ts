import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { loadTable, randomId, saveTable, seedDealerData } from "@/lib/local-backend";

export const DEALER_SESSION_COOKIE = "farmdroid_dealer_session";

export type DealerStatus = "pending" | "approved" | "rejected";
export type DealerRole = "admin" | "salesperson";
export type DealerQuoteStatus = "draft" | "sent" | "viewed" | "accepted" | "expired";

export interface Dealer {
  id: string;
  email: string;
  company_name: string;
  contact_name: string;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  password_hash?: string;
  status: DealerStatus;
  role: DealerRole;
  created_at: string;
  approved_at: string | null;
  updated_at?: string;
}

export interface DealerSession {
  id: string;
  dealer_id: string;
  token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface DealerCustomer {
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

export interface DealerQuote {
  id: string;
  dealer_id: string;
  customer_id: string;
  config_data: Record<string, any>;
  total_price: number;
  currency: string;
  status: DealerQuoteStatus;
  share_token: string;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealerQuoteWithRelations extends DealerQuote {
  dealer?: Dealer;
  customer?: DealerCustomer;
}

export function publicDealer(dealer: Dealer) {
  const { password_hash: _passwordHash, ...safeDealer } = dealer;
  return safeDealer;
}

export function getDealers() {
  seedDealerData();
  return loadTable<Dealer>("dealers");
}

export function getDealerByEmail(email: string) {
  return getDealers().find((dealer) => dealer.email.toLowerCase() === email.toLowerCase()) || null;
}

export function getDealerById(id: string) {
  return getDealers().find((dealer) => dealer.id === id) || null;
}

export async function registerDealer(input: {
  email: string;
  company_name: string;
  contact_name?: string;
  password: string;
}) {
  seedDealerData();
  const allowedDomains = process.env.DEALER_ALLOWED_DOMAINS?.split(",").map((domain) => domain.trim().toLowerCase()).filter(Boolean);
  const domain = input.email.split("@")[1]?.toLowerCase();

  if (allowedDomains?.length && !allowedDomains.includes(domain)) {
    throw new Error("This email domain is not allowed for dealer registration.");
  }
  if (getDealerByEmail(input.email)) {
    throw new Error("A dealer account already exists for this email.");
  }

  const now = new Date().toISOString();
  const autoApproved = process.env.USE_LOCAL_BACKEND === "true";
  const dealer: Dealer = {
    id: randomId(),
    email: input.email.toLowerCase(),
    company_name: input.company_name,
    contact_name: input.contact_name || input.company_name,
    phone: null,
    website: null,
    logo_url: null,
    password_hash: await bcrypt.hash(input.password, 10),
    status: autoApproved ? "approved" : "pending",
    role: "admin",
    created_at: now,
    approved_at: autoApproved ? now : null,
    updated_at: now,
  };

  const dealers = getDealers();
  dealers.push(dealer);
  saveTable("dealers", dealers);
  return dealer;
}

export async function createDealerSession(dealerId: string) {
  seedDealerData();
  const now = new Date();
  const session: DealerSession = {
    id: randomId(),
    dealer_id: dealerId,
    token: randomId(),
    expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
  const sessions = loadTable<DealerSession>("dealer_sessions").filter((item) => new Date(item.expires_at) > now);
  sessions.push(session);
  saveTable("dealer_sessions", sessions);
  return session;
}

export async function getCurrentDealer() {
  seedDealerData();
  const cookieStore = await cookies();
  const token = cookieStore.get(DEALER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const sessions = loadTable<DealerSession>("dealer_sessions");
  const session = sessions.find((item) => item.token === token && new Date(item.expires_at) > new Date());
  if (!session) return null;

  const dealer = getDealerById(session.dealer_id);
  if (!dealer || dealer.status !== "approved") return null;

  return dealer;
}

export async function requireDealer() {
  const dealer = await getCurrentDealer();
  if (!dealer) {
    throw new Error("Unauthorized");
  }
  return dealer;
}

export async function clearCurrentDealerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(DEALER_SESSION_COOKIE)?.value;
  if (token) {
    const sessions = loadTable<DealerSession>("dealer_sessions").filter((item) => item.token !== token);
    saveTable("dealer_sessions", sessions);
  }
  cookieStore.delete(DEALER_SESSION_COOKIE);
}

export async function verifyDealerPassword(email: string, password: string) {
  const dealer = getDealerByEmail(email);
  if (!dealer || !dealer.password_hash) return null;
  const ok = await bcrypt.compare(password, dealer.password_hash);
  if (!ok) return null;
  return dealer;
}

