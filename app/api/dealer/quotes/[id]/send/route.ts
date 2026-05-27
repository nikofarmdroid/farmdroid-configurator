import { NextRequest, NextResponse } from "next/server";
import { requireDealer } from "@/lib/dealer-auth";
import { getQuoteById, updateDealerQuote } from "@/lib/dealer-quotes";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const dealer = await requireDealer();
    const { id } = await params;
    const quote = getQuoteById(dealer.id, id);
    if (!quote) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    const updated = updateDealerQuote(dealer.id, id, { status: "sent" });
    const origin = request.nextUrl.origin;
    return NextResponse.json({
      quote: updated,
      shareUrl: `${origin}/quote/${quote.share_token}`,
      shareToken: quote.share_token,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

