import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireDealer } from "@/lib/dealer-auth";
import { getDealerCustomers, getDealerQuotes } from "@/lib/dealer-quotes";

export default async function DealerCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  let dealer;
  try {
    dealer = await requireDealer();
  } catch {
    redirect("/dealer/login");
  }
  const { q = "" } = await searchParams;
  const query = q.toLowerCase();
  const quotes = getDealerQuotes(dealer.id);
  let customers = getDealerCustomers(dealer.id);
  if (query) customers = customers.filter((customer) => [customer.first_name, customer.last_name, customer.email, customer.company].filter(Boolean).join(" ").toLowerCase().includes(query));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-stone-950">Customers</h1>
      <Card>
        <CardHeader><CardTitle>Customer database</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form><Input name="q" defaultValue={q} placeholder="Search by name, email or company" /></form>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Company</TableHead><TableHead>Country</TableHead><TableHead>Quotes</TableHead></TableRow></TableHeader>
            <TableBody>
              {customers.map((customer) => {
                const customerQuotes = quotes.filter((quote) => quote.customer_id === customer.id);
                return (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.first_name} {customer.last_name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.company || "-"}</TableCell>
                    <TableCell>{customer.country || "-"}</TableCell>
                    <TableCell className="space-x-2">
                      {customerQuotes.length}
                      {customerQuotes[0] && <Link className="ml-2 text-[#3f8f31]" href={`/dealer/quotes/${customerQuotes[0].id}`}>latest</Link>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

