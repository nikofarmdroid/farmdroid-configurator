import { NextResponse } from "next/server";
import { DEALER_SESSION_COOKIE, clearCurrentDealerSession } from "@/lib/dealer-auth";

export async function POST() {
  await clearCurrentDealerSession();
  const response = NextResponse.json({ success: true });
  response.cookies.set(DEALER_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

