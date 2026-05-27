import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const DATA_DIR = path.join(process.cwd(), ".local-data", "tables");

type JsonRow = Record<string, any>;

export function ensureLocalDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function tablePath(table: string) {
  ensureLocalDataDir();
  return path.join(DATA_DIR, `${table}.json`);
}

export function loadTable<T extends JsonRow>(table: string): T[] {
  const file = tablePath(table);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "[]", "utf8");
    return [];
  }

  const raw = fs.readFileSync(file, "utf8").trim();
  if (!raw) return [];
  return JSON.parse(raw) as T[];
}

export function saveTable<T extends JsonRow>(table: string, rows: T[]) {
  const file = tablePath(table);
  fs.writeFileSync(file, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
}

export function randomId() {
  return crypto.randomUUID();
}

export function seedDealerData() {
  ensureLocalDataDir();
  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync("password123", 10);

  const dealers = loadTable<JsonRow>("dealers");
  const existing = dealers.find((dealer) => dealer.email === "dealer@farmdroid.local");

  if (existing) {
    Object.assign(existing, {
      company_name: existing.company_name || "Demo Tractors A/S",
      contact_name: existing.contact_name || existing.name || "Demo Dealer",
      phone: existing.phone || "+45 12 34 56 78",
      website: existing.website || "https://farmdroid.com",
      logo_url: existing.logo_url || "/images/farmdroid-logo.png",
      status: existing.status || "approved",
      role: existing.role || "admin",
      approved_at: existing.approved_at || now,
      password_hash: existing.password_hash || passwordHash,
      created_at: existing.created_at || now,
      updated_at: now,
    });
  } else {
    dealers.push({
      id: "d0000000-0000-0000-0000-000000000001",
      email: "dealer@farmdroid.local",
      company_name: "Demo Tractors A/S",
      contact_name: "Demo Dealer",
      phone: "+45 12 34 56 78",
      website: "https://farmdroid.com",
      logo_url: "/images/farmdroid-logo.png",
      password_hash: passwordHash,
      status: "approved",
      role: "admin",
      created_at: now,
      approved_at: now,
      updated_at: now,
    });
  }
  saveTable("dealers", dealers);

  for (const table of ["dealer_sessions", "dealer_quotes", "dealer_customers"]) {
    const file = tablePath(table);
    if (!fs.existsSync(file)) saveTable(table, []);
  }

  const customers = loadTable<JsonRow>("dealer_customers");
  const quotes = loadTable<JsonRow>("dealer_quotes");
  let customersChanged = false;
  let quotesChanged = false;

  for (const quote of quotes) {
    if (!quote.customer_id) {
      const nameParts = String(quote.customer_name || "Demo Customer").split(" ");
      const email = quote.customer_email || `customer-${quote.id}@farmdroid.local`;
      let customer = customers.find((item) => item.dealer_id === quote.dealer_id && item.email === email);
      if (!customer) {
        customer = {
          id: randomId(),
          dealer_id: quote.dealer_id || "d0000000-0000-0000-0000-000000000001",
          email,
          first_name: nameParts[0] || "Demo",
          last_name: nameParts.slice(1).join(" "),
          phone: quote.customer_phone || null,
          company: quote.customer_company || null,
          country: quote.customer_country || null,
          created_at: quote.created_at || now,
        };
        customers.push(customer);
        customersChanged = true;
      }
      quote.customer_id = customer.id;
      quotesChanged = true;
    }

    if (!quote.config_data) {
      quote.config_data = quote.config || {};
      quotesChanged = true;
    }
    if (!quote.share_token) {
      quote.share_token = randomId();
      quotesChanged = true;
    }
    if (quote.view_count === undefined) {
      quote.view_count = 0;
      quotesChanged = true;
    }
    if (!quote.status) {
      quote.status = "draft";
      quotesChanged = true;
    }
  }

  if (customersChanged) saveTable("dealer_customers", customers);
  if (quotesChanged) saveTable("dealer_quotes", quotes);
}
