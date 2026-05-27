import { NextRequest, NextResponse } from "next/server";
import { requireDealer } from "@/lib/dealer-auth";
import { deleteDealerQuote, getQuoteById, updateDealerQuote } from "@/lib/dealer-quotes";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const dealer = await requireDealer();
    const { id } = await params;
    const quote = getQuoteById(dealer.id, id);
    if (!quote) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    return NextResponse.json({ quote });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const dealer = await requireDealer();
    const { id } = await params;
    const body = await request.json();
    const quote = updateDealerQuote(dealer.id, id, body);
    if (!quote) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    return NextResponse.json({ quote });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const dealer = await requireDealer();
    const { id } = await params;
    const deleted = deleteDealerQuote(dealer.id, id);
    if (!deleted) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

