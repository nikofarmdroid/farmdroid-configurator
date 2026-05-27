import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DealerQuoteWithRelations } from "@/lib/dealer-auth";
import { formatRelativeTime } from "@/lib/dealer-quotes";

export function QuoteTable({ quotes }: { quotes: DealerQuoteWithRelations[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Config</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Last viewed</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotes.map((quote) => (
          <TableRow key={quote.id}>
            <TableCell>
              <div className="font-medium">{quote.customer?.first_name} {quote.customer?.last_name}</div>
              <div className="text-xs text-stone-500">{quote.customer?.company || quote.customer?.email}</div>
            </TableCell>
            <TableCell>{describeConfig(quote.config_data)}</TableCell>
            <TableCell>{new Intl.NumberFormat("en", { style: "currency", currency: quote.currency }).format(quote.total_price)}</TableCell>
            <TableCell><Badge className="capitalize">{quote.status}</Badge></TableCell>
            <TableCell>{new Date(quote.created_at).toLocaleDateString()}</TableCell>
            <TableCell>{formatRelativeTime(quote.last_viewed_at)}</TableCell>
            <TableCell className="text-right">
              <Button asChild variant="outline" size="sm">
                <Link href={`/dealer/quotes/${quote.id}`}>View</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {quotes.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center text-stone-500">No quotes found.</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export function describeConfig(config: Record<string, any>) {
  const rows = config.activeRows ? `${config.activeRows} rows` : "FD20";
  const seed = config.seedSize ? `, ${config.seedSize}` : "";
  return `${rows}${seed}`;
}

