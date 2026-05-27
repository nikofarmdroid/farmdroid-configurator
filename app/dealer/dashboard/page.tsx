import Link from "next/link";
import { redirect } from "next/navigation";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuoteTable } from "@/components/dealer/QuoteTable";
import { requireDealer } from "@/lib/dealer-auth";
import { getDealerQuotes, quoteStats, withRelations } from "@/lib/dealer-quotes";

export default async function DealerDashboardPage() {
  let dealer;
  try {
    dealer = await requireDealer();
  } catch {
    redirect("/dealer/login");
  }
  const quotes = getDealerQuotes(dealer.id).map((quote) => withRelations(quote)!);
  const stats = quoteStats(quotes);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-stone-950">Dashboard</h1>
          <p className="text-sm text-stone-600">{dealer.company_name}</p>
        </div>
        <Button asChild className="bg-[#5AB147] hover:bg-[#4d9b3d]">
          <Link href="/dealer/quotes/new"><FilePlus2 className="size-4" /> New quote</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total quotes", stats.total],
          ["Sent", stats.sent],
          ["Viewed", stats.viewed],
          ["Accepted", stats.accepted],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-stone-600">{label}</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-semibold">{value}</div></CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Recent quotes</CardTitle></CardHeader>
        <CardContent><QuoteTable quotes={quotes.slice(0, 8)} /></CardContent>
      </Card>
    </div>
  );
}

