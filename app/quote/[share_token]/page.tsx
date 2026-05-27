import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicQuoteByToken } from "@/lib/dealer-quotes";

export default async function PublicDealerQuotePage({ params }: { params: Promise<{ share_token: string }> }) {
  const { share_token } = await params;
  const quote = getPublicQuoteByToken(share_token);
  if (!quote) notFound();
  const dealer = quote.dealer;

  return (
    <main className="min-h-screen bg-stone-50">
      <section className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-4">
              <Image src="/images/farmdroid-logo.png" alt="FarmDroid" width={56} height={56} />
              <div>
                <h1 className="text-3xl font-semibold text-stone-950">FarmDroid FD20 Quote</h1>
                <p className="text-stone-600">Prepared by {dealer?.company_name || "FarmDroid dealer"}</p>
              </div>
            </div>
            <Badge className="capitalize">{quote.status}</Badge>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-stone-500">Total price</p>
            <p className="text-3xl font-semibold text-stone-950">
              {new Intl.NumberFormat("en", { style: "currency", currency: quote.currency }).format(quote.total_price)}
            </p>
          </div>
        </div>
      </section>
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader><CardTitle>Configuration summary</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {Object.entries(quote.config_data).map(([key, value]) => (
                <div key={key} className="rounded-md border bg-white p-3">
                  <dt className="text-xs uppercase text-stone-500">{key}</dt>
                  <dd className="mt-1 text-sm font-medium">{Array.isArray(value) ? value.join(", ") : String(value)}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Contact dealer</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {dealer?.logo_url && <Image src={dealer.logo_url} alt={dealer.company_name} width={160} height={80} className="object-contain" />}
            <p className="font-medium">{dealer?.company_name}</p>
            <p>{dealer?.contact_name}</p>
            <p>{dealer?.phone}</p>
            <p>{dealer?.email}</p>
            {dealer?.website && <p>{dealer.website}</p>}
            <Button asChild className="w-full bg-[#5AB147] hover:bg-[#4d9b3d]">
              <a href={`mailto:${dealer?.email}?subject=FarmDroid quote ${quote.id}`}>Contact Dealer</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

