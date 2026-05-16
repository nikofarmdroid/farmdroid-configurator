/**
 * Dealer auth browser client.
 * Handles login, session persistence, and logout for dealer accounts.
 * In local dev mode: uses token-based auth with httpOnly cookies set by API routes.
 * In production: uses Supabase magic links (future).
 */

export interface DealerUser {
  id: string;
  email: string;
  name: string;
  companyName: string;
  dealerCode: string;
  role: "admin" | "salesperson";
}

interface LoginResult {
  success: boolean;
  token?: string;
  dealer?: DealerUser;
  error?: string;
}

/**
 * Send login request for a dealer email.
 * In local dev mode, returns a session token immediately.
 */
export async function dealerLogin(email: string): Promise<LoginResult> {
  try {
    const res = await fetch("/api/dealer/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Login failed" };
    }

    // Set a client-readable cookie so hasDealerCookie() works without an API call
    document.cookie = `dealer_session=1; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;

    return {
      success: true,
      dealer: data.dealer,
    };
  } catch (error) {
    console.error("[dealerAuth] Login error:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Get the current dealer session from the server.
 */
export async function getDealerSession(): Promise<DealerUser | null> {
  try {
    const res = await fetch("/api/dealer/auth/me", {
      credentials: "include",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.dealer || null;
  } catch {
    return null;
  }
}

/**
 * Log out the current dealer.
 */
export async function dealerLogout(): Promise<void> {
  try {
    await fetch("/api/dealer/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    document.cookie = "dealer_session=; path=/; max-age=0";
  } catch (error) {
    console.error("[dealerAuth] Logout error:", error);
  }
}

/**
 * Check if a dealer session cookie exists (client-side check, not authoritative).
 */
export function hasDealerCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("dealer_session=1");
}
