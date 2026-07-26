# Royal Bakery Backend — Cart & Orders API Implementation Plan

Design doc: `docs/superpowers/specs/2026-07-26-cart-orders-api-design.md`

Same TDD structure as Modules 1–2: each task writes a failing test, confirms it
fails, implements, confirms it passes, stages. `cd server` is assumed for every
command block.

## Global constraints

- Same conventions as every prior backend module: `.js` import extensions,
  `{ error: { message } }` error shape, every thrown service error is an
  `AppError` with an explicit status, `PGRST116` → 404 on `.single()`.
- `products.price`, `orders.total_amount`, `order_items.unit_price`/`subtotal`
  are all `numeric` — same string→number conversion on read as `catalogService`.
- Two operations (`createOrderFromCart`, cancelling via `updateOrderStatus`)
  call Postgres functions via `.rpc()` instead of plain table calls — see the
  design doc's rationale. Everything else in this module is a plain
  single-table call, same as Modules 1–2.
- `idParamSchema` and the newly-exported `uuidSchema` come from
  `catalogSchemas.ts` (already updated in this branch to export `uuidSchema`)
  — don't redefine the UUID pattern in the new schema files.
- Do not modify `payments`-related anything — out of scope, Module 4.
- Do not run `git commit`/`git push` beyond `git add` staging at the end of
  each task — same standing rule as every prior module.

---

### Task 1: Generalize the fake Supabase client further (new tables, `.in()`, `.rpc()`)

**Files:**
- Modify: `server/src/test/fakeSupabase.ts`
- Modify: `server/src/test/fakeSupabase.test.ts`

**Interfaces:**
- `createFakeSupabaseClient` options gain `cartItems?`, `orders?`, `orderItems?`
  arrays (same pattern as `categories`/`products`), and an `rpc?: Record<string,
  (params: Record<string, unknown>) => { data: unknown; error: { code?: string;
  message: string } | null }>` map — each test configures exactly what a named
  RPC call returns.
- The query builder gains `.in(column, values)` (real Supabase's "WHERE column
  IN (...)" filter) alongside the existing `.eq()`/`.ilike()`.
- The client gains `async rpc(name, params)` — looks up `name` in the
  configured `rpc` map and calls it with `params`; throws if the test didn't
  configure a handler for that name (fail loud, not silent).

- [ ] **Step 1: Add failing tests to `fakeSupabase.test.ts`**

Append these two `describe` blocks (keep everything already in the file):

```ts
describe("createFakeSupabaseClient — .in() filter", () => {
  it("matches any row whose column value is in the given list", async () => {
    const client = createFakeSupabaseClient({
      usersByToken: {},
      profiles: [],
      products: [
        { id: "1", category_id: null, name: "A", description: null, price: "1", image_url: null, stock_quantity: 1, is_available: true, created_at: "t", updated_at: "t" },
        { id: "2", category_id: null, name: "B", description: null, price: "1", image_url: null, stock_quantity: 1, is_available: true, created_at: "t", updated_at: "t" },
        { id: "3", category_id: null, name: "C", description: null, price: "1", image_url: null, stock_quantity: 1, is_available: true, created_at: "t", updated_at: "t" },
      ],
    });

    const { data } = await client.from("products").select("*").in("id", ["1", "3"]);
    expect((data as any[]).map((p) => p.id).sort()).toEqual(["1", "3"]);
  });
});

describe("createFakeSupabaseClient — .rpc() mock", () => {
  it("calls the configured handler with the given params", async () => {
    const client = createFakeSupabaseClient({
      usersByToken: {},
      profiles: [],
      rpc: {
        do_thing: (params) => ({ data: { received: params }, error: null }),
      },
    });

    const { data, error } = await client.rpc("do_thing", { foo: "bar" });
    expect(error).toBeNull();
    expect(data).toEqual({ received: { foo: "bar" } });
  });

  it("throws if no handler is configured for the given name", async () => {
    const client = createFakeSupabaseClient({ usersByToken: {}, profiles: [] });
    await expect(client.rpc("unconfigured", {})).rejects.toThrow(/no rpc handler/);
  });
});
```

- [ ] **Step 2: Confirm it fails**

```bash
cd server
npm run test -- fakeSupabase
```

Expected: FAIL — `.in` is not a function, `.rpc` is not a function.

- [ ] **Step 3: Implement**

In `server/src/test/fakeSupabase.ts`:

Add these exported row types near the existing `FakeCategoryRow`/`FakeProductRow`:

```ts
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
```

Add `.in()` to the `FakeQueryBuilder` class, alongside `eq`/`ilike`:

```ts
  in(column: string, values: unknown[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }
```

Update `FakeSupabaseOptions` to add the new table arrays and `rpc`:

```ts
interface FakeSupabaseOptions {
  usersByToken: Record<string, FakeAuthUser>;
  profiles: FakeProfileRow[];
  categories?: FakeCategoryRow[];
  products?: FakeProductRow[];
  cartItems?: FakeCartItemRow[];
  orders?: FakeOrderRow[];
  orderItems?: FakeOrderItemRow[];
  rpc?: Record<
    string,
    (params: Record<string, unknown>) => {
      data: unknown;
      error: { code?: string; message: string } | null;
    }
  >;
}
```

Update the `tables` map inside `createFakeSupabaseClient`:

```ts
  const tables: Record<string, Row[]> = {
    profiles: options.profiles,
    categories: options.categories ?? [],
    products: options.products ?? [],
    cart_items: options.cartItems ?? [],
    orders: options.orders ?? [],
    order_items: options.orderItems ?? [],
  };
```

Add `rpc` to the returned client object (alongside `from`, `storage`, `auth`):

```ts
    async rpc(name: string, params: Record<string, unknown>) {
      const handler = (options.rpc ?? {})[name];
      if (!handler) {
        throw new Error(`FakeSupabaseClient: no rpc handler configured for "${name}"`);
      }
      return handler(params);
    },
```

- [ ] **Step 4: Confirm it passes**

```bash
cd server
npm run test -- fakeSupabase
```

Expected: PASS.

- [ ] **Step 5: Run the entire existing suite to confirm zero regressions**

```bash
cd server
npm run test
```

Expected: PASS — everything from Modules 1–2 (90 tests) still green, unmodified.

- [ ] **Step 6: Stage**

```bash
git add server/src/test
```

---

### Task 2: Cart types and service

**Files:**
- Create: `server/src/types/cart.ts`
- Create: `server/src/services/cartService.ts`
- Test: `server/src/services/cartService.test.ts`

- [ ] **Step 1: Add the domain types**

Create `server/src/types/cart.ts`:

```ts
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  subtotal: number;
  stockQuantity: number;
  isAvailable: boolean;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
}
```

- [ ] **Step 2: Write the failing test**

Create `server/src/services/cartService.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  setCartItemQuantity,
} from "./cartService.js";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "99999999-9999-9999-9999-999999999999";
const PRODUCT_A = "22222222-2222-2222-2222-222222222222";
const PRODUCT_B = "33333333-3333-3333-3333-333333333333";

function seed() {
  return createFakeSupabaseClient({
    usersByToken: {},
    profiles: [],
    products: [
      {
        id: PRODUCT_A,
        category_id: null,
        name: "Croissant",
        description: null,
        price: "380.00",
        image_url: null,
        stock_quantity: 5,
        is_available: true,
        created_at: "t",
        updated_at: "t",
      },
      {
        id: PRODUCT_B,
        category_id: null,
        name: "Sold Out Bread",
        description: null,
        price: "300.00",
        image_url: null,
        stock_quantity: 0,
        is_available: false,
        created_at: "t",
        updated_at: "t",
      },
    ],
    cartItems: [
      { id: "c1", user_id: USER_ID, product_id: PRODUCT_A, quantity: 2, created_at: "t" },
      { id: "c2", user_id: OTHER_USER_ID, product_id: PRODUCT_A, quantity: 9, created_at: "t" },
    ],
  });
}

beforeEach(() => {
  vi.mocked(getSupabaseAdmin).mockReturnValue(seed() as any);
});

describe("getCart", () => {
  it("returns only the given user's items with a computed subtotal", async () => {
    const cart = await getCart(USER_ID);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].name).toBe("Croissant");
    expect(cart.items[0].subtotal).toBe(760);
    expect(cart.subtotal).toBe(760);
  });

  it("returns an empty cart for a user with no items", async () => {
    const cart = await getCart("no-such-user");
    expect(cart).toEqual({ items: [], subtotal: 0 });
  });
});

describe("addToCart", () => {
  it("adds a new item", async () => {
    const cart = await addToCart(OTHER_USER_ID === USER_ID ? USER_ID : USER_ID, PRODUCT_A, 1);
    expect(cart.items.find((i) => i.productId === PRODUCT_A)?.quantity).toBe(3);
  });

  it("increases quantity if already in the cart", async () => {
    const cart = await addToCart(USER_ID, PRODUCT_A, 1);
    expect(cart.items[0].quantity).toBe(3);
  });

  it("throws a 404 AppError for an unknown product", async () => {
    await expect(addToCart(USER_ID, "no-such-product", 1)).rejects.toMatchObject({ status: 404 });
  });

  it("throws a 404 AppError for an unavailable product", async () => {
    await expect(addToCart(USER_ID, PRODUCT_B, 1)).rejects.toMatchObject({ status: 404 });
  });

  it("throws a 409 AppError when the requested quantity exceeds stock", async () => {
    await expect(addToCart(USER_ID, PRODUCT_A, 10)).rejects.toMatchObject({ status: 409 });
  });
});

describe("setCartItemQuantity", () => {
  it("sets the exact quantity", async () => {
    const cart = await setCartItemQuantity(USER_ID, PRODUCT_A, 5);
    expect(cart.items[0].quantity).toBe(5);
  });

  it("throws a 409 AppError when the quantity exceeds stock", async () => {
    await expect(setCartItemQuantity(USER_ID, PRODUCT_A, 99)).rejects.toMatchObject({ status: 409 });
  });

  it("throws a 404 AppError when the item isn't in the cart", async () => {
    await expect(setCartItemQuantity(USER_ID, PRODUCT_B, 1)).rejects.toMatchObject({ status: 404 });
  });
});

describe("removeCartItem / clearCart", () => {
  it("removes a single item", async () => {
    const cart = await removeCartItem(USER_ID, PRODUCT_A);
    expect(cart.items).toHaveLength(0);
  });

  it("clears the whole cart", async () => {
    await expect(clearCart(USER_ID)).resolves.toBeUndefined();
    const cart = await getCart(USER_ID);
    expect(cart.items).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Confirm it fails**

```bash
cd server
npm run test -- cartService
```

Expected: FAIL — `Cannot find module './cartService.js'`.

- [ ] **Step 4: Implement**

Create `server/src/services/cartService.ts`:

```ts
import { getSupabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../errors.js";
import type { Cart, CartItem } from "../types/cart.js";

interface CartItemRow {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

interface ProductRow {
  id: string;
  name: string;
  price: string;
  image_url: string | null;
  stock_quantity: number;
  is_available: boolean;
}

function mapCartItem(cartRow: CartItemRow, product: ProductRow): CartItem {
  const price = Number(product.price);
  return {
    productId: product.id,
    name: product.name,
    price,
    imageUrl: product.image_url,
    quantity: cartRow.quantity,
    subtotal: price * cartRow.quantity,
    stockQuantity: product.stock_quantity,
    isAvailable: product.is_available,
  };
}

export async function getCart(userId: string): Promise<Cart> {
  const { data: cartRows, error } = await getSupabaseAdmin()
    .from("cart_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw new AppError(500, "Failed to load cart", { cause: error });

  const rows = cartRows as CartItemRow[];
  const productIds = rows.map((r) => r.product_id);

  const products = new Map<string, ProductRow>();
  if (productIds.length > 0) {
    const { data: productRows, error: prodError } = await getSupabaseAdmin()
      .from("products")
      .select("*")
      .in("id", productIds);
    if (prodError) throw new AppError(500, "Failed to load cart products", { cause: prodError });
    for (const row of productRows as ProductRow[]) {
      products.set(row.id, row);
    }
  }

  const items = rows
    .map((row) => {
      const product = products.get(row.product_id);
      return product ? mapCartItem(row, product) : null;
    })
    .filter((item): item is CartItem => item !== null);

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  return { items, subtotal };
}

export async function addToCart(
  userId: string,
  productId: string,
  quantity: number
): Promise<Cart> {
  const { data: product, error: productError } = await getSupabaseAdmin()
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();
  if (productError) throw new AppError(500, "Failed to load product", { cause: productError });
  if (!product || !(product as ProductRow).is_available) {
    throw new AppError(404, "Product not found");
  }

  const { data: existing, error: existingError } = await getSupabaseAdmin()
    .from("cart_items")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  if (existingError) throw new AppError(500, "Failed to load cart item", { cause: existingError });

  const newQuantity = ((existing as CartItemRow | null)?.quantity ?? 0) + quantity;
  if (newQuantity > (product as ProductRow).stock_quantity) {
    throw new AppError(
      409,
      `Only ${(product as ProductRow).stock_quantity} of "${(product as ProductRow).name}" left in stock`
    );
  }

  if (existing) {
    const { error } = await getSupabaseAdmin()
      .from("cart_items")
      .update({ quantity: newQuantity })
      .eq("id", (existing as CartItemRow).id);
    if (error) throw new AppError(500, "Failed to update cart item", { cause: error });
  } else {
    const { error } = await getSupabaseAdmin()
      .from("cart_items")
      .insert({ user_id: userId, product_id: productId, quantity: newQuantity });
    if (error) throw new AppError(500, "Failed to add cart item", { cause: error });
  }

  return getCart(userId);
}

export async function setCartItemQuantity(
  userId: string,
  productId: string,
  quantity: number
): Promise<Cart> {
  const { data: product, error: productError } = await getSupabaseAdmin()
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();
  if (productError) throw new AppError(500, "Failed to load product", { cause: productError });
  if (!product) throw new AppError(404, "Product not found");
  if (quantity > (product as ProductRow).stock_quantity) {
    throw new AppError(
      409,
      `Only ${(product as ProductRow).stock_quantity} of "${(product as ProductRow).name}" left in stock`
    );
  }

  const { data, error } = await getSupabaseAdmin()
    .from("cart_items")
    .update({ quantity })
    .eq("user_id", userId)
    .eq("product_id", productId)
    .select("*")
    .maybeSingle();
  if (error) throw new AppError(500, "Failed to update cart item", { cause: error });
  if (!data) throw new AppError(404, "Item not in cart");

  return getCart(userId);
}

export async function removeCartItem(userId: string, productId: string): Promise<Cart> {
  const { error } = await getSupabaseAdmin()
    .from("cart_items")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);
  if (error) throw new AppError(500, "Failed to remove cart item", { cause: error });
  return getCart(userId);
}

export async function clearCart(userId: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("cart_items")
    .delete()
    .eq("user_id", userId);
  if (error) throw new AppError(500, "Failed to clear cart", { cause: error });
}
```

- [ ] **Step 5: Confirm it passes**

```bash
cd server
npm run test -- cartService
```

Expected: PASS (11 tests).

- [ ] **Step 6: Stage**

```bash
git add server/src/types/cart.ts server/src/services/cartService.ts server/src/services/cartService.test.ts
```

---

### Task 3: Order types and service

**Files:**
- Create: `server/src/types/order.ts`
- Create: `server/src/services/orderService.ts`
- Test: `server/src/services/orderService.test.ts`

- [ ] **Step 1: Add the domain types**

Create `server/src/types/order.ts`:

```ts
export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded";

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  deliveryAddress: string | null;
  createdAt: string;
}

export interface Order extends OrderSummary {
  items: OrderItem[];
}
```

- [ ] **Step 2: Write the failing test**

Create `server/src/services/orderService.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import {
  createOrderFromCart,
  getOrderById,
  getOrderForUser,
  listAllOrders,
  listOrdersForUser,
  updateOrderStatus,
} from "./orderService.js";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "99999999-9999-9999-9999-999999999999";
const ORDER_A = "22222222-2222-2222-2222-222222222222";
const ORDER_B = "33333333-3333-3333-3333-333333333333";
const PRODUCT_A = "44444444-4444-4444-4444-444444444444";

function seed(rpc: Record<string, (params: Record<string, unknown>) => any> = {}) {
  return createFakeSupabaseClient({
    usersByToken: {},
    profiles: [],
    products: [
      {
        id: PRODUCT_A,
        category_id: null,
        name: "Croissant",
        description: null,
        price: "380.00",
        image_url: null,
        stock_quantity: 5,
        is_available: true,
        created_at: "t",
        updated_at: "t",
      },
    ],
    orders: [
      {
        id: ORDER_A,
        user_id: USER_ID,
        status: "pending",
        payment_status: "unpaid",
        total_amount: "760.00",
        delivery_address: null,
        created_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
      {
        id: ORDER_B,
        user_id: OTHER_USER_ID,
        status: "completed",
        payment_status: "paid",
        total_amount: "380.00",
        delivery_address: "123 Galle Road",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ],
    orderItems: [
      { id: "oi1", order_id: ORDER_A, product_id: PRODUCT_A, quantity: 2, unit_price: "380.00", subtotal: "760.00" },
    ],
    rpc,
  });
}

describe("listOrdersForUser / getOrderForUser", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(seed() as any);
  });

  it("returns only the given user's orders", async () => {
    const orders = await listOrdersForUser(USER_ID);
    expect(orders.map((o) => o.id)).toEqual([ORDER_A]);
    expect(orders[0].totalAmount).toBe(760);
  });

  it("returns an order with its items for the owning user", async () => {
    const order = await getOrderForUser(USER_ID, ORDER_A);
    expect(order?.items).toEqual([
      { productId: PRODUCT_A, name: "Croissant", quantity: 2, unitPrice: 380, subtotal: 760 },
    ]);
  });

  it("returns null for another user's order", async () => {
    const order = await getOrderForUser(USER_ID, ORDER_B);
    expect(order).toBeNull();
  });

  it("returns null for an unknown order", async () => {
    const order = await getOrderForUser(USER_ID, "99999999-0000-0000-0000-000000000000");
    expect(order).toBeNull();
  });
});

describe("listAllOrders / getOrderById (admin)", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(seed() as any);
  });

  it("lists every order regardless of owner", async () => {
    const orders = await listAllOrders();
    expect(orders.map((o) => o.id).sort()).toEqual([ORDER_A, ORDER_B].sort());
  });

  it("filters by status", async () => {
    const orders = await listAllOrders({ status: "completed" });
    expect(orders.map((o) => o.id)).toEqual([ORDER_B]);
  });

  it("fetches any order by id with no ownership check", async () => {
    const order = await getOrderById(ORDER_B);
    expect(order?.deliveryAddress).toBe("123 Galle Road");
  });
});

describe("createOrderFromCart", () => {
  it("maps a successful rpc call to the created order", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      seed({
        create_order_from_cart: () => ({ data: ORDER_A, error: null }),
      }) as any
    );

    const order = await createOrderFromCart(USER_ID, "123 Galle Road");
    expect(order.id).toBe(ORDER_A);
    expect(order.items).toHaveLength(1);
  });

  it("maps a P0001 rpc error to a 400 AppError", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      seed({
        create_order_from_cart: () => ({
          data: null,
          error: { code: "P0001", message: "Cart is empty" },
        }),
      }) as any
    );

    await expect(createOrderFromCart(USER_ID)).rejects.toMatchObject({ status: 400 });
  });

  it("maps a P0002 rpc error to a 409 AppError", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      seed({
        create_order_from_cart: () => ({
          data: null,
          error: { code: "P0002", message: 'Insufficient stock for product "Croissant"' },
        }),
      }) as any
    );

    await expect(createOrderFromCart(USER_ID)).rejects.toMatchObject({ status: 409 });
  });
});

describe("updateOrderStatus", () => {
  it("updates status via a plain update for non-cancel transitions", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(seed() as any);
    const order = await updateOrderStatus(ORDER_A, "processing");
    expect(order.status).toBe("processing");
  });

  it("throws a 404 AppError updating an unknown order", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(seed() as any);
    await expect(
      updateOrderStatus("99999999-0000-0000-0000-000000000000", "processing")
    ).rejects.toMatchObject({ status: 404 });
  });

  it("calls the cancel_order rpc when cancelling", async () => {
    let called: unknown = null;
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      seed({
        cancel_order: (params) => {
          called = params;
          return { data: null, error: null };
        },
      }) as any
    );

    const order = await updateOrderStatus(ORDER_A, "cancelled");
    expect(called).toEqual({ p_order_id: ORDER_A });
    // The fake rpc handler doesn't mutate the underlying orders row, so the
    // status read back afterward is still the seed value -- this test only
    // proves the rpc was invoked with the right id, not the SQL side effects
    // (those are covered by the live-Supabase verification task).
    expect(order.id).toBe(ORDER_A);
  });

  it("maps a P0003 rpc error to a 409 AppError", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      seed({
        cancel_order: () => ({
          data: null,
          error: { code: "P0003", message: "Order cannot be cancelled" },
        }),
      }) as any
    );

    await expect(updateOrderStatus(ORDER_A, "cancelled")).rejects.toMatchObject({ status: 409 });
  });
});
```

- [ ] **Step 3: Confirm it fails**

```bash
cd server
npm run test -- orderService
```

Expected: FAIL — `Cannot find module './orderService.js'`.

- [ ] **Step 4: Implement**

Create `server/src/services/orderService.ts`:

```ts
import { getSupabaseAdmin } from "../lib/supabase.js";
import { AppError } from "../errors.js";
import type { Order, OrderItem, OrderStatus, OrderSummary, PaymentStatus } from "../types/order.js";

interface OrderRow {
  id: string;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: string;
  delivery_address: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

function mapOrderSummary(row: OrderRow): OrderSummary {
  return {
    id: row.id,
    status: row.status,
    paymentStatus: row.payment_status,
    totalAmount: Number(row.total_amount),
    deliveryAddress: row.delivery_address,
    createdAt: row.created_at,
  };
}

async function loadOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data: itemRows, error } = await getSupabaseAdmin()
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);
  if (error) throw new AppError(500, "Failed to load order items", { cause: error });

  const rows = itemRows as OrderItemRow[];
  const productIds = rows.map((r) => r.product_id);

  const productNames = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: products, error: prodError } = await getSupabaseAdmin()
      .from("products")
      .select("*")
      .in("id", productIds);
    if (prodError) throw new AppError(500, "Failed to load order products", { cause: prodError });
    for (const p of products as { id: string; name: string }[]) {
      productNames.set(p.id, p.name);
    }
  }

  return rows.map((row) => ({
    productId: row.product_id,
    name: productNames.get(row.product_id) ?? "Unknown product",
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    subtotal: Number(row.subtotal),
  }));
}

export async function createOrderFromCart(
  userId: string,
  deliveryAddress?: string
): Promise<Order> {
  const { data: orderId, error } = await getSupabaseAdmin().rpc("create_order_from_cart", {
    p_user_id: userId,
    p_delivery_address: deliveryAddress ?? null,
  });

  if (error) {
    if (error.code === "P0001") throw new AppError(400, "Cart is empty");
    if (error.code === "P0002") throw new AppError(409, error.message);
    throw new AppError(500, "Failed to create order", { cause: error });
  }

  const order = await getOrderById(orderId as string);
  if (!order) throw new AppError(500, "Order was created but could not be loaded");
  return order;
}

export async function listOrdersForUser(userId: string): Promise<OrderSummary[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new AppError(500, "Failed to list orders", { cause: error });
  return (data as OrderRow[]).map(mapOrderSummary);
}

export async function getOrderForUser(userId: string, orderId: string): Promise<Order | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new AppError(500, "Failed to load order", { cause: error });
  if (!data) return null;
  const items = await loadOrderItems(orderId);
  return { ...mapOrderSummary(data as OrderRow), items };
}

export async function listAllOrders(filters: { status?: string } = {}): Promise<OrderSummary[]> {
  let query = getSupabaseAdmin().from("orders").select("*");
  if (filters.status) query = query.eq("status", filters.status);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw new AppError(500, "Failed to list orders", { cause: error });
  return (data as OrderRow[]).map(mapOrderSummary);
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new AppError(500, "Failed to load order", { cause: error });
  if (!data) return null;
  const items = await loadOrderItems(orderId);
  return { ...mapOrderSummary(data as OrderRow), items };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const existing = await getOrderById(orderId);
  if (!existing) throw new AppError(404, "Order not found");

  if (status === "cancelled") {
    const { error } = await getSupabaseAdmin().rpc("cancel_order", { p_order_id: orderId });
    if (error) {
      if (error.code === "P0003") throw new AppError(409, "Order cannot be cancelled");
      throw new AppError(500, "Failed to cancel order", { cause: error });
    }
  } else {
    const { error } = await getSupabaseAdmin()
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) throw new AppError(500, "Failed to update order status", { cause: error });
  }

  const order = await getOrderById(orderId);
  if (!order) throw new AppError(404, "Order not found");
  return order;
}
```

- [ ] **Step 5: Confirm it passes**

```bash
cd server
npm run test -- orderService
```

Expected: PASS (14 tests).

- [ ] **Step 6: Stage**

```bash
git add server/src/types/order.ts server/src/services/orderService.ts server/src/services/orderService.test.ts
```

---

### Task 4: Validation schemas

**Files:**
- Modify: `server/src/validation/catalogSchemas.ts` (export `uuidSchema` — already done as part of this branch's setup)
- Create: `server/src/validation/cartSchemas.ts`
- Create: `server/src/validation/orderSchemas.ts`
- Test: `server/src/validation/cartSchemas.test.ts`
- Test: `server/src/validation/orderSchemas.test.ts`

- [ ] **Step 1: Confirm `uuidSchema` is exported**

`server/src/validation/catalogSchemas.ts` should already have `export const uuidSchema = ...` (changed from a bare `const` — this was done when this branch was created, before Task 1). If it's still a bare `const`, add `export` now.

- [ ] **Step 2: Write the failing tests**

Create `server/src/validation/cartSchemas.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  addCartItemSchema,
  productIdParamSchema,
  updateCartItemQuantitySchema,
} from "./cartSchemas.js";

describe("addCartItemSchema", () => {
  it("accepts a valid body", () => {
    expect(
      addCartItemSchema.safeParse({
        productId: "11111111-1111-1111-1111-111111111111",
        quantity: 2,
      }).success
    ).toBe(true);
  });
  it("rejects quantity 0", () => {
    expect(
      addCartItemSchema.safeParse({
        productId: "11111111-1111-1111-1111-111111111111",
        quantity: 0,
      }).success
    ).toBe(false);
  });
  it("rejects a non-integer quantity", () => {
    expect(
      addCartItemSchema.safeParse({
        productId: "11111111-1111-1111-1111-111111111111",
        quantity: 1.5,
      }).success
    ).toBe(false);
  });
});

describe("updateCartItemQuantitySchema", () => {
  it("rejects a missing quantity", () => {
    expect(updateCartItemQuantitySchema.safeParse({}).success).toBe(false);
  });
});

describe("productIdParamSchema", () => {
  it("rejects a non-uuid productId", () => {
    expect(productIdParamSchema.safeParse({ productId: "nope" }).success).toBe(false);
  });
});
```

Create `server/src/validation/orderSchemas.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  createOrderSchema,
  orderStatusQuerySchema,
  updateOrderStatusSchema,
} from "./orderSchemas.js";

describe("createOrderSchema", () => {
  it("accepts an empty body (pickup)", () => {
    expect(createOrderSchema.safeParse({}).success).toBe(true);
  });
  it("accepts a delivery address", () => {
    expect(createOrderSchema.safeParse({ deliveryAddress: "123 Galle Road" }).success).toBe(true);
  });
  it("rejects an empty-string delivery address", () => {
    expect(createOrderSchema.safeParse({ deliveryAddress: "" }).success).toBe(false);
  });
});

describe("updateOrderStatusSchema", () => {
  it("accepts a valid status", () => {
    expect(updateOrderStatusSchema.safeParse({ status: "processing" }).success).toBe(true);
  });
  it("rejects an invalid status", () => {
    expect(updateOrderStatusSchema.safeParse({ status: "shipped" }).success).toBe(false);
  });
});

describe("orderStatusQuerySchema", () => {
  it("accepts no query params", () => {
    expect(orderStatusQuerySchema.safeParse({}).success).toBe(true);
  });
});
```

- [ ] **Step 3: Confirm they fail**

```bash
cd server
npm run test -- cartSchemas orderSchemas
```

Expected: FAIL — modules don't exist yet.

- [ ] **Step 4: Implement**

Create `server/src/validation/cartSchemas.ts`:

```ts
import { z } from "zod";
import { uuidSchema } from "./catalogSchemas.js";

export const addCartItemSchema = z.object({
  productId: uuidSchema,
  quantity: z.number().int().min(1),
});
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

export const updateCartItemQuantitySchema = z.object({
  quantity: z.number().int().min(1),
});
export type UpdateCartItemQuantityInput = z.infer<typeof updateCartItemQuantitySchema>;

export const productIdParamSchema = z.object({
  productId: uuidSchema,
});
```

Create `server/src/validation/orderSchemas.ts`:

```ts
import { z } from "zod";

export const orderStatuses = ["pending", "processing", "completed", "cancelled"] as const;

export const createOrderSchema = z.object({
  deliveryAddress: z.string().trim().min(1).max(500).optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatuses),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const orderStatusQuerySchema = z.object({
  status: z.enum(orderStatuses).optional(),
});
export type OrderStatusQuery = z.infer<typeof orderStatusQuerySchema>;
```

- [ ] **Step 5: Confirm they pass**

```bash
cd server
npm run test -- cartSchemas orderSchemas
```

Expected: PASS (9 tests).

- [ ] **Step 6: Stage**

```bash
git add server/src/validation
```

---

### Task 5: Cart routes

**Files:**
- Create: `server/src/routes/cart.ts`
- Test: `server/src/routes/cart.test.ts`
- Modify: `server/src/routes/index.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/routes/cart.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import { createApp } from "../app.js";

const CUSTOMER_ID = "11111111-1111-1111-1111-111111111111";
const PRODUCT_ID = "22222222-2222-2222-2222-222222222222";

function makeClient() {
  return createFakeSupabaseClient({
    usersByToken: {
      "customer-token": { id: CUSTOMER_ID, email: "cust@example.com", app_metadata: { role: "customer" } },
    },
    profiles: [],
    products: [
      {
        id: PRODUCT_ID,
        category_id: null,
        name: "Croissant",
        description: null,
        price: "380.00",
        image_url: null,
        stock_quantity: 5,
        is_available: true,
        created_at: "t",
        updated_at: "t",
      },
    ],
    cartItems: [],
  });
}

beforeEach(() => {
  vi.mocked(getSupabaseAdmin).mockReturnValue(makeClient() as any);
});

describe("cart routes", () => {
  it("requires auth", async () => {
    const app = createApp();
    const res = await request(app).get("/api/cart");
    expect(res.status).toBe(401);
  });

  it("returns an empty cart initially", async () => {
    const app = createApp();
    const res = await request(app).get("/api/cart").set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(200);
    expect(res.body.cart).toEqual({ items: [], subtotal: 0 });
  });

  it("adds an item to the cart", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", "Bearer customer-token")
      .send({ productId: PRODUCT_ID, quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.cart.items[0].quantity).toBe(2);
  });

  it("rejects adding more than available stock", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/cart")
      .set("Authorization", "Bearer customer-token")
      .send({ productId: PRODUCT_ID, quantity: 99 });
    expect(res.status).toBe(409);
  });

  it("updates an item's quantity", async () => {
    const app = createApp();
    await request(app)
      .post("/api/cart")
      .set("Authorization", "Bearer customer-token")
      .send({ productId: PRODUCT_ID, quantity: 1 });
    const res = await request(app)
      .put(`/api/cart/${PRODUCT_ID}`)
      .set("Authorization", "Bearer customer-token")
      .send({ quantity: 3 });
    expect(res.status).toBe(200);
    expect(res.body.cart.items[0].quantity).toBe(3);
  });

  it("removes an item", async () => {
    const app = createApp();
    await request(app)
      .post("/api/cart")
      .set("Authorization", "Bearer customer-token")
      .send({ productId: PRODUCT_ID, quantity: 1 });
    const res = await request(app)
      .delete(`/api/cart/${PRODUCT_ID}`)
      .set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(200);
    expect(res.body.cart.items).toHaveLength(0);
  });

  it("clears the cart", async () => {
    const app = createApp();
    await request(app)
      .post("/api/cart")
      .set("Authorization", "Bearer customer-token")
      .send({ productId: PRODUCT_ID, quantity: 1 });
    const res = await request(app)
      .delete("/api/cart")
      .set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(200);
    expect(res.body.cart).toEqual({ items: [], subtotal: 0 });
  });
});
```

- [ ] **Step 2: Confirm it fails**

```bash
cd server
npm run test -- routes/cart
```

Expected: FAIL — module/route doesn't exist yet.

- [ ] **Step 3: Implement**

Create `server/src/routes/cart.ts`:

```ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  setCartItemQuantity,
} from "../services/cartService.js";
import {
  addCartItemSchema,
  productIdParamSchema,
  updateCartItemQuantitySchema,
} from "../validation/cartSchemas.js";

export const cartRouter = Router();

cartRouter.use(requireAuth);

cartRouter.get("/cart", async (req, res, next) => {
  try {
    res.json({ cart: await getCart(req.user!.id) });
  } catch (err) {
    next(err);
  }
});

cartRouter.post("/cart", async (req, res, next) => {
  const parsed = addCartItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: { message: parsed.error.issues[0]?.message ?? "Invalid request" },
    });
    return;
  }

  try {
    const cart = await addToCart(req.user!.id, parsed.data.productId, parsed.data.quantity);
    res.status(201).json({ cart });
  } catch (err) {
    next(err);
  }
});

cartRouter.put("/cart/:productId", async (req, res, next) => {
  const paramsParsed = productIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: { message: "Invalid product id" } });
    return;
  }
  const parsed = updateCartItemQuantitySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: { message: parsed.error.issues[0]?.message ?? "Invalid request" },
    });
    return;
  }

  try {
    const cart = await setCartItemQuantity(
      req.user!.id,
      paramsParsed.data.productId,
      parsed.data.quantity
    );
    res.json({ cart });
  } catch (err) {
    next(err);
  }
});

cartRouter.delete("/cart/:productId", async (req, res, next) => {
  const paramsParsed = productIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: { message: "Invalid product id" } });
    return;
  }

  try {
    const cart = await removeCartItem(req.user!.id, paramsParsed.data.productId);
    res.json({ cart });
  } catch (err) {
    next(err);
  }
});

cartRouter.delete("/cart", async (req, res, next) => {
  try {
    await clearCart(req.user!.id);
    res.json({ cart: { items: [], subtotal: 0 } });
  } catch (err) {
    next(err);
  }
});
```

- [ ] **Step 4: Wire into `routes/index.ts`**

Add the import and `apiRouter.use(cartRouter);` line to `server/src/routes/index.ts` (append to the existing imports and `.use()` calls — don't remove anything already there).

- [ ] **Step 5: Confirm it passes, then run the full suite**

```bash
cd server
npm run test -- routes/cart
npm run test
```

Expected: both PASS.

- [ ] **Step 6: Stage**

```bash
git add server/src/routes/cart.ts server/src/routes/cart.test.ts server/src/routes/index.ts
```

---

### Task 6: Customer order routes

**Files:**
- Create: `server/src/routes/orders.ts`
- Test: `server/src/routes/orders.test.ts`
- Modify: `server/src/routes/index.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/routes/orders.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import { createApp } from "../app.js";

const CUSTOMER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_CUSTOMER_ID = "99999999-9999-9999-9999-999999999999";
const ORDER_ID = "22222222-2222-2222-2222-222222222222";
const OTHER_ORDER_ID = "33333333-3333-3333-3333-333333333333";
const PRODUCT_ID = "44444444-4444-4444-4444-444444444444";

function makeClient(rpc: Record<string, (params: Record<string, unknown>) => any> = {}) {
  return createFakeSupabaseClient({
    usersByToken: {
      "customer-token": { id: CUSTOMER_ID, email: "cust@example.com", app_metadata: { role: "customer" } },
    },
    profiles: [],
    products: [
      {
        id: PRODUCT_ID,
        category_id: null,
        name: "Croissant",
        description: null,
        price: "380.00",
        image_url: null,
        stock_quantity: 5,
        is_available: true,
        created_at: "t",
        updated_at: "t",
      },
    ],
    orders: [
      {
        id: ORDER_ID,
        user_id: CUSTOMER_ID,
        status: "pending",
        payment_status: "unpaid",
        total_amount: "760.00",
        delivery_address: null,
        created_at: "t",
        updated_at: "t",
      },
      {
        id: OTHER_ORDER_ID,
        user_id: OTHER_CUSTOMER_ID,
        status: "pending",
        payment_status: "unpaid",
        total_amount: "380.00",
        delivery_address: null,
        created_at: "t",
        updated_at: "t",
      },
    ],
    orderItems: [
      { id: "oi1", order_id: ORDER_ID, product_id: PRODUCT_ID, quantity: 2, unit_price: "380.00", subtotal: "760.00" },
    ],
    rpc,
  });
}

describe("order routes", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(makeClient() as any);
  });

  it("requires auth on every route", async () => {
    const app = createApp();
    expect((await request(app).post("/api/orders")).status).toBe(401);
    expect((await request(app).get("/api/orders")).status).toBe(401);
    expect((await request(app).get(`/api/orders/${ORDER_ID}`)).status).toBe(401);
  });

  it("lists only the caller's own orders", async () => {
    const app = createApp();
    const res = await request(app).get("/api/orders").set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(200);
    expect(res.body.orders.map((o: any) => o.id)).toEqual([ORDER_ID]);
  });

  it("returns 404 for another customer's order", async () => {
    const app = createApp();
    const res = await request(app)
      .get(`/api/orders/${OTHER_ORDER_ID}`)
      .set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(404);
  });

  it("returns the caller's own order with items", async () => {
    const app = createApp();
    const res = await request(app)
      .get(`/api/orders/${ORDER_ID}`)
      .set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(200);
    expect(res.body.order.items).toHaveLength(1);
  });
});

describe("POST /api/orders (checkout)", () => {
  it("creates an order on a successful rpc call", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      makeClient({ create_order_from_cart: () => ({ data: ORDER_ID, error: null }) }) as any
    );
    const app = createApp();
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", "Bearer customer-token")
      .send({ deliveryAddress: "123 Galle Road" });
    expect(res.status).toBe(201);
    expect(res.body.order.id).toBe(ORDER_ID);
  });

  it("returns 400 when the cart is empty", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      makeClient({
        create_order_from_cart: () => ({ data: null, error: { code: "P0001", message: "Cart is empty" } }),
      }) as any
    );
    const app = createApp();
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", "Bearer customer-token")
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns 409 on insufficient stock", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      makeClient({
        create_order_from_cart: () => ({
          data: null,
          error: { code: "P0002", message: 'Insufficient stock for product "Croissant"' },
        }),
      }) as any
    );
    const app = createApp();
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", "Bearer customer-token")
      .send({});
    expect(res.status).toBe(409);
  });
});
```

- [ ] **Step 2: Confirm it fails**

```bash
cd server
npm run test -- routes/orders
```

Expected: FAIL.

- [ ] **Step 3: Implement**

Create `server/src/routes/orders.ts`:

```ts
import { Router } from "express";
import { AppError } from "../errors.js";
import { requireAuth } from "../middleware/auth.js";
import { createOrderFromCart, getOrderForUser, listOrdersForUser } from "../services/orderService.js";
import { idParamSchema } from "../validation/catalogSchemas.js";
import { createOrderSchema } from "../validation/orderSchemas.js";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

ordersRouter.post("/orders", async (req, res, next) => {
  const parsed = createOrderSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({
      error: { message: parsed.error.issues[0]?.message ?? "Invalid request" },
    });
    return;
  }

  try {
    const order = await createOrderFromCart(req.user!.id, parsed.data.deliveryAddress);
    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/orders", async (req, res, next) => {
  try {
    res.json({ orders: await listOrdersForUser(req.user!.id) });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/orders/:id", async (req, res, next) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: { message: "Invalid order id" } });
    return;
  }

  try {
    const order = await getOrderForUser(req.user!.id, parsed.data.id);
    if (!order) {
      next(new AppError(404, "Order not found"));
      return;
    }
    res.json({ order });
  } catch (err) {
    next(err);
  }
});
```

- [ ] **Step 4: Wire into `routes/index.ts`**

Add the import and `apiRouter.use(ordersRouter);` line.

- [ ] **Step 5: Confirm it passes, then run the full suite**

```bash
cd server
npm run test -- routes/orders
npm run test
```

- [ ] **Step 6: Stage**

```bash
git add server/src/routes/orders.ts server/src/routes/orders.test.ts server/src/routes/index.ts
```

---

### Task 7: Admin order routes

**Files:**
- Create: `server/src/routes/adminOrders.ts`
- Test: `server/src/routes/adminOrders.test.ts`
- Modify: `server/src/routes/index.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/routes/adminOrders.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

import { getSupabaseAdmin } from "../lib/supabase.js";
import { createFakeSupabaseClient } from "../test/fakeSupabase.js";
import { createApp } from "../app.js";

const ADMIN_ID = "11111111-1111-1111-1111-111111111111";
const CUSTOMER_ID = "22222222-2222-2222-2222-222222222222";
const ORDER_ID = "33333333-3333-3333-3333-333333333333";

function makeClient(rpc: Record<string, (params: Record<string, unknown>) => any> = {}) {
  return createFakeSupabaseClient({
    usersByToken: {
      "admin-token": { id: ADMIN_ID, email: "admin@royalbakery.lk", app_metadata: { role: "admin" } },
      "customer-token": { id: CUSTOMER_ID, email: "cust@example.com", app_metadata: { role: "customer" } },
    },
    profiles: [],
    orders: [
      {
        id: ORDER_ID,
        user_id: CUSTOMER_ID,
        status: "pending",
        payment_status: "unpaid",
        total_amount: "760.00",
        delivery_address: null,
        created_at: "t",
        updated_at: "t",
      },
    ],
    orderItems: [],
    rpc,
  });
}

beforeEach(() => {
  vi.mocked(getSupabaseAdmin).mockReturnValue(makeClient() as any);
});

describe("admin order routes", () => {
  it("requires auth", async () => {
    const app = createApp();
    expect((await request(app).get("/api/admin/orders")).status).toBe(401);
  });

  it("requires the admin role", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", "Bearer customer-token");
    expect(res.status).toBe(403);
  });

  it("lists all orders for an admin", async () => {
    const app = createApp();
    const res = await request(app).get("/api/admin/orders").set("Authorization", "Bearer admin-token");
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(1);
  });

  it("returns 404 fetching an unknown order", async () => {
    const app = createApp();
    const res = await request(app)
      .get("/api/admin/orders/99999999-9999-9999-9999-999999999999")
      .set("Authorization", "Bearer admin-token");
    expect(res.status).toBe(404);
  });

  it("updates order status", async () => {
    const app = createApp();
    const res = await request(app)
      .put(`/api/admin/orders/${ORDER_ID}/status`)
      .set("Authorization", "Bearer admin-token")
      .send({ status: "processing" });
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe("processing");
  });

  it("rejects an invalid status value", async () => {
    const app = createApp();
    const res = await request(app)
      .put(`/api/admin/orders/${ORDER_ID}/status`)
      .set("Authorization", "Bearer admin-token")
      .send({ status: "shipped" });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Confirm it fails**

```bash
cd server
npm run test -- routes/adminOrders
```

- [ ] **Step 3: Implement**

Create `server/src/routes/adminOrders.ts`:

```ts
import { Router } from "express";
import { AppError } from "../errors.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { getOrderById, listAllOrders, updateOrderStatus } from "../services/orderService.js";
import { idParamSchema } from "../validation/catalogSchemas.js";
import { orderStatusQuerySchema, updateOrderStatusSchema } from "../validation/orderSchemas.js";

export const adminOrdersRouter = Router();

adminOrdersRouter.use(requireAuth, requireRole("admin"));

adminOrdersRouter.get("/admin/orders", async (req, res, next) => {
  const parsed = orderStatusQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: { message: "Invalid status filter" } });
    return;
  }

  try {
    res.json({ orders: await listAllOrders({ status: parsed.data.status }) });
  } catch (err) {
    next(err);
  }
});

adminOrdersRouter.get("/admin/orders/:id", async (req, res, next) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: { message: "Invalid order id" } });
    return;
  }

  try {
    const order = await getOrderById(parsed.data.id);
    if (!order) {
      next(new AppError(404, "Order not found"));
      return;
    }
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

adminOrdersRouter.put("/admin/orders/:id/status", async (req, res, next) => {
  const paramsParsed = idParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: { message: "Invalid order id" } });
    return;
  }
  const parsed = updateOrderStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: { message: parsed.error.issues[0]?.message ?? "Invalid request" },
    });
    return;
  }

  try {
    const order = await updateOrderStatus(paramsParsed.data.id, parsed.data.status);
    res.json({ order });
  } catch (err) {
    next(err);
  }
});
```

- [ ] **Step 4: Wire into `routes/index.ts`**

Add the import and `apiRouter.use(adminOrdersRouter);` line. Final `routes/index.ts` should now `.use()`: `healthRouter`, `usersRouter`, `adminRouter`, `categoriesRouter`, `productsRouter`, `adminCatalogRouter`, `cartRouter`, `ordersRouter`, `adminOrdersRouter`.

- [ ] **Step 5: Confirm it passes, then run the full suite and build**

```bash
cd server
npm run test -- routes/adminOrders
npm run test
npm run build
```

Expected: all PASS, build exits 0.

- [ ] **Step 6: Stage**

```bash
git add server/src/routes/adminOrders.ts server/src/routes/adminOrders.test.ts server/src/routes/index.ts
```

---

### Task 8: Database migration for the two Postgres functions

**Files:**
- Create: `server/supabase/migrations/<timestamp>_order_functions.sql`

- [ ] **Step 1: Create the migration file**

```bash
cd server
npx supabase migration new order_functions
```

(If the `supabase` CLI isn't set up/linked in this environment, just create the file by hand at `server/supabase/migrations/<current-timestamp>_order_functions.sql` using the same naming convention as the existing migrations.)

- [ ] **Step 2: Paste the function definitions**

Set the file's contents to exactly the SQL in the design doc's "Database migration" section (both `create_order_from_cart` and `cancel_order`).

- [ ] **Step 3: Apply it**

Two ways, pick whichever is available:

- **CLI** (if linked): `npx supabase link --project-ref <ref>` then `npx supabase db push`.
- **Dashboard** (simplest, no CLI/DB-password needed): open the Supabase Dashboard → SQL Editor → paste the migration file's contents → Run.

Either way, confirm success in the Dashboard's **Database → Functions** list — both `create_order_from_cart` and `cancel_order` should appear.

- [ ] **Step 4: Stage**

```bash
git add server/supabase/migrations
```

---

### Task 9: Manual end-to-end verification against the live Supabase project

No new source files — proves Tasks 1–8 work together for real, especially the two SQL functions the fake-client tests can't exercise.

- [ ] **Step 1: Start the API**

```bash
cd server
npm run dev
```

- [ ] **Step 2: Get a customer token and an admin token**

Reuse or create test accounts the same way prior modules' verification did (`npm run set-admin -- <email>` for the admin one), get an access token for each via the password-grant endpoint.

- [ ] **Step 3: Seed a product with stock, add it to the cart**

```bash
curl -s -X POST http://localhost:4000/api/cart \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":2}"
```

Expected: `201`, cart shows the item with the right subtotal.

- [ ] **Step 4: Check out**

```bash
curl -s -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" -H "Content-Type: application/json" \
  -d '{"deliveryAddress":"123 Galle Road, Colombo"}'
```

Expected: `201`, an order with the right total and items. Copy the order id.

- [ ] **Step 5: Confirm the real side effects of the SQL function**

```bash
curl -s http://localhost:4000/api/cart -H "Authorization: Bearer $CUSTOMER_TOKEN"
curl -s "http://localhost:4000/api/admin/products" -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected: cart is now empty; the product's `stockQuantity` has decreased by exactly the ordered quantity. This is the one thing no automated test in this module actually proves — this step is where the migration's correctness gets verified for real.

- [ ] **Step 6: Try to over-order a low-stock product**

Set a product's stock to 1 (via `PUT /api/admin/products/:id`), add 1 to cart, then manually bump the cart quantity past stock via a second `POST /api/cart` call, or check out twice in separate carts to trigger the real `P0002` path — confirm `409` with the real Postgres error message.

- [ ] **Step 7: Admin order management**

```bash
curl -s "http://localhost:4000/api/admin/orders" -H "Authorization: Bearer $ADMIN_TOKEN"
curl -s -X PUT "http://localhost:4000/api/admin/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"processing"}'
```

Expected: both `200`.

- [ ] **Step 8: Cancel an order, confirm stock is restored**

```bash
curl -s -X PUT "http://localhost:4000/api/admin/orders/$ORDER_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"cancelled"}'
curl -s "http://localhost:4000/api/admin/products" -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected: `200`, and the cancelled order's product(s) show stock restored to what it was before that order was placed.

- [ ] **Step 9: Ownership check**

Confirm `GET /api/orders/:id` with a *different* customer's token against this order returns `404`, not the order.

- [ ] **Step 10: Clean up and stop the server**

Delete any test cart/order/product data created purely for this verification pass (same cleanup discipline as prior modules), stop `npm run dev`.

Module is done once Steps 3–9 all match their expected results.
