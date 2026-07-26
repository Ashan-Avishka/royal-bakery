import { randomUUID } from "node:crypto";

export interface FakeAuthUser {
  id: string;
  email?: string;
  app_metadata: { role?: string };
}

export interface FakeProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  role: "customer" | "admin";
  created_at: string;
}

export interface FakeCategoryRow {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FakeProductRow {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  stock_quantity: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface FakeCartItemRow {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

export interface FakeOrderRow {
  id: string;
  user_id: string;
  status: string;
  payment_status: string;
  total_amount: string;
  delivery_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface FakeOrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface FakePaymentRow {
  id: string;
  order_id: string;
  payment_method: string;
  status: string;
  amount: string;
  transaction_id: string | null;
  payhere_payment_id: string | null;
  paid_at: string | null;
  created_at: string;
}

type Row = Record<string, any>;

interface FakeSupabaseOptions {
  usersByToken: Record<string, FakeAuthUser>;
  profiles: FakeProfileRow[];
  categories?: FakeCategoryRow[];
  products?: FakeProductRow[];
  cartItems?: FakeCartItemRow[];
  orders?: FakeOrderRow[];
  orderItems?: FakeOrderItemRow[];
  payments?: FakePaymentRow[];
  rpc?: Record<
    string,
    (params: Record<string, unknown>) => {
      data: unknown;
      error: { code?: string; message: string } | null;
    }
  >;
}

interface FakeResult<T> {
  data: T;
  error: { code?: string; message: string } | null;
}

/** Minimal stand-in for supabase-js's PostgrestFilterBuilder — thenable, chainable. */
class FakeQueryBuilder implements PromiseLike<FakeResult<any>> {
  private filters: Array<(row: Row) => boolean> = [];
  private orderSpec: { column: string; ascending: boolean } | null = null;
  private mutation:
    | { type: "insert"; rows: Row[] }
    | { type: "update"; patch: Row }
    | { type: "delete" }
    | null = null;
  private wantSingle: "single" | "maybeSingle" | null = null;

  constructor(private table: Row[]) {}

  select(_columns?: string) {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  ilike(column: string, pattern: string) {
    const term = pattern.replace(/^%+|%+$/g, "").toLowerCase();
    this.filters.push((row) => String(row[column] ?? "").toLowerCase().includes(term));
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  order(column: string, opts: { ascending: boolean }) {
    this.orderSpec = { column, ascending: opts.ascending };
    return this;
  }

  insert(rows: Row | Row[]) {
    this.mutation = { type: "insert", rows: Array.isArray(rows) ? rows : [rows] };
    return this;
  }

  update(patch: Row) {
    this.mutation = { type: "update", patch };
    return this;
  }

  delete() {
    this.mutation = { type: "delete" };
    return this;
  }

  single() {
    this.wantSingle = "single";
    return this;
  }

  maybeSingle() {
    this.wantSingle = "maybeSingle";
    return this;
  }

  private matching(): Row[] {
    return this.table.filter((row) => this.filters.every((f) => f(row)));
  }

  private finish(rows: Row[]): FakeResult<any> {
    if (this.wantSingle === "single") {
      if (rows.length === 0) {
        return {
          data: null,
          error: { code: "PGRST116", message: "The result contains 0 rows" },
        };
      }
      return { data: rows[0], error: null };
    }
    if (this.wantSingle === "maybeSingle") {
      return { data: rows[0] ?? null, error: null };
    }
    return { data: rows, error: null };
  }

  private execute(): FakeResult<any> {
    const now = new Date().toISOString();

    if (this.mutation?.type === "insert") {
      const created = this.mutation.rows.map((partial) => {
        const row: Row = { id: randomUUID(), created_at: now, ...partial };
        this.table.push(row);
        return row;
      });
      return this.finish(created);
    }

    if (this.mutation?.type === "update") {
      const { patch } = this.mutation;
      const targets = this.matching();
      targets.forEach((row) => Object.assign(row, patch));
      return this.finish(targets);
    }

    if (this.mutation?.type === "delete") {
      const targets = this.matching();
      targets.forEach((row) => {
        const idx = this.table.indexOf(row);
        if (idx !== -1) this.table.splice(idx, 1);
      });
      return this.finish(targets);
    }

    let rows = this.matching();
    if (this.orderSpec) {
      const { column, ascending } = this.orderSpec;
      rows = [...rows].sort((a, b) => {
        const av = a[column];
        const bv = b[column];
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return ascending ? cmp : -cmp;
      });
    }
    return this.finish(rows);
  }

  then<TResult1 = FakeResult<any>, TResult2 = never>(
    onfulfilled?: ((value: FakeResult<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }
}

export function createFakeSupabaseClient(options: FakeSupabaseOptions) {
  const { usersByToken } = options;

  const tables: Record<string, Row[]> = {
    profiles: options.profiles,
    categories: options.categories ?? [],
    products: options.products ?? [],
    cart_items: options.cartItems ?? [],
    orders: options.orders ?? [],
    order_items: options.orderItems ?? [],
    payments: options.payments ?? [],
  };

  function from(tableName: string) {
    const table = tables[tableName];
    if (!table) {
      throw new Error(`FakeSupabaseClient: unsupported table "${tableName}"`);
    }
    return {
      select: (columns?: string) => new FakeQueryBuilder(table).select(columns),
      insert: (rows: Row | Row[]) => new FakeQueryBuilder(table).insert(rows),
      update: (patch: Row) => new FakeQueryBuilder(table).update(patch),
      delete: () => new FakeQueryBuilder(table).delete(),
    };
  }

  return {
    from,
    async rpc(name: string, params: Record<string, unknown>) {
      const handler = (options.rpc ?? {})[name];
      if (!handler) {
        throw new Error(`FakeSupabaseClient: no rpc handler configured for "${name}"`);
      }
      return handler(params);
    },
    storage: {
      from(bucket: string) {
        return {
          async upload(path: string, _body: unknown, _opts?: unknown) {
            return { data: { path }, error: null };
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: `https://fake-storage.test/${bucket}/${path}` } };
          },
        };
      },
    },
    auth: {
      async getUser(token: string) {
        const user = usersByToken[token];
        if (!user) {
          return { data: { user: null }, error: { message: "Invalid token" } };
        }
        return { data: { user }, error: null };
      },
      admin: {
        async getUserById(id: string) {
          const user = Object.values(usersByToken).find((u) => u.id === id);
          if (!user) {
            return { data: { user: null }, error: { message: "User not found" } };
          }
          return { data: { user }, error: null };
        },
        async updateUserById(id: string, patch: { app_metadata?: Record<string, unknown> }) {
          const user = Object.values(usersByToken).find((u) => u.id === id);
          if (!user) {
            return { data: { user: null }, error: { message: "User not found" } };
          }
          if (patch.app_metadata) {
            user.app_metadata = { ...user.app_metadata, ...patch.app_metadata };
          }
          return { data: { user }, error: null };
        },
        async listUsers() {
          return { data: { users: Object.values(usersByToken) }, error: null };
        },
      },
    },
  };
}
