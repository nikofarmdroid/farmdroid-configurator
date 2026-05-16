/**
 * Local JSON-file backend that mimics the Supabase client interface.
 * All data stored in .local-data/tables/ — one JSON file per table.
 *
 * Supports Supabase-style chaining: .from().select().eq().gte().order().limit().single()
 * Also: insert(), update(), delete(), upsert(), auth.*
 */
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), ".local-data", "tables");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadTable(table: string): Record<string, unknown>[] {
  const file = path.join(DATA_DIR, `${table}.json`);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

function saveTable(table: string, rows: Record<string, unknown>[]) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(
    path.join(DATA_DIR, `${table}.json`),
    JSON.stringify(rows, null, 2),
    "utf-8"
  );
}

// ---------------------------------------------------------------------------
// Query Builder — thenable, chainable
// ---------------------------------------------------------------------------

type Operation = "select" | "insert" | "update" | "delete" | "upsert";

class LocalQueryBuilder<T extends Record<string, unknown> = Record<string, unknown>> {
  private filters: { column: string; op: "eq" | "gte" | "neq" | "is" | "in" | "ilike"; value: unknown }[] = [];
  private orderSpec: { column: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private headMode = false;
  private selectColumns: string | undefined;
  private op: Operation = "select";
  private insertData: T | T[] | null = null;
  private updateData: Partial<T> | null = null;
  private upsertData: T | T[] | null = null;
  private upsertConflict: string | undefined;

  // Make the builder thenable — awaiting it executes the current operation
  then<TResult1 = { data: T[] | null; error: null; count?: number }, TResult2 = never>(
    resolve?: (value: TResult1) => TResult1 | PromiseLike<TResult1>,
    reject?: (reason: unknown) => TResult2 | PromiseLike<TResult2>
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(resolve, reject) as Promise<TResult1 | TResult2>;
  }

  constructor(private tableName: string) {}

  // --- Operation setters (return this for chaining) ---

  select(columns?: string, opts?: { count?: "exact"; head?: boolean }): this {
    this.op = "select";
    this.selectColumns = columns;
    if (opts?.head) this.headMode = true;
    return this;
  }

  insert(data: T | T[]): this {
    this.op = "insert";
    this.insertData = data;
    return this;
  }

  update(data: Partial<T>): this {
    this.op = "update";
    this.updateData = data;
    return this;
  }

  delete(): this {
    this.op = "delete";
    return this;
  }

  upsert(data: T | T[], opts?: { onConflict?: string }): this {
    this.op = "upsert";
    this.upsertData = data;
    this.upsertConflict = opts?.onConflict;
    return this;
  }

  // --- Filter / modifier methods (return this for chaining) ---

  eq(column: string, value: unknown): this {
    this.filters.push({ column, op: "eq", value });
    return this;
  }

  gte(column: string, value: string): this {
    this.filters.push({ column, op: "gte", value });
    return this;
  }

  not(column: string, _operator: string, value: unknown): this {
    // "not" with "is" null => column is not null
    this.filters.push({ column, op: "neq", value });
    return this;
  }

  is(column: string, value: unknown): this {
    // .is("col", null) => column is null
    this.filters.push({ column, op: "is", value });
    return this;
  }

  in(column: string, values: unknown[]): this {
    this.filters.push({ column, op: "in", value: values });
    return this;
  }

  ilike(column: string, pattern: string): this {
    this.filters.push({ column, op: "ilike", value: pattern });
    return this;
  }

  order(column: string, opts: { ascending: boolean }): this {
    this.orderSpec = { column, ascending: opts.ascending };
    return this;
  }

  limit(n: number): this {
    this.limitCount = n;
    return this;
  }

  // --- Terminal methods (execute and return result) ---

  async single(): Promise<{ data: T | null; error: { message: string } | null }> {
    const result = await this.executeSelect();
    if (!result.data || result.data.length === 0) {
      return { data: null, error: { message: "No rows found" } };
    }
    return { data: result.data[0], error: null };
  }

  // --- Execution ---

  private async execute(): Promise<{ data: T[] | null; error: null; count?: number }> {
    switch (this.op) {
      case "select": return this.executeSelect();
      case "insert": return this.executeInsert();
      case "update": return this.executeUpdate();
      case "delete": return this.executeDelete();
      case "upsert": return this.executeUpsert();
      default: return { data: null, error: null };
    }
  }

  private async executeSelect(): Promise<{ data: T[] | null; error: null; count?: number }> {
    let rows = loadTable<T>(this.tableName);
    rows = rows.filter((r) => this.matchRow(r));
    const total = rows.length;
    rows = this.sortRows(rows);
    if (this.limitCount != null) rows = rows.slice(0, this.limitCount);
    if (this.headMode) {
      return { data: null, error: null, count: total };
    }
    return { data: rows, error: null };
  }

  private async executeInsert(): Promise<{ data: T[] | null; error: null }> {
    const rows = loadTable<T>(this.tableName);
    const items = Array.isArray(this.insertData) ? this.insertData : (this.insertData ? [this.insertData] : []);
    const inserted: T[] = [];
    for (const item of items) {
      const row = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...item,
      } as unknown as T;
      rows.push(row as Record<string, unknown>);
      inserted.push(row);
    }
    saveTable(this.tableName, rows as Record<string, unknown>[]);
    return { data: inserted, error: null };
  }

  private async executeUpdate(): Promise<{ data: T[] | null; error: null }> {
    const rows = loadTable<T>(this.tableName);
    const updated: T[] = [];
    for (let i = 0; i < rows.length; i++) {
      if (this.matchRow(rows[i])) {
        const newRow = {
          ...rows[i],
          ...this.updateData,
          updated_at: new Date().toISOString(),
        } as unknown as T;
        updated.push(newRow);
        rows[i] = newRow as Record<string, unknown>;
      }
    }
    saveTable(this.tableName, rows as Record<string, unknown>[]);
    return { data: updated.length > 0 ? updated : null, error: null };
  }

  private async executeDelete(): Promise<{ data: T[] | null; error: null }> {
    const rows = loadTable<T>(this.tableName);
    const toDelete: T[] = [];
    const kept = rows.filter((r) => {
      if (this.matchRow(r)) {
        toDelete.push(r as unknown as T);
        return false;
      }
      return true;
    });
    saveTable(this.tableName, kept as Record<string, unknown>[]);
    return { data: toDelete.length > 0 ? toDelete : null, error: null };
  }

  private async executeUpsert(): Promise<{ data: T[] | null; error: null }> {
    const items = Array.isArray(this.upsertData) ? this.upsertData : (this.upsertData ? [this.upsertData] : []);
    const conflictCol = this.upsertConflict || "id";
    const rows = loadTable<T>(this.tableName);
    const upserted: T[] = [];

    for (const item of items) {
      const itemRecord = item as unknown as Record<string, unknown>;
      const existingIdx = rows.findIndex((r) => r[conflictCol] === itemRecord[conflictCol]);
      if (existingIdx >= 0) {
        rows[existingIdx] = { ...rows[existingIdx], ...itemRecord, updated_at: new Date().toISOString() };
        upserted.push(rows[existingIdx] as unknown as T);
      } else {
        const row = {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...itemRecord,
        };
        rows.push(row);
        upserted.push(row as unknown as T);
      }
    }
    saveTable(this.tableName, rows);
    return { data: upserted, error: null };
  }

  // --- Internal helpers ---

  private matchRow(row: Record<string, unknown>): boolean {
    for (const f of this.filters) {
      const val = row[f.column];
      if (f.op === "eq" && val !== f.value) return false;
      if (f.op === "neq" && val === f.value) return false;
      if (f.op === "is" && f.value === null && val !== null) return false;
      if (f.op === "is" && f.value !== null && val !== f.value) return false;
      if (f.op === "in" && Array.isArray(f.value) && !f.value.includes(val)) return false;
      if (f.op === "ilike" && typeof val === "string" && typeof f.value === "string") {
        const escaped = (f.value as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*');
        if (!new RegExp('^' + escaped + '$', 'i').test(val)) return false;
      }
      if (f.op === "gte" && typeof val === "string" && typeof f.value === "string") {
        if (val < f.value) return false;
      }
    }
    return true;
  }

  private sortRows(rows: T[]): T[] {
    if (!this.orderSpec) return rows;
    return [...rows].sort((a, b) => {
      const av = (a as Record<string, unknown>)[this.orderSpec!.column];
      const bv = (b as Record<string, unknown>)[this.orderSpec!.column];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return this.orderSpec!.ascending ? -1 : 1;
      if (av > bv) return this.orderSpec!.ascending ? 1 : -1;
      return 0;
    });
  }
}

// ---------------------------------------------------------------------------
// Mock Auth
// ---------------------------------------------------------------------------

const DEV_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "dev@farmdroid.local",
  user_metadata: { name: "Dev User" },
  app_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function createLocalClient() {
  return {
    from<T extends Record<string, unknown> = Record<string, unknown>>(table: string) {
      return new LocalQueryBuilder<T>(table);
    },
    auth: {
      async getUser() {
        return { data: { user: DEV_USER }, error: null };
      },
      async signInWithOtp(_: { email: string }) {
        return { data: {}, error: null };
      },
      async signOut() {
        return { error: null };
      },
      async exchangeCodeForSession(_: string) {
        return { data: { user: DEV_USER, session: {} }, error: null };
      },
      async verifyOtp(_: { email: string; token: string; type: string }) {
        return { data: { user: DEV_USER, session: {} }, error: null };
      },
    },
    rpc: async () => ({ data: null, error: null }),
  };
}

/** Seed one-time dev data so the app renders without manual setup */
export function seedDevData() {
  ensureDir(DATA_DIR);

  if (fs.existsSync(path.join(DATA_DIR, "admin_users.json"))) return;

  const adminUser = {
    id: "00000000-0000-0000-0000-000000000001",
    email: "dev@farmdroid.local",
    name: "Dev Admin",
    role: "super_admin",
    avatar_url: null,
    notify_on_new_config: true,
    last_login_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const sampleConfig = {
    id: crypto.randomUUID(),
    reference: "FD20-DEMO-001",
    first_name: "Demo",
    last_name: "Farmer",
    email: "demo@farmdroid.local",
    phone: "+45 1234 5678",
    company: "Demo Farm ApS",
    country: "Denmark",
    farm_size: "50-100",
    hectares_for_farmdroid: "20",
    crops: "Sugar beets, Onions",
    contact_by_partner: false,
    marketing_consent: true,
    config: {
      seedSize: "6mm",
      activeRows: 6,
      rowDistance: 250,
      rowSpacings: [250, 250, 250, 250, 250],
      wheelSpacing: 1500,
      frontWheel: "AFW",
      powerSource: "solar",
      spraySystem: false,
      weedingTool: "combiTool",
      servicePlan: "standard",
      warrantyExtension: false,
      starterKit: true,
      roadTransport: false,
      powerBank: false,
      additionalWeightKit: false,
      toolbox: true,
      fieldBracket: false,
      fstFieldSetupTool: true,
      baseStationV3: true,
      essentialCarePackage: false,
      essentialCareSpray: false,
    },
    locale: "en",
    total_price: 285000,
    currency: "DKK",
    hubspot_contact_id: null,
    hubspot_company_id: null,
    hubspot_deal_id: null,
    hubspot_note_id: null,
    hubspot_note_synced_at: null,
    status: "submitted",
    view_count: 3,
    last_viewed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const verifiedConfig = {
    id: crypto.randomUUID(),
    name: "Standard 6-row Sugar Beet",
    description: "Standard 6-row configuration optimized for sugar beets with 250mm row spacing",
    config: {
      seedSize: "6mm",
      activeRows: 6,
      rowDistance: 250,
      rowSpacings: [250, 250, 250, 250, 250],
      wheelSpacing: 1500,
      frontWheel: "AFW",
      cropEmoji: "🌱",
      seedingMode: "single" as string,
      plantSpacing: 100,
      seedsPerGroup: 1,
      workingWidth: 1500,
      rowPlacementMode: "even" as string,
    },
    seed_size: "6mm",
    active_rows: 6,
    is_active: true,
    display_order: 1,
    created_by: "00000000-0000-0000-0000-000000000001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const hubspotMapping = {
    id: crypto.randomUUID(),
    source_field: "email",
    source_category: "lead",
    hubspot_object: "contact",
    hubspot_property: "email",
    hubspot_property_label: "Email",
    transform_type: "direct",
    transform_config: null,
    is_active: true,
    created_by: "00000000-0000-0000-0000-000000000001",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  saveTable("admin_users", [adminUser]);
  saveTable("configurations", [sampleConfig]);
  saveTable("configuration_views", []);
  saveTable("verified_configurations", [verifiedConfig]);
  saveTable("hubspot_field_mappings", [hubspotMapping]);
  saveTable("email_verification_codes", []);

  console.log("[local-backend] Seeded dev data.");
}

/** Seed dealer-related tables (called separately so it works even if admin_users already exists) */
export function seedDealerData() {
  ensureDir(DATA_DIR);

  // Dealer users (multi-salesperson per dealer company via shared dealer_code)
  if (!fs.existsSync(path.join(DATA_DIR, "dealers.json"))) {
    const seedDealers = [
      {
        id: "d0000000-0000-0000-0000-000000000001",
        email: "dealer@farmdroid.local",
        name: "Demo Dealer",
        company_name: "Demo Tractors A/S",
        dealer_code: "DEMO-001",
        role: "admin",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "d0000000-0000-0000-0000-000000000002",
        email: "sales@farmdroid.local",
        name: "Demo Salesperson",
        company_name: "Demo Tractors A/S",
        dealer_code: "DEMO-001",
        role: "salesperson",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    saveTable("dealers", seedDealers);
  }

  // Dealer sessions (auth tokens)
  if (!fs.existsSync(path.join(DATA_DIR, "dealer_sessions.json"))) {
    saveTable("dealer_sessions", []);
  }

  // Dealer quotes
  if (!fs.existsSync(path.join(DATA_DIR, "dealer_quotes.json"))) {
    saveTable("dealer_quotes", []);
  }

  console.log("[local-backend] Seeded dealer data.");
}
