import { NextRequest, NextResponse } from "next/server";
import { requireDealer } from "@/lib/dealer-auth";
import { getDealerCustomers, getDealerQuotes } from "@/lib/dealer-quotes";

export async function GET(request: NextRequest) {
  try {
    const dealer = await requireDealer();
    const q = new URL(request.url).searchParams.get("q")?.toLowerCase() || "";
    const quotes = getDealerQuotes(dealer.id);
    let customers = getDealerCustomers(dealer.id).map((customer) => ({
      ...customer,
      quotes: quotes.filter((quote) => quote.customer_id === customer.id),
    }));
    if (q) {
      customers = customers.filter((customer) =>
        [customer.first_name, customer.last_name, customer.email, customer.company].filter(Boolean).join(" ").toLowerCase().includes(q)
      );
    }
    return NextResponse.json({ customers });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

