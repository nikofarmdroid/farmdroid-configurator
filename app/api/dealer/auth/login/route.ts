import { NextRequest, NextResponse } from "next/server";
import { DEALER_SESSION_COOKIE, createDealerSession, publicDealer, verifyDealerPassword } from "@/lib/dealer-auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const dealer = await verifyDealerPassword(email, password);
  if (!dealer) {
    return NextResponse.json({ error: "Invalid dealer credentials." }, { status: 401 });
  }
  if (dealer.status !== "approved") {
    return NextResponse.json({ error: "Dealer account is not approved yet." }, { status: 403 });
  }

  const session = await createDealerSession(dealer.id);
  const response = NextResponse.json({ dealer: publicDealer(dealer) });
  response.cookies.set(DEALER_SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expires_at),
  });
  return response;
}

