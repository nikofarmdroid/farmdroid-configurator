import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDealer } from "@/lib/dealer-auth";
import { formatRelativeTime, getQuoteById } from "@/lib/dealer-quotes";
import { QuoteDetailActions } from "./QuoteDetailActions";

export default async function DealerQuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  let dealer;
  try {
    dealer = await requireDealer();
  } catch {
    redirect("/dealer/login");
  }
  const { id } = await params;
  const quote = getQuoteById(dealer.id, id);
  if (!quote) redirect("/dealer/quotes");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-2xl font-semibold text-stone-950">Quote detail</h1>
          <p className="text-sm text-stone-600">Created {new Date(quote.created_at).toLocaleString()}</p>
        </div>
        <Badge className="capitalize">{quote.status}</Badge>
      </div>
      <QuoteDetailActions quote={quote} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{quote.customer?.first_name} {quote.customer?.last_name}</p>
            <p>{quote.customer?.email}</p>
            <p>{quote.customer?.phone || "No phone"}</p>
            <p>{quote.customer?.company || "No company"}</p>
            <p>{quote.customer?.country || "No country"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tracking</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Views: <span className="font-medium">{quote.view_count}</span></p>
            <p>Last viewed: <span className="font-medium">{formatRelativeTime(quote.last_viewed_at)}</span></p>
            <p>Token: <span className="font-mono text-xs">{quote.share_token}</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Price</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {new Intl.NumberFormat("en", { style: "currency", currency: quote.currency }).format(quote.total_price)}
            </p>
            <p className="mt-2 text-sm text-stone-600">Cost and suggested retail prices are visible to dealers.</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Configuration summary</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(quote.config_data).map(([key, value]) => (
              <div key={key} className="rounded-md border bg-white p-3">
                <dt className="text-xs uppercase text-stone-500">{key}</dt>
                <dd className="mt-1 text-sm font-medium">{Array.isArray(value) ? value.join(", ") : String(value)}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

