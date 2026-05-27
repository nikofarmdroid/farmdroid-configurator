import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QuoteTable } from "@/components/dealer/QuoteTable";
import { requireDealer } from "@/lib/dealer-auth";
import { getDealerQuotes, withRelations } from "@/lib/dealer-quotes";

export default async function DealerQuotesPage({ searchParams }: { searchParams: Promise<{ status?: string; customer?: string }> }) {
  let dealer;
  try {
    dealer = await requireDealer();
  } catch {
    redirect("/dealer/login");
  }
  const filters = await searchParams;
  let quotes = getDealerQuotes(dealer.id).map((quote) => withRelations(quote)!);
  if (filters.status && filters.status !== "all") quotes = quotes.filter((quote) => quote.status === filters.status);
  if (filters.customer) {
    const q = filters.customer.toLowerCase();
    quotes = quotes.filter((quote) => [quote.customer?.first_name, quote.customer?.last_name, quote.customer?.email, quote.customer?.company].filter(Boolean).join(" ").toLowerCase().includes(q));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold text-stone-950">Quotes</h1>
        <Button asChild className="bg-[#5AB147] hover:bg-[#4d9b3d]"><Link href="/dealer/quotes/new">New quote</Link></Button>
      </div>
      <Card>
        <CardHeader><CardTitle>All quotes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-3 md:grid-cols-[160px_1fr_auto]">
            <select name="status" defaultValue={filters.status || "all"} className="h-9 rounded-md border bg-white px-3 text-sm">
              {["all", "draft", "sent", "viewed", "accepted", "expired"].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <Input name="customer" defaultValue={filters.customer || ""} placeholder="Search customer, email or company" />
            <Button variant="outline">Filter</Button>
          </form>
          <QuoteTable quotes={quotes} />
        </CardContent>
      </Card>
    </div>
  );
}

