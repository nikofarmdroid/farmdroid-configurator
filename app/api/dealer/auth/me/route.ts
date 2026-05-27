import { NextResponse } from "next/server";
import { getCurrentDealer, publicDealer } from "@/lib/dealer-auth";

export async function GET() {
  const dealer = await getCurrentDealer();
  if (!dealer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ dealer: publicDealer(dealer) });
}

