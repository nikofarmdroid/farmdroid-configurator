import { NextResponse } from "next/server";
import { getPublicQuoteByToken } from "@/lib/dealer-quotes";
import { publicDealer } from "@/lib/dealer-auth";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const quote = getPublicQuoteByToken(token);
  if (!quote) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  const { customer: _customer, dealer, ...safeQuote } = quote;
  return NextResponse.json({
    quote: safeQuote,
    dealer: dealer ? publicDealer(dealer) : null,
  });
}

