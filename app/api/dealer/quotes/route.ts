import { NextRequest, NextResponse } from "next/server";
import { requireDealer } from "@/lib/dealer-auth";
import { getDealerQuotes, saveDealerQuote, withRelations } from "@/lib/dealer-quotes";

export async function GET(request: NextRequest) {
  try {
    const dealer = await requireDealer();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customer = searchParams.get("customer")?.toLowerCase();
    let quotes = getDealerQuotes(dealer.id).map((quote) => withRelations(quote)!);
    if (status && status !== "all") quotes = quotes.filter((quote) => quote.status === status);
    if (customer) {
      quotes = quotes.filter((quote) => {
        const c = quote.customer;
        return [c?.first_name, c?.last_name, c?.email, c?.company].filter(Boolean).join(" ").toLowerCase().includes(customer);
      });
    }
    return NextResponse.json({ quotes });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const dealer = await requireDealer();
    const body = await request.json();
    if (!body.customer?.email || !body.customer?.first_name || !body.config_data) {
      return NextResponse.json({ error: "Customer email, first name and config_data are required." }, { status: 400 });
    }

    const quote = saveDealerQuote({
      dealerId: dealer.id,
      customer: {
        email: body.customer.email,
        first_name: body.customer.first_name,
        last_name: body.customer.last_name || "",
        phone: body.customer.phone || null,
        company: body.customer.company || null,
        country: body.customer.country || null,
      },
      config_data: body.config_data,
      total_price: Number(body.total_price || 0),
      currency: body.currency || "EUR",
      status: body.status || "draft",
    });

    return NextResponse.json({ quote }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

