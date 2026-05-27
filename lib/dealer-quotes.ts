import { Dealer, DealerCustomer, DealerQuote, DealerQuoteWithRelations } from "@/lib/dealer-auth";
import { loadTable, randomId, saveTable, seedDealerData } from "@/lib/local-backend";

export function getDealerCustomers(dealerId: string) {
  seedDealerData();
  return loadTable<DealerCustomer>("dealer_customers").filter((customer) => customer.dealer_id === dealerId);
}

export function getDealerQuotes(dealerId: string) {
  seedDealerData();
  return loadTable<DealerQuote>("dealer_quotes")
    .filter((quote) => quote.dealer_id === dealerId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getQuoteById(dealerId: string, id: string) {
  return withRelations(getDealerQuotes(dealerId).find((quote) => quote.id === id) || null);
}

export function getPublicQuoteByToken(token: string) {
  seedDealerData();
  const quotes = loadTable<DealerQuote>("dealer_quotes");
  const quote = quotes.find((item) => item.share_token === token);
  if (!quote) return null;

  const now = new Date().toISOString();
  quote.view_count += 1;
  quote.last_viewed_at = now;
  quote.updated_at = now;
  if (quote.status === "sent") quote.status = "viewed";
  saveTable("dealer_quotes", quotes);
  return withRelations(quote);
}

export function saveDealerQuote(input: {
  dealerId: string;
  customer: Omit<DealerCustomer, "id" | "dealer_id" | "created_at">;
  config_data: Record<string, any>;
  total_price: number;
  currency: string;
  status?: DealerQuote["status"];
}) {
  seedDealerData();
  const now = new Date().toISOString();
  const customers = loadTable<DealerCustomer>("dealer_customers");
  let customer = customers.find((item) => item.dealer_id === input.dealerId && item.email.toLowerCase() === input.customer.email.toLowerCase());

  if (!customer) {
    customer = {
      id: randomId(),
      dealer_id: input.dealerId,
      ...input.customer,
      created_at: now,
    };
    customers.push(customer);
    saveTable("dealer_customers", customers);
  }

  const quote: DealerQuote = {
    id: randomId(),
    dealer_id: input.dealerId,
    customer_id: customer.id,
    config_data: input.config_data,
    total_price: input.total_price,
    currency: input.currency,
    status: input.status || "draft",
    share_token: randomId(),
    view_count: 0,
    last_viewed_at: null,
    created_at: now,
    updated_at: now,
  };

  const quotes = loadTable<DealerQuote>("dealer_quotes");
  quotes.push(quote);
  saveTable("dealer_quotes", quotes);
  return withRelations(quote)!;
}

export function updateDealerQuote(dealerId: string, id: string, patch: Partial<DealerQuote>) {
  const quotes = loadTable<DealerQuote>("dealer_quotes");
  const quote = quotes.find((item) => item.dealer_id === dealerId && item.id === id);
  if (!quote) return null;
  Object.assign(quote, patch, { updated_at: new Date().toISOString() });
  saveTable("dealer_quotes", quotes);
  return withRelations(quote);
}

export function deleteDealerQuote(dealerId: string, id: string) {
  const quotes = loadTable<DealerQuote>("dealer_quotes");
  const next = quotes.filter((quote) => !(quote.dealer_id === dealerId && quote.id === id));
  if (next.length === quotes.length) return false;
  saveTable("dealer_quotes", next);
  return true;
}

export function withRelations(quote: DealerQuote | null): DealerQuoteWithRelations | null {
  if (!quote) return null;
  const customers = loadTable<DealerCustomer>("dealer_customers");
  const dealers = loadTable<Dealer>("dealers");
  return {
    ...quote,
    customer: customers.find((customer) => customer.id === quote.customer_id),
    dealer: dealers.find((dealer) => dealer.id === quote.dealer_id),
  };
}

export function quoteStats(quotes: DealerQuote[]) {
  return {
    total: quotes.length,
    sent: quotes.filter((quote) => quote.status === "sent").length,
    viewed: quotes.filter((quote) => quote.status === "viewed").length,
    accepted: quotes.filter((quote) => quote.status === "accepted").length,
  };
}

export function formatRelativeTime(value: string | null) {
  if (!value) return "Never";
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

