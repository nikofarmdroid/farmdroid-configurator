import { NextRequest, NextResponse } from "next/server";
import { DEALER_SESSION_COOKIE, createDealerSession, publicDealer, registerDealer } from "@/lib/dealer-auth";

export async function POST(request: NextRequest) {
  try {
    const { email, company_name, companyName, contact_name, contactName, password } = await request.json();
    if (!email || !(company_name || companyName) || !password) {
      return NextResponse.json({ error: "Email, company and password are required." }, { status: 400 });
    }

    const dealer = await registerDealer({
      email,
      company_name: company_name || companyName,
      contact_name: contact_name || contactName,
      password,
    });
    const response = NextResponse.json({ dealer: publicDealer(dealer) });

    if (dealer.status === "approved") {
      const session = await createDealerSession(dealer.id);
      response.cookies.set(DEALER_SESSION_COOKIE, session.token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires: new Date(session.expires_at),
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Registration failed." }, { status: 400 });
  }
}

