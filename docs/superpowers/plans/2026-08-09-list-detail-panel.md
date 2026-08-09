# List Detail Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a click-to-preview right-side detail panel to Admin Orders, Admin Products, Admin Customers, and the customer's own Orders list, so clicking a row shows that item's details next to the list instead of navigating to a separate page.

**Architecture:** Selection is tracked via a `?selected=<id>` query param on each existing list page (not a new route). Each page reads `selected` from `searchParams`, looks up/fetches that one item, and renders a two-column layout: the existing list on the left, a new `DetailPanel` on the right. The existing standalone `/admin/orders/[id]`, `/orders/[id]`, and `/admin/products/[id]` (edit) pages are untouched.

**Tech Stack:** Next.js App Router (server components), Tailwind CSS, Vitest + Testing Library.

Design doc: `docs/superpowers/specs/2026-08-09-list-detail-panel-design.md`

## Global Constraints

- Do not modify the existing standalone `/admin/orders/[id]`, `/orders/[id]`, `/admin/products/[id]` (edit) pages, `/admin/products/new`, or any Server Action — this feature is additive only.
- No new backend endpoints. Orders need one extra per-item fetch (`getAdminOrder` / `getOrder`) since list endpoints return summaries without line items. Products and customers reuse data already fetched for the list — look them up with `.find()`, no extra request.
- Visual style must match the page it's on: admin pages use the plain `rounded-lg border border-border-warm bg-cream-alt shadow-sm` card style already used across `admin/*`; the customer-facing `/orders` page uses the softer `rounded-[1.5rem]` / shadow style already used on `/orders/[id]`.
- A `selected` id that's missing, deleted, or (for orders) not owned by the current user must render a small "not found" message inside the panel — never throw or 404 the whole list page.
- `cd client` assumed for every command below.
- Stage only (`git add`), never commit — the user commits their own changes in this project.

---

### Task 1: Shared utilities — `buildQuery` helper and `DetailPanel` shell

**Files:**
- Create: `client/src/lib/queryString.ts`
- Test: `client/src/lib/queryString.test.ts`
- Create: `client/src/components/ui/DetailPanel.tsx`
- Test: `client/src/components/ui/DetailPanel.test.tsx`

**Interfaces:**
- Produces: `buildQuery(params: Record<string, string | undefined>): string` — returns `""` when no values are present, otherwise `"?key=value&..."` in the order keys were passed, skipping any key whose value is falsy.
- Produces: `DetailPanel({ title, closeHref, className?, children }): JSX.Element` — a sticky card with a heading, a close (×) link visible at `lg` and up, and a "← Back to list" link visible below `lg`, both pointing at `closeHref`. `className` overrides the default admin-style container classes entirely (used by the `/orders` page to apply its own card style).
- Produces: `DetailPanelPlaceholder({ message, className? }): JSX.Element` — a dashed placeholder card shown only at `lg` and up, displaying `message`.

- [ ] **Step 1: Write the failing test for `buildQuery`**

```ts
// client/src/lib/queryString.test.ts
import { describe, expect, it } from "vitest";
import { buildQuery } from "./queryString";

describe("buildQuery", () => {
  it("returns an empty string when there are no values", () => {
    expect(buildQuery({})).toBe("");
    expect(buildQuery({ a: undefined, b: "" })).toBe("");
  });

  it("serializes present values in insertion order", () => {
    expect(buildQuery({ status: "pending", selected: "abc-123" })).toBe(
      "?status=pending&selected=abc-123"
    );
  });

  it("skips undefined or empty values while keeping the rest", () => {
    expect(buildQuery({ status: undefined, selected: "abc-123" })).toBe(
      "?selected=abc-123"
    );
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/queryString.test.ts`
Expected: FAIL — `Failed to resolve import "./queryString"`.

- [ ] **Step 3: Implement `buildQuery`**

```ts
// client/src/lib/queryString.ts
export function buildQuery(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/lib/queryString.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing test for `DetailPanel`**

```tsx
// client/src/components/ui/DetailPanel.test.tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DetailPanel, DetailPanelPlaceholder } from "./DetailPanel";

afterEach(() => {
  cleanup();
});

describe("DetailPanel", () => {
  it("renders a title, children, and close links pointing at closeHref", () => {
    render(
      <DetailPanel title="Order details" closeHref="/admin/orders">
        <p>Order content</p>
      </DetailPanel>
    );

    expect(screen.getByRole("heading", { name: "Order details" })).toBeVisible();
    expect(screen.getByText("Order content")).toBeVisible();
    expect(screen.getByLabelText("Close details")).toHaveAttribute(
      "href",
      "/admin/orders"
    );
    expect(screen.getByRole("link", { name: "← Back to list" })).toHaveAttribute(
      "href",
      "/admin/orders"
    );
  });

  it("accepts a className override for context-specific styling", () => {
    render(
      <DetailPanel title="Order details" closeHref="/orders" className="custom-panel">
        <p>content</p>
      </DetailPanel>
    );

    expect(screen.getByText("Order details").closest("div.custom-panel")).not.toBeNull();
  });
});

describe("DetailPanelPlaceholder", () => {
  it("renders the provided message", () => {
    render(<DetailPanelPlaceholder message="Select an order to see its details." />);
    expect(screen.getByText("Select an order to see its details.")).toBeVisible();
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npx vitest run src/components/ui/DetailPanel.test.tsx`
Expected: FAIL — `Failed to resolve import "./DetailPanel"`.

- [ ] **Step 7: Implement `DetailPanel` and `DetailPanelPlaceholder`**

```tsx
// client/src/components/ui/DetailPanel.tsx
import Link from "next/link";
import type { ReactNode } from "react";

const DEFAULT_PANEL_CLASSNAME =
  "rounded-lg border border-border-warm bg-cream-alt p-6 shadow-sm";
const DEFAULT_PLACEHOLDER_CLASSNAME =
  "hidden rounded-lg border border-dashed border-border-warm bg-cream-alt/50 p-6 text-center text-sm text-text-muted lg:block";

export function DetailPanel({
  title,
  closeHref,
  className = DEFAULT_PANEL_CLASSNAME,
  children,
}: {
  title: string;
  closeHref: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`lg:sticky lg:top-24 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-cocoa">{title}</h2>
        <Link
          href={closeHref}
          aria-label="Close details"
          className="hidden rounded-full p-1 text-text-muted transition-colors hover:bg-honey-light/50 hover:text-cocoa lg:inline-flex"
        >
          ✕
        </Link>
        <Link
          href={closeHref}
          className="text-sm font-medium text-caramel transition-colors hover:text-caramel-hover lg:hidden"
        >
          ← Back to list
        </Link>
      </div>
      {children}
    </div>
  );
}

export function DetailPanelPlaceholder({
  message,
  className = DEFAULT_PLACEHOLDER_CLASSNAME,
}: {
  message: string;
  className?: string;
}) {
  return <div className={className}>{message}</div>;
}
```

- [ ] **Step 8: Run it to verify it passes**

Run: `npx vitest run src/components/ui/DetailPanel.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 9: Stage the changes**

```bash
git add client/src/lib/queryString.ts client/src/lib/queryString.test.ts client/src/components/ui/DetailPanel.tsx client/src/components/ui/DetailPanel.test.tsx
```

---

### Task 2: Admin Orders — `OrderDetailPanel` component

**Files:**
- Create: `client/src/components/admin/OrderDetailPanel.tsx`
- Test: `client/src/components/admin/OrderDetailPanel.test.tsx`

**Interfaces:**
- Consumes: `Order` from `@/lib/orders` (`{ id, status, paymentStatus, totalAmount, deliveryAddress, createdAt, items: OrderItem[] }`), `formatPrice` from `@/lib/catalog`, `OrderStatusBadge`/`PaymentStatusBadge` from `@/components/*`, `UpdateOrderStatusForm` from `@/components/admin/UpdateOrderStatusForm` (props `{ orderId: string; currentStatus: OrderStatus }`).
- Produces: `OrderDetailPanel({ order: Order }): JSX.Element` — used by Task 3.

- [ ] **Step 1: Write the failing test**

```tsx
// client/src/components/admin/OrderDetailPanel.test.tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Order } from "@/lib/orders";
import { OrderDetailPanel } from "./OrderDetailPanel";

vi.mock("@/app/actions/admin/orders", () => ({
  updateOrderStatus: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

const order: Order = {
  id: "order-1",
  status: "pending",
  paymentStatus: "unpaid",
  totalAmount: 1500,
  deliveryAddress: "123 Galle Road",
  createdAt: "2026-08-01T10:00:00.000Z",
  items: [
    { productId: "p1", name: "Chocolate Cake", quantity: 1, unitPrice: 1500, subtotal: 1500 },
  ],
};

describe("OrderDetailPanel (admin)", () => {
  it("shows order items, total, fulfillment, and the status update form", () => {
    render(<OrderDetailPanel order={order} />);

    expect(screen.getByText(/Chocolate Cake × 1/)).toBeVisible();
    expect(screen.getByText("LKR 1,500")).toBeVisible();
    expect(screen.getByText(/Delivery — 123 Galle Road/)).toBeVisible();
    expect(screen.getByRole("combobox", { name: "Update status" })).toBeVisible();
    expect(screen.getByRole("button", { name: /Save status/ })).toBeVisible();
  });

  it("shows Pickup when there's no delivery address", () => {
    render(<OrderDetailPanel order={{ ...order, deliveryAddress: null }} />);
    expect(screen.getByText("Pickup")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/admin/OrderDetailPanel.test.tsx`
Expected: FAIL — `Failed to resolve import "./OrderDetailPanel"`.

- [ ] **Step 3: Implement `OrderDetailPanel`**

```tsx
// client/src/components/admin/OrderDetailPanel.tsx
import { UpdateOrderStatusForm } from "@/components/admin/UpdateOrderStatusForm";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { formatPrice } from "@/lib/catalog";
import type { Order } from "@/lib/orders";

export function OrderDetailPanel({ order }: { order: Order }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <PaymentStatusBadge status={order.paymentStatus} />
        <OrderStatusBadge status={order.status} />
      </div>

      <dl className="mb-6 grid grid-cols-1 gap-4 text-sm">
        <div>
          <dt className="text-text-muted">Placed on</dt>
          <dd className="font-medium text-cocoa">
            {new Date(order.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Fulfillment</dt>
          <dd className="font-medium text-cocoa">
            {order.deliveryAddress
              ? `Delivery — ${order.deliveryAddress}`
              : "Pickup"}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Order ID</dt>
          <dd className="font-mono text-xs text-cocoa">{order.id}</dd>
        </div>
      </dl>

      <h3 className="mb-3 font-display text-lg text-cocoa">Items</h3>
      <ul className="mb-6 flex flex-col gap-2 border-y border-border-warm py-4 text-sm text-cocoa">
        {order.items.map((item) => (
          <li key={item.productId} className="flex justify-between gap-4">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="shrink-0">{formatPrice(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      <div className="mb-8 flex justify-between font-medium text-cocoa">
        <span>Total</span>
        <span>{formatPrice(order.totalAmount)}</span>
      </div>

      <section className="border-t border-border-warm pt-6">
        <h3 className="mb-4 font-display text-lg text-cocoa">Manage status</h3>
        <UpdateOrderStatusForm orderId={order.id} currentStatus={order.status} />
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/components/admin/OrderDetailPanel.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Stage the changes**

```bash
git add client/src/components/admin/OrderDetailPanel.tsx client/src/components/admin/OrderDetailPanel.test.tsx
```

---

### Task 3: Admin Orders — wire the list page to the panel

**Files:**
- Modify: `client/src/app/(admin)/admin/orders/page.tsx`
- Test: `client/src/app/(admin)/admin/orders/page.test.tsx`

**Interfaces:**
- Consumes: `buildQuery` (Task 1), `DetailPanel`/`DetailPanelPlaceholder` (Task 1), `OrderDetailPanel` (Task 2), `getAdminOrder`/`listAdminOrders` from `@/lib/admin/orders`, `requireAdminSession` from `@/lib/admin/session`.

- [ ] **Step 1: Write the failing test**

```tsx
// client/src/app/(admin)/admin/orders/page.test.tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Order, OrderSummary } from "@/lib/orders";
import AdminOrdersPage from "./page";

const mocks = vi.hoisted(() => ({
  listAdminOrders: vi.fn(),
  getAdminOrder: vi.fn(),
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/admin/orders", () => ({
  listAdminOrders: mocks.listAdminOrders,
  getAdminOrder: mocks.getAdminOrder,
}));

vi.mock("@/lib/admin/session", () => ({
  requireAdminSession: mocks.requireAdminSession,
}));

vi.mock("@/app/actions/admin/orders", () => ({
  updateOrderStatus: vi.fn(),
}));

const orderSummary: OrderSummary = {
  id: "order-1",
  status: "pending",
  paymentStatus: "unpaid",
  totalAmount: 1500,
  deliveryAddress: null,
  createdAt: "2026-08-01T10:00:00.000Z",
};

const orderDetail: Order = {
  ...orderSummary,
  items: [
    { productId: "p1", name: "Chocolate Cake", quantity: 1, unitPrice: 1500, subtotal: 1500 },
  ],
};

beforeEach(() => {
  mocks.requireAdminSession.mockResolvedValue({
    accessToken: "token",
    userId: "admin-1",
    email: "admin@royalbakery.lk",
  });
  mocks.listAdminOrders.mockResolvedValue([orderSummary]);
  mocks.getAdminOrder.mockResolvedValue(orderDetail);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AdminOrdersPage", () => {
  it("shows a placeholder when no order is selected", async () => {
    render(await AdminOrdersPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("Select an order to see its details.")).toBeVisible();
    expect(mocks.getAdminOrder).not.toHaveBeenCalled();
  });

  it("shows the order's details in the panel when selected", async () => {
    render(
      await AdminOrdersPage({
        searchParams: Promise.resolve({ selected: "order-1" }),
      })
    );

    expect(mocks.getAdminOrder).toHaveBeenCalledWith("token", "order-1");
    expect(screen.getByRole("heading", { name: "Order details" })).toBeVisible();
    expect(screen.getByText(/Chocolate Cake × 1/)).toBeVisible();
  });

  it("shows a not-found message for a stale selected id", async () => {
    mocks.getAdminOrder.mockResolvedValue(null);

    render(
      await AdminOrdersPage({
        searchParams: Promise.resolve({ selected: "missing" }),
      })
    );

    expect(screen.getByText("This order could not be found.")).toBeVisible();
  });

  it("carries the selected id and preserves the status filter on row links", async () => {
    render(
      await AdminOrdersPage({
        searchParams: Promise.resolve({ status: "pending" }),
      })
    );

    expect(mocks.listAdminOrders).toHaveBeenCalledWith("token", { status: "pending" });
    const rowLinks = screen.getAllByRole("link");
    const orderRow = rowLinks.find((link) =>
      link.getAttribute("href")?.includes("selected=order-1")
    );
    expect(orderRow).toHaveAttribute(
      "href",
      "/admin/orders?status=pending&selected=order-1"
    );
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run "src/app/(admin)/admin/orders/page.test.tsx"`
Expected: FAIL — the placeholder text and panel content don't exist yet in the current page.

- [ ] **Step 3: Replace the page implementation**

```tsx
// client/src/app/(admin)/admin/orders/page.tsx
import Link from "next/link";
import { OrderDetailPanel } from "@/components/admin/OrderDetailPanel";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { DetailPanel, DetailPanelPlaceholder } from "@/components/ui/DetailPanel";
import { getAdminOrder, listAdminOrders } from "@/lib/admin/orders";
import { requireAdminSession } from "@/lib/admin/session";
import { formatPrice } from "@/lib/catalog";
import type { OrderStatus } from "@/lib/orders";
import { buildQuery } from "@/lib/queryString";

const FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function isOrderStatus(value: string): value is OrderStatus {
  return ["pending", "processing", "completed", "cancelled"].includes(value);
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; selected?: string }>;
}) {
  const { status: statusParam, selected } = await searchParams;
  const statusFilter =
    statusParam && isOrderStatus(statusParam) ? statusParam : undefined;

  const session = await requireAdminSession();
  const orders = await listAdminOrders(session.accessToken, {
    status: statusFilter,
  });
  const selectedOrder = selected
    ? await getAdminOrder(session.accessToken, selected)
    : null;

  const closeHref = `/admin/orders${buildQuery({ status: statusFilter })}`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 font-display text-3xl text-cocoa">Orders</h1>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className={`min-w-0 flex-1 ${selected ? "hidden lg:block" : ""}`}>
          <div className="mb-8 flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const href =
                filter.value === "all"
                  ? "/admin/orders"
                  : `/admin/orders?status=${filter.value}`;
              const active =
                filter.value === "all"
                  ? !statusFilter
                  : statusFilter === filter.value;

              return (
                <Link
                  key={filter.value}
                  href={href}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-caramel text-cream-alt"
                      : "bg-honey-light/50 text-cocoa hover:bg-honey-light"
                  }`}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>

          {orders.length === 0 ? (
            <p className="text-sm text-text-muted">
              No orders{statusFilter ? ` with status “${statusFilter}”` : ""}.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border-warm border-y border-border-warm">
              {orders.map((order) => {
                const isActive = order.id === selected;
                const rowHref = `/admin/orders${buildQuery({
                  status: statusFilter,
                  selected: order.id,
                })}`;
                return (
                  <li key={order.id}>
                    <Link
                      href={rowHref}
                      className={`flex flex-col gap-3 py-5 transition-colors hover:bg-honey-light/30 sm:flex-row sm:items-center sm:justify-between ${
                        isActive ? "bg-honey-light/40" : ""
                      }`}
                    >
                      <div>
                        <p className="font-medium text-cocoa">
                          {new Date(order.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-sm text-text-muted">
                          {order.deliveryAddress ? "Delivery" : "Pickup"} ·{" "}
                          {formatPrice(order.totalAmount)}
                        </p>
                        <p className="mt-1 font-mono text-xs text-text-muted">
                          {order.id.slice(0, 8)}…
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <PaymentStatusBadge status={order.paymentStatus} />
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className={`w-full shrink-0 lg:w-96 ${selected ? "" : "hidden lg:block"}`}>
          {selected ? (
            <DetailPanel title="Order details" closeHref={closeHref}>
              {selectedOrder ? (
                <OrderDetailPanel order={selectedOrder} />
              ) : (
                <p className="text-sm text-text-muted">
                  This order could not be found.
                </p>
              )}
            </DetailPanel>
          ) : (
            <DetailPanelPlaceholder message="Select an order to see its details." />
          )}
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run "src/app/(admin)/admin/orders/page.test.tsx"`
Expected: PASS (4 tests).

- [ ] **Step 5: Stage the changes**

```bash
git add "client/src/app/(admin)/admin/orders/page.tsx" "client/src/app/(admin)/admin/orders/page.test.tsx"
```

---

### Task 4: Admin Products — `ProductDetailPanel` component

**Files:**
- Create: `client/src/components/admin/ProductDetailPanel.tsx`
- Test: `client/src/components/admin/ProductDetailPanel.test.tsx`

**Interfaces:**
- Consumes: `Product` from `@/lib/catalog`, `formatPrice` from `@/lib/catalog`, `stockLabel` from `@/lib/admin/catalog`, `Badge` from `@/components/ui/Badge`.
- Produces: `ProductDetailPanel({ product: Product; categoryName?: string }): JSX.Element` — used by Task 5.

- [ ] **Step 1: Write the failing test**

```tsx
// client/src/components/admin/ProductDetailPanel.test.tsx
import { cleanup, render, screen } from "@testing-library/react";
import { createElement, type ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/lib/catalog";
import { ProductDetailPanel } from "./ProductDetailPanel";

vi.mock("next/image", () => ({
  default: (imageProps: ComponentProps<"img"> & { priority?: boolean; fill?: boolean }) => {
    const { priority, fill, ...props } = imageProps;
    void fill;
    return createElement("img", { ...props, "data-priority": priority ? "true" : undefined });
  },
}));

afterEach(() => {
  cleanup();
});

const product: Product = {
  id: "cake-1",
  categoryId: "cakes",
  name: "Chocolate Cake",
  description: "Rich and moist.",
  price: 1500,
  imageUrl: "https://images.example.com/cake.jpg",
  stockQuantity: 3,
  isAvailable: true,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

describe("ProductDetailPanel", () => {
  it("shows the product's details, category, and an edit link", () => {
    render(<ProductDetailPanel product={product} categoryName="Cakes" />);

    expect(screen.getByText("Chocolate Cake")).toBeVisible();
    expect(screen.getByText("LKR 1,500")).toBeVisible();
    expect(screen.getByText("Cakes")).toBeVisible();
    expect(screen.getByText("Rich and moist.")).toBeVisible();
    expect(screen.getByText("In stock")).toBeVisible();
    expect(screen.getByRole("link", { name: "Edit product" })).toHaveAttribute(
      "href",
      "/admin/products/cake-1"
    );
  });

  it("flags unavailable products", () => {
    render(<ProductDetailPanel product={{ ...product, isAvailable: false }} />);
    expect(screen.getByText("Unavailable")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/admin/ProductDetailPanel.test.tsx`
Expected: FAIL — `Failed to resolve import "./ProductDetailPanel"`.

- [ ] **Step 3: Implement `ProductDetailPanel`**

```tsx
// client/src/components/admin/ProductDetailPanel.tsx
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { stockLabel } from "@/lib/admin/catalog";
import { formatPrice } from "@/lib/catalog";
import type { Product } from "@/lib/catalog";

export function ProductDetailPanel({
  product,
  categoryName,
}: {
  product: Product;
  categoryName?: string;
}) {
  const stock = stockLabel(product.stockQuantity);

  return (
    <div>
      {product.imageUrl && (
        <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-xl bg-honey-light">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="384px"
          />
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <Badge tone={stock.tone}>{stock.label}</Badge>
        {!product.isAvailable && <Badge tone="muted">Unavailable</Badge>}
      </div>

      <p className="mb-1 font-display text-lg text-cocoa">{product.name}</p>
      <p className="mb-4 text-sm text-text-muted">{formatPrice(product.price)}</p>

      {product.description && (
        <p className="mb-4 text-sm text-cocoa">{product.description}</p>
      )}

      <dl className="mb-6 grid grid-cols-1 gap-3 text-sm">
        {categoryName && (
          <div>
            <dt className="text-text-muted">Category</dt>
            <dd className="font-medium text-cocoa">{categoryName}</dd>
          </div>
        )}
        <div>
          <dt className="text-text-muted">Stock</dt>
          <dd className="font-medium text-cocoa">{product.stockQuantity}</dd>
        </div>
      </dl>

      <Link
        href={`/admin/products/${product.id}`}
        className="inline-flex items-center gap-2 rounded-full bg-caramel px-5 py-2.5 text-sm font-medium text-cream-alt transition-colors hover:bg-caramel-hover"
      >
        Edit product
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/components/admin/ProductDetailPanel.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Stage the changes**

```bash
git add client/src/components/admin/ProductDetailPanel.tsx client/src/components/admin/ProductDetailPanel.test.tsx
```

---

### Task 5: Admin Products — wire the list page to the panel

**Files:**
- Modify: `client/src/app/(admin)/admin/products/page.tsx`
- Test: `client/src/app/(admin)/admin/products/page.test.tsx`

**Interfaces:**
- Consumes: `buildQuery` (Task 1), `DetailPanel`/`DetailPanelPlaceholder` (Task 1), `ProductDetailPanel` (Task 4), `listAdminProducts`/`listAdminCategories`/`LOW_STOCK_THRESHOLD`/`stockLabel` from `@/lib/admin/catalog`, `requireAdminSession` from `@/lib/admin/session`.

- [ ] **Step 1: Write the failing test**

```tsx
// client/src/app/(admin)/admin/products/page.test.tsx
import { cleanup, render, screen } from "@testing-library/react";
import { createElement, type ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Category, Product } from "@/lib/catalog";
import AdminProductsPage from "./page";

const mocks = vi.hoisted(() => ({
  listAdminProducts: vi.fn(),
  listAdminCategories: vi.fn(),
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/admin/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admin/catalog")>()),
  listAdminProducts: mocks.listAdminProducts,
  listAdminCategories: mocks.listAdminCategories,
}));

vi.mock("@/lib/admin/session", () => ({
  requireAdminSession: mocks.requireAdminSession,
}));

vi.mock("next/image", () => ({
  default: (imageProps: ComponentProps<"img"> & { priority?: boolean; fill?: boolean }) => {
    const { priority, fill, ...props } = imageProps;
    void fill;
    return createElement("img", { ...props, "data-priority": priority ? "true" : undefined });
  },
}));

const category: Category = {
  id: "cakes",
  name: "Cakes",
  description: null,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const product: Product = {
  id: "cake-1",
  categoryId: "cakes",
  name: "Chocolate Cake",
  description: null,
  price: 1500,
  imageUrl: null,
  stockQuantity: 3,
  isAvailable: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  mocks.requireAdminSession.mockResolvedValue({
    accessToken: "token",
    userId: "admin-1",
    email: "admin@royalbakery.lk",
  });
  mocks.listAdminProducts.mockResolvedValue([product]);
  mocks.listAdminCategories.mockResolvedValue([category]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AdminProductsPage", () => {
  it("shows a placeholder when no product is selected", async () => {
    render(await AdminProductsPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Select a product to see its details.")).toBeVisible();
  });

  it("shows the product's details, including its category, when selected", async () => {
    render(
      await AdminProductsPage({
        searchParams: Promise.resolve({ selected: "cake-1" }),
      })
    );

    expect(screen.getByRole("heading", { name: "Product details" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Edit product" })).toHaveAttribute(
      "href",
      "/admin/products/cake-1"
    );
    expect(screen.getAllByText("Cakes").length).toBeGreaterThan(0);
  });

  it("shows a not-found message for a stale selected id", async () => {
    render(
      await AdminProductsPage({
        searchParams: Promise.resolve({ selected: "missing" }),
      })
    );
    expect(screen.getByText("This product could not be found.")).toBeVisible();
  });

  it("carries the selected id and preserves active filters on row links", async () => {
    render(
      await AdminProductsPage({
        searchParams: Promise.resolve({ categoryId: "cakes" }),
      })
    );

    const rowLinks = screen.getAllByRole("link");
    const productRow = rowLinks.find((link) =>
      link.getAttribute("href")?.includes("selected=cake-1")
    );
    expect(productRow).toHaveAttribute(
      "href",
      "/admin/products?categoryId=cakes&selected=cake-1"
    );
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run "src/app/(admin)/admin/products/page.test.tsx"`
Expected: FAIL — the placeholder text and panel content don't exist yet.

- [ ] **Step 3: Replace the page implementation**

```tsx
// client/src/app/(admin)/admin/products/page.tsx
import Link from "next/link";
import { ProductDetailPanel } from "@/components/admin/ProductDetailPanel";
import { Badge } from "@/components/ui/Badge";
import { DetailPanel, DetailPanelPlaceholder } from "@/components/ui/DetailPanel";
import {
  listAdminCategories,
  listAdminProducts,
  LOW_STOCK_THRESHOLD,
  stockLabel,
} from "@/lib/admin/catalog";
import { requireAdminSession } from "@/lib/admin/session";
import { formatPrice } from "@/lib/catalog";
import { buildQuery } from "@/lib/queryString";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    categoryId?: string;
    search?: string;
    lowStock?: string;
    selected?: string;
  }>;
}) {
  const { categoryId, search, lowStock, selected } = await searchParams;
  const session = await requireAdminSession();
  const [products, categories] = await Promise.all([
    listAdminProducts(session.accessToken, {
      categoryId: categoryId || undefined,
      search: search || undefined,
    }),
    listAdminCategories(session.accessToken),
  ]);

  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const visible =
    lowStock === "1"
      ? products.filter((p) => p.stockQuantity <= LOW_STOCK_THRESHOLD)
      : products;

  const selectedProduct = selected
    ? (products.find((p) => p.id === selected) ?? null)
    : null;
  const listFilters = { categoryId, search, lowStock };
  const closeHref = `/admin/products${buildQuery(listFilters)}`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl text-cocoa">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-caramel px-5 py-2.5 text-sm font-medium text-cream-alt transition-colors hover:bg-caramel-hover"
        >
          Add product
        </Link>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className={`min-w-0 flex-1 ${selected ? "hidden lg:block" : ""}`}>
          <form className="mb-6 flex flex-wrap gap-3" method="get">
            <input
              type="search"
              name="search"
              placeholder="Search products…"
              defaultValue={search ?? ""}
              className="min-w-[12rem] flex-1 rounded-lg border border-border-warm bg-white px-3.5 py-2.5 text-sm text-cocoa focus:outline-none focus:ring-2 focus:ring-caramel"
            />
            <select
              name="categoryId"
              defaultValue={categoryId ?? ""}
              className="rounded-lg border border-border-warm bg-white px-3.5 py-2.5 text-sm text-cocoa focus:outline-none focus:ring-2 focus:ring-caramel"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-cocoa">
              <input
                type="checkbox"
                name="lowStock"
                value="1"
                defaultChecked={lowStock === "1"}
                className="size-4 rounded border-border-warm text-caramel focus:ring-caramel"
              />
              Low stock only
            </label>
            <button
              type="submit"
              className="rounded-full bg-honey-light px-4 py-2 text-sm font-medium text-cocoa hover:bg-honey"
            >
              Filter
            </button>
          </form>

          {visible.length === 0 ? (
            <p className="text-sm text-text-muted">No products match.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border-warm border-y border-border-warm">
              {visible.map((product) => {
                const stock = stockLabel(product.stockQuantity);
                const isActive = product.id === selected;
                const rowHref = `/admin/products${buildQuery({
                  ...listFilters,
                  selected: product.id,
                })}`;
                return (
                  <li key={product.id}>
                    <Link
                      href={rowHref}
                      className={`flex flex-col gap-3 py-4 transition-colors hover:bg-honey-light/30 sm:flex-row sm:items-center sm:justify-between ${
                        isActive ? "bg-honey-light/40" : ""
                      }`}
                    >
                      <div>
                        <p className="font-medium text-cocoa">{product.name}</p>
                        <p className="text-sm text-text-muted">
                          {formatPrice(product.price)}
                          {product.categoryId
                            ? ` · ${categoryName.get(product.categoryId) ?? "Category"}`
                            : ""}
                          {` · Stock ${product.stockQuantity}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={stock.tone}>{stock.label}</Badge>
                        {!product.isAvailable && (
                          <Badge tone="muted">Unavailable</Badge>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className={`w-full shrink-0 lg:w-96 ${selected ? "" : "hidden lg:block"}`}>
          {selected ? (
            <DetailPanel title="Product details" closeHref={closeHref}>
              {selectedProduct ? (
                <ProductDetailPanel
                  product={selectedProduct}
                  categoryName={
                    selectedProduct.categoryId
                      ? categoryName.get(selectedProduct.categoryId)
                      : undefined
                  }
                />
              ) : (
                <p className="text-sm text-text-muted">
                  This product could not be found.
                </p>
              )}
            </DetailPanel>
          ) : (
            <DetailPanelPlaceholder message="Select a product to see its details." />
          )}
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run "src/app/(admin)/admin/products/page.test.tsx"`
Expected: PASS (4 tests).

- [ ] **Step 5: Stage the changes**

```bash
git add "client/src/app/(admin)/admin/products/page.tsx" "client/src/app/(admin)/admin/products/page.test.tsx"
```

---

### Task 6: Admin Customers — `CustomerDetailPanel` component

**Files:**
- Create: `client/src/components/admin/CustomerDetailPanel.tsx`
- Test: `client/src/components/admin/CustomerDetailPanel.test.tsx`

**Interfaces:**
- Consumes: `AdminCustomer` from `@/lib/admin/customers` (`{ id, fullName, phone, address, role, createdAt }`), `Badge` from `@/components/ui/Badge`.
- Produces: `CustomerDetailPanel({ customer: AdminCustomer; isSelf: boolean }): JSX.Element` — used by Task 7. No role-change control — that stays on the list row.

- [ ] **Step 1: Write the failing test**

```tsx
// client/src/components/admin/CustomerDetailPanel.test.tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { AdminCustomer } from "@/lib/admin/customers";
import { CustomerDetailPanel } from "./CustomerDetailPanel";

afterEach(() => {
  cleanup();
});

const customer: AdminCustomer = {
  id: "cust-1",
  fullName: "Jane Doe",
  phone: "0771234567",
  address: "123 Galle Road",
  role: "customer",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("CustomerDetailPanel", () => {
  it("shows the customer's profile fields", () => {
    render(<CustomerDetailPanel customer={customer} isSelf={false} />);

    expect(screen.getByText("Jane Doe")).toBeVisible();
    expect(screen.getByText("customer")).toBeVisible();
    expect(screen.getByText("0771234567")).toBeVisible();
    expect(screen.getByText("123 Galle Road")).toBeVisible();
    expect(screen.queryByText("You")).not.toBeInTheDocument();
  });

  it("flags the signed-in admin's own row and falls back for a missing name", () => {
    render(
      <CustomerDetailPanel
        customer={{ ...customer, fullName: null, role: "admin" }}
        isSelf
      />
    );

    expect(screen.getByText("Unnamed user")).toBeVisible();
    expect(screen.getByText("You")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/admin/CustomerDetailPanel.test.tsx`
Expected: FAIL — `Failed to resolve import "./CustomerDetailPanel"`.

- [ ] **Step 3: Implement `CustomerDetailPanel`**

```tsx
// client/src/components/admin/CustomerDetailPanel.tsx
import { Badge } from "@/components/ui/Badge";
import type { AdminCustomer } from "@/lib/admin/customers";

export function CustomerDetailPanel({
  customer,
  isSelf,
}: {
  customer: AdminCustomer;
  isSelf: boolean;
}) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="font-display text-lg text-cocoa">
          {customer.fullName?.trim() || "Unnamed user"}
        </p>
        <Badge tone={customer.role === "admin" ? "honey" : "muted"}>
          {customer.role}
        </Badge>
        {isSelf && <Badge tone="success">You</Badge>}
      </div>

      <dl className="grid grid-cols-1 gap-4 text-sm">
        <div>
          <dt className="text-text-muted">Phone</dt>
          <dd className="font-medium text-cocoa">{customer.phone || "No phone"}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Address</dt>
          <dd className="font-medium text-cocoa">{customer.address || "No address"}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Joined</dt>
          <dd className="font-medium text-cocoa">
            {new Date(customer.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </dd>
        </div>
      </dl>
    </div>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/components/admin/CustomerDetailPanel.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Stage the changes**

```bash
git add client/src/components/admin/CustomerDetailPanel.tsx client/src/components/admin/CustomerDetailPanel.test.tsx
```

---

### Task 7: Admin Customers — wire the list page to the panel

**Files:**
- Modify: `client/src/app/(admin)/admin/customers/page.tsx`
- Test: `client/src/app/(admin)/admin/customers/page.test.tsx`

**Interfaces:**
- Consumes: `buildQuery` (Task 1), `DetailPanel`/`DetailPanelPlaceholder` (Task 1), `CustomerDetailPanel` (Task 6), `listAdminCustomers` from `@/lib/admin/customers`, `requireAdminSession` from `@/lib/admin/session`, existing `CustomerRoleForm`.

- [ ] **Step 1: Write the failing test**

```tsx
// client/src/app/(admin)/admin/customers/page.test.tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminCustomer } from "@/lib/admin/customers";
import AdminCustomersPage from "./page";

const mocks = vi.hoisted(() => ({
  listAdminCustomers: vi.fn(),
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/admin/customers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admin/customers")>()),
  listAdminCustomers: mocks.listAdminCustomers,
}));

vi.mock("@/lib/admin/session", () => ({
  requireAdminSession: mocks.requireAdminSession,
}));

vi.mock("@/app/actions/admin/customers", () => ({
  updateCustomerRole: vi.fn(),
}));

const customer: AdminCustomer = {
  id: "cust-1",
  fullName: "Jane Doe",
  phone: "0771234567",
  address: "123 Galle Road",
  role: "customer",
  createdAt: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  mocks.requireAdminSession.mockResolvedValue({
    accessToken: "token",
    userId: "admin-1",
    email: "admin@royalbakery.lk",
  });
  mocks.listAdminCustomers.mockResolvedValue([customer]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AdminCustomersPage", () => {
  it("shows a placeholder when no customer is selected", async () => {
    render(await AdminCustomersPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Select a customer to see their details.")).toBeVisible();
  });

  it("shows the customer's details in the panel when selected", async () => {
    render(
      await AdminCustomersPage({
        searchParams: Promise.resolve({ selected: "cust-1" }),
      })
    );

    expect(screen.getByRole("heading", { name: "Customer details" })).toBeVisible();
    expect(screen.getAllByText("Jane Doe").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0771234567").length).toBeGreaterThan(0);
  });

  it("shows a not-found message for a stale selected id", async () => {
    render(
      await AdminCustomersPage({
        searchParams: Promise.resolve({ selected: "missing" }),
      })
    );
    expect(screen.getByText("This customer could not be found.")).toBeVisible();
  });

  it("keeps the role-change control on the row, not duplicated in the panel", async () => {
    render(
      await AdminCustomersPage({
        searchParams: Promise.resolve({ selected: "cust-1" }),
      })
    );
    expect(screen.getAllByRole("button", { name: "Update" })).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run "src/app/(admin)/admin/customers/page.test.tsx"`
Expected: FAIL — the placeholder text and panel content don't exist yet.

- [ ] **Step 3: Replace the page implementation**

```tsx
// client/src/app/(admin)/admin/customers/page.tsx
import Link from "next/link";
import { CustomerDetailPanel } from "@/components/admin/CustomerDetailPanel";
import { CustomerRoleForm } from "@/components/admin/CustomerRoleForm";
import { Badge } from "@/components/ui/Badge";
import { DetailPanel, DetailPanelPlaceholder } from "@/components/ui/DetailPanel";
import { listAdminCustomers } from "@/lib/admin/customers";
import { requireAdminSession } from "@/lib/admin/session";
import { buildQuery } from "@/lib/queryString";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; selected?: string }>;
}) {
  const { role: roleFilter, selected } = await searchParams;
  const session = await requireAdminSession();
  const customers = await listAdminCustomers(session.accessToken);

  const filtered =
    roleFilter === "admin" || roleFilter === "customer"
      ? customers.filter((c) => c.role === roleFilter)
      : customers;

  const selectedCustomer = selected
    ? (customers.find((c) => c.id === selected) ?? null)
    : null;
  const closeHref = `/admin/customers${buildQuery({ role: roleFilter })}`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-2 font-display text-3xl text-cocoa">Customers</h1>
      <p className="mb-6 text-sm text-text-muted">
        View accounts and promote or demote admin access.
      </p>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className={`min-w-0 flex-1 ${selected ? "hidden lg:block" : ""}`}>
          <div className="mb-8 flex flex-wrap gap-2">
            {(
              [
                { value: "all", label: "All", href: "/admin/customers" },
                {
                  value: "customer",
                  label: "Customers",
                  href: "/admin/customers?role=customer",
                },
                {
                  value: "admin",
                  label: "Admins",
                  href: "/admin/customers?role=admin",
                },
              ] as const
            ).map((filter) => {
              const active =
                filter.value === "all"
                  ? !roleFilter
                  : roleFilter === filter.value;
              return (
                <Link
                  key={filter.value}
                  href={filter.href}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-caramel text-cream-alt"
                      : "bg-honey-light/50 text-cocoa hover:bg-honey-light"
                  }`}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-text-muted">No accounts found.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border-warm border-y border-border-warm">
              {filtered.map((customer) => {
                const isSelf = customer.id === session.userId;
                const isActive = customer.id === selected;
                const rowHref = `/admin/customers${buildQuery({
                  role: roleFilter,
                  selected: customer.id,
                })}`;
                return (
                  <li
                    key={customer.id}
                    className={`flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between ${
                      isActive ? "bg-honey-light/40" : ""
                    }`}
                  >
                    <Link href={rowHref} className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-cocoa">
                          {customer.fullName?.trim() || "Unnamed user"}
                        </p>
                        <Badge
                          tone={customer.role === "admin" ? "honey" : "muted"}
                        >
                          {customer.role}
                        </Badge>
                        {isSelf && <Badge tone="success">You</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-text-muted">
                        {customer.phone || "No phone"}
                        {customer.address ? ` · ${customer.address}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Joined{" "}
                        {new Date(customer.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </Link>
                    <CustomerRoleForm
                      customerId={customer.id}
                      currentRole={customer.role}
                      isSelf={isSelf}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className={`w-full shrink-0 lg:w-96 ${selected ? "" : "hidden lg:block"}`}>
          {selected ? (
            <DetailPanel title="Customer details" closeHref={closeHref}>
              {selectedCustomer ? (
                <CustomerDetailPanel
                  customer={selectedCustomer}
                  isSelf={selectedCustomer.id === session.userId}
                />
              ) : (
                <p className="text-sm text-text-muted">
                  This customer could not be found.
                </p>
              )}
            </DetailPanel>
          ) : (
            <DetailPanelPlaceholder message="Select a customer to see their details." />
          )}
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run "src/app/(admin)/admin/customers/page.test.tsx"`
Expected: PASS (4 tests).

- [ ] **Step 5: Stage the changes**

```bash
git add "client/src/app/(admin)/admin/customers/page.tsx" "client/src/app/(admin)/admin/customers/page.test.tsx"
```

---

### Task 8: Shop Orders — user-facing `OrderDetailPanel` component

**Files:**
- Create: `client/src/components/OrderDetailPanel.tsx`
- Test: `client/src/components/OrderDetailPanel.test.tsx`

**Interfaces:**
- Consumes: `Order` from `@/lib/orders`, `formatPrice` from `@/lib/catalog`, `OrderStatusBadge`/`PaymentStatusBadge`/`PayNowButton` from `@/components/*` (`PayNowButton` props: `{ orderId: string }`).
- Produces: `OrderDetailPanel({ order: Order }): JSX.Element` — used by Task 9. Note this is a different component from `@/components/admin/OrderDetailPanel` (Task 2) — same name, different directory, no collision since imports are path-qualified.

- [ ] **Step 1: Write the failing test**

```tsx
// client/src/components/OrderDetailPanel.test.tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Order } from "@/lib/orders";
import { OrderDetailPanel } from "./OrderDetailPanel";

vi.mock("@/app/actions/payments", () => ({ initiatePaymentAction: vi.fn() }));

afterEach(() => {
  cleanup();
});

const order: Order = {
  id: "order-1",
  status: "pending",
  paymentStatus: "unpaid",
  totalAmount: 1500,
  deliveryAddress: "123 Galle Road",
  createdAt: "2026-08-01T10:00:00.000Z",
  items: [
    { productId: "p1", name: "Chocolate Cake", quantity: 1, unitPrice: 1500, subtotal: 1500 },
  ],
};

describe("OrderDetailPanel (shop)", () => {
  it("shows order items, total, fulfillment, and a Pay now button when unpaid", () => {
    render(<OrderDetailPanel order={order} />);

    expect(screen.getByText(/Chocolate Cake × 1/)).toBeVisible();
    expect(screen.getByText("LKR 1,500")).toBeVisible();
    expect(screen.getByText(/Delivery — 123 Galle Road/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Pay now" })).toBeVisible();
  });

  it("hides the Pay now button once the order is paid", () => {
    render(<OrderDetailPanel order={{ ...order, paymentStatus: "paid" }} />);
    expect(screen.queryByRole("button", { name: "Pay now" })).not.toBeInTheDocument();
  });

  it("hides the Pay now button for a cancelled order", () => {
    render(<OrderDetailPanel order={{ ...order, status: "cancelled" }} />);
    expect(screen.queryByRole("button", { name: "Pay now" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/OrderDetailPanel.test.tsx`
Expected: FAIL — `Failed to resolve import "./OrderDetailPanel"`.

- [ ] **Step 3: Implement `OrderDetailPanel`**

```tsx
// client/src/components/OrderDetailPanel.tsx
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { PayNowButton } from "@/components/PayNowButton";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { formatPrice } from "@/lib/catalog";
import type { Order } from "@/lib/orders";

export function OrderDetailPanel({ order }: { order: Order }) {
  const canPay =
    (order.paymentStatus === "unpaid" || order.paymentStatus === "failed") &&
    order.status !== "cancelled";

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <PaymentStatusBadge status={order.paymentStatus} />
        <OrderStatusBadge status={order.status} />
      </div>

      <dl className="mb-6 grid grid-cols-1 gap-4 text-sm">
        <div>
          <dt className="text-text-muted">Placed on</dt>
          <dd className="mt-1 font-medium text-cocoa">
            {new Date(order.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Fulfillment</dt>
          <dd className="mt-1 font-medium text-cocoa">
            {order.deliveryAddress
              ? `Delivery — ${order.deliveryAddress}`
              : "Pickup"}
          </dd>
        </div>
      </dl>

      <h3 className="mb-3 font-display text-lg text-cocoa">Items</h3>
      <ul className="flex flex-col gap-3 text-sm text-cocoa">
        {order.items.map((item) => (
          <li
            key={item.productId}
            className="flex justify-between gap-4 border-b border-border-warm/60 pb-3 last:border-0 last:pb-0"
          >
            <span>
              {item.name} × {item.quantity}
            </span>
            <span className="shrink-0 font-medium">
              {formatPrice(item.subtotal)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex justify-between border-t border-border-warm pt-4 font-display text-lg font-medium text-cocoa">
        <span>Total</span>
        <span>{formatPrice(order.totalAmount)}</span>
      </div>

      {canPay && (
        <div className="mt-6">
          <PayNowButton orderId={order.id} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/components/OrderDetailPanel.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Stage the changes**

```bash
git add client/src/components/OrderDetailPanel.tsx client/src/components/OrderDetailPanel.test.tsx
```

---

### Task 9: Shop Orders — wire the list page to the panel

**Files:**
- Modify: `client/src/app/(shop)/orders/page.tsx`
- Test: `client/src/app/(shop)/orders/page.test.tsx`

**Interfaces:**
- Consumes: `buildQuery` (Task 1), `DetailPanel`/`DetailPanelPlaceholder` (Task 1), `OrderDetailPanel` (Task 8), `getOrder`/`listOrders` from `@/lib/orders`, `createClient` from `@/lib/supabase/server`.

- [ ] **Step 1: Write the failing test**

```tsx
// client/src/app/(shop)/orders/page.test.tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Order, OrderSummary } from "@/lib/orders";
import OrdersPage from "./page";

const mocks = vi.hoisted(() => ({
  listOrders: vi.fn(),
  getOrder: vi.fn(),
  getUser: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("@/lib/orders", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/orders")>()),
  listOrders: mocks.listOrders,
  getOrder: mocks.getOrder,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser, getSession: mocks.getSession },
  })),
}));

vi.mock("@/app/actions/payments", () => ({ initiatePaymentAction: vi.fn() }));

const orderSummary: OrderSummary = {
  id: "order-1",
  status: "pending",
  paymentStatus: "unpaid",
  totalAmount: 1500,
  deliveryAddress: null,
  createdAt: "2026-08-01T10:00:00.000Z",
};

const orderDetail: Order = {
  ...orderSummary,
  items: [
    { productId: "p1", name: "Chocolate Cake", quantity: 1, unitPrice: 1500, subtotal: 1500 },
  ],
};

beforeEach(() => {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "customer-1" } } });
  mocks.getSession.mockResolvedValue({
    data: { session: { access_token: "token" } },
  });
  mocks.listOrders.mockResolvedValue([orderSummary]);
  mocks.getOrder.mockResolvedValue(orderDetail);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("OrdersPage", () => {
  it("shows a placeholder when no order is selected", async () => {
    render(await OrdersPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Select an order to see its details.")).toBeVisible();
  });

  it("shows the order's details in the panel when selected", async () => {
    render(
      await OrdersPage({ searchParams: Promise.resolve({ selected: "order-1" }) })
    );

    expect(mocks.getOrder).toHaveBeenCalledWith("token", "order-1");
    expect(screen.getByRole("heading", { name: "Order details" })).toBeVisible();
    expect(screen.getByText(/Chocolate Cake × 1/)).toBeVisible();
  });

  it("shows a not-found message for a stale selected id", async () => {
    mocks.getOrder.mockResolvedValue(null);
    render(
      await OrdersPage({ searchParams: Promise.resolve({ selected: "missing" }) })
    );
    expect(screen.getByText("This order could not be found.")).toBeVisible();
  });

  it("carries the selected id on row links", async () => {
    render(await OrdersPage({ searchParams: Promise.resolve({}) }));

    const rowLinks = screen.getAllByRole("link");
    const orderRow = rowLinks.find((link) =>
      link.getAttribute("href")?.includes("selected=order-1")
    );
    expect(orderRow).toHaveAttribute("href", "/orders?selected=order-1");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run "src/app/(shop)/orders/page.test.tsx"`
Expected: FAIL — `OrdersPage` doesn't accept `searchParams` yet and the placeholder/panel content don't exist.

- [ ] **Step 3: Replace the page implementation**

```tsx
// client/src/app/(shop)/orders/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderDetailPanel } from "@/components/OrderDetailPanel";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { DetailPanel, DetailPanelPlaceholder } from "@/components/ui/DetailPanel";
import { formatPrice } from "@/lib/catalog";
import { getOrder, listOrders } from "@/lib/orders";
import { buildQuery } from "@/lib/queryString";
import { createClient } from "@/lib/supabase/server";

const PANEL_CLASSNAME =
  "rounded-[1.5rem] border border-border-warm/80 bg-cream-alt p-6 shadow-[0_16px_40px_-28px_rgba(58,26,19,0.3)] sm:p-8";
const PLACEHOLDER_CLASSNAME =
  "hidden rounded-[1.5rem] border border-dashed border-border-warm/80 bg-cream-alt/50 p-6 text-center text-sm text-text-muted lg:block";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string }>;
}) {
  const { selected } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const orders = await listOrders(session!.access_token);
  const selectedOrder = selected
    ? await getOrder(session!.access_token, selected)
    : null;

  return (
    <section className="relative overflow-x-hidden">
      <div
        className="pointer-events-none absolute -left-16 top-16 h-64 w-64 rounded-full bg-honey/25 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <PageHeader
          eyebrow="Order history"
          title="Your orders"
          description="Track past and current orders from the bakery."
          action={{ href: "/products", label: "Browse the menu" }}
        />

        {orders.length === 0 ? (
          <div className="rounded-[1.5rem] border border-border-warm/80 bg-cream-alt px-6 py-14 text-center shadow-[0_16px_40px_-28px_rgba(58,26,19,0.3)]">
            <p className="font-display text-xl text-cocoa">No orders yet</p>
            <p className="mt-2 text-sm text-text-muted">
              When you place an order, it will show up here.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-caramel transition-colors hover:text-caramel-hover"
            >
              Browse the menu →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className={`min-w-0 flex-1 ${selected ? "hidden lg:block" : ""}`}>
              <div className="flex flex-col gap-4">
                {orders.map((order) => {
                  const isActive = order.id === selected;
                  const rowHref = `/orders${buildQuery({ selected: order.id })}`;
                  return (
                    <Link
                      key={order.id}
                      href={rowHref}
                      className={`flex items-center justify-between rounded-[1.35rem] border border-border-warm/80 bg-cream-alt p-5 shadow-[0_12px_32px_-24px_rgba(58,26,19,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(58,26,19,0.35)] sm:p-6 ${
                        isActive
                          ? "-translate-y-0.5 shadow-[0_20px_40px_-24px_rgba(58,26,19,0.35)]"
                          : ""
                      }`}
                    >
                      <div>
                        <p className="font-display text-lg font-medium text-cocoa">
                          Order placed{" "}
                          {new Date(order.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p className="mt-1 text-sm text-text-muted">
                          {order.deliveryAddress ? "Delivery" : "Pickup"} &middot;{" "}
                          {formatPrice(order.totalAmount)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <OrderStatusBadge status={order.status} />
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <aside className={`w-full shrink-0 lg:w-96 ${selected ? "" : "hidden lg:block"}`}>
              {selected ? (
                <DetailPanel
                  title="Order details"
                  closeHref="/orders"
                  className={PANEL_CLASSNAME}
                >
                  {selectedOrder ? (
                    <OrderDetailPanel order={selectedOrder} />
                  ) : (
                    <p className="text-sm text-text-muted">
                      This order could not be found.
                    </p>
                  )}
                </DetailPanel>
              ) : (
                <DetailPanelPlaceholder
                  message="Select an order to see its details."
                  className={PLACEHOLDER_CLASSNAME}
                />
              )}
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run "src/app/(shop)/orders/page.test.tsx"`
Expected: PASS (4 tests).

- [ ] **Step 5: Stage the changes**

```bash
git add "client/src/app/(shop)/orders/page.tsx" "client/src/app/(shop)/orders/page.test.tsx"
```

---

### Task 10: Full test run, type-check, and manual browser verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full client test suite**

Run: `npx vitest run`
Expected: PASS — all prior suites plus the new ones from Tasks 1–9, no regressions in existing shop-page tests (`products/page.test.tsx`, `products/[id]/page.test.tsx`, `cart/page.test.tsx`, `checkout/page.test.tsx`).

- [ ] **Step 2: Run the client build/type-check**

Run: `npm run build`
Expected: PASS — no TypeScript errors.

- [ ] **Step 3: Start both servers and manually verify each list**

Use this project's `run` skill (or `npm run dev` in `server/` and `client/` separately) to launch the app, then sign in as an admin and walk through:

- `/admin/orders`: click a row → panel shows that order's items/total/status form; change the status filter → panel closes; click × / "Back to list" → panel closes; resize below `lg` → only one pane shows at a time with a working back link.
- `/admin/products`: click a row → panel shows read-only details + an "Edit product" button that opens the existing edit page; confirm the edit page and `/admin/products/new` are unaffected.
- `/admin/customers`: click a row (not the role dropdown) → panel opens; confirm the role dropdown/button on the row still works independently of the panel.
- Sign in as a customer, visit `/orders`: click an order → panel shows items/total, and a working "Pay now" button when unpaid; confirm `/orders/[id]` (direct link) and the post-checkout redirect (`/orders/[id]?payment=success`) still work unchanged.
- Visit `/admin/orders?selected=<a-real-order-id>` directly (deep link) → panel is pre-opened on load.
- Visit `/admin/orders?selected=not-a-real-id` → panel shows "This order could not be found." and the list still renders normally.

No commit for this task — report the verification results to the user.
