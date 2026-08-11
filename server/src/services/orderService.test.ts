import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(),
}));

const notificationMocks = vi.hoisted(() => ({
  sendOrderConfirmationEmail: vi.fn(),
  sendAdminNewOrderEmail: vi.fn(),
  sendAdminLowStockEmail: vi.fn(),
}));
vi.mock("./notificationService.js", () => notificationMocks);

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
const CUSTOMER_EMAIL = "customer@example.com";

afterEach(() => {
  vi.clearAllMocks();
});

function seed(
  rpc: Record<string, (params: Record<string, unknown>) => any> = {},
  options: { stockQuantity?: number } = {}
) {
  return createFakeSupabaseClient({
    usersByToken: {
      "customer-token": {
        id: USER_ID,
        email: CUSTOMER_EMAIL,
        app_metadata: { role: "customer" },
      },
    },
    profiles: [],
    products: [
      {
        id: PRODUCT_A,
        category_id: null,
        name: "Croissant",
        description: null,
        price: "380.00",
        image_url: null,
        stock_quantity: options.stockQuantity ?? 20,
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
      {
        id: "oi1",
        order_id: ORDER_A,
        product_id: PRODUCT_A,
        quantity: 2,
        unit_price: "380.00",
        subtotal: "760.00",
      },
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

  it("sends order confirmation and admin new-order emails after creating an order", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      seed({
        create_order_from_cart: () => ({ data: ORDER_A, error: null }),
      }) as any
    );

    const order = await createOrderFromCart(USER_ID, "123 Galle Road");

    expect(notificationMocks.sendOrderConfirmationEmail).toHaveBeenCalledWith(order, CUSTOMER_EMAIL);
    expect(notificationMocks.sendAdminNewOrderEmail).toHaveBeenCalledWith(order, CUSTOMER_EMAIL);
  });

  it("does not throw when the user has no email on record", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      createFakeSupabaseClient({
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
            created_at: "t",
            updated_at: "t",
          },
        ],
        orderItems: [
          {
            id: "oi1",
            order_id: ORDER_A,
            product_id: PRODUCT_A,
            quantity: 2,
            unit_price: "380.00",
            subtotal: "760.00",
          },
        ],
        rpc: { create_order_from_cart: () => ({ data: ORDER_A, error: null }) },
      }) as any
    );

    const order = await createOrderFromCart(USER_ID);
    expect(order.id).toBe(ORDER_A);
    expect(notificationMocks.sendOrderConfirmationEmail).not.toHaveBeenCalled();
  });

  it("sends a low-stock alert when an order pushes a product's stock at or below the threshold", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      seed(
        { create_order_from_cart: () => ({ data: ORDER_A, error: null }) },
        { stockQuantity: 4 }
      ) as any
    );

    await createOrderFromCart(USER_ID, "123 Galle Road");

    expect(notificationMocks.sendAdminLowStockEmail).toHaveBeenCalledWith([
      { name: "Croissant", stockQuantity: 4 },
    ]);
  });

  it("does not send a low-stock alert when the product was already low before this order", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      seed(
        { create_order_from_cart: () => ({ data: ORDER_A, error: null }) },
        { stockQuantity: 2 }
      ) as any
    );

    await createOrderFromCart(USER_ID, "123 Galle Road");

    expect(notificationMocks.sendAdminLowStockEmail).not.toHaveBeenCalled();
  });

  it("does not send a low-stock alert when stock stays above the threshold", async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(
      seed(
        { create_order_from_cart: () => ({ data: ORDER_A, error: null }) },
        { stockQuantity: 10 }
      ) as any
    );

    await createOrderFromCart(USER_ID, "123 Galle Road");

    expect(notificationMocks.sendAdminLowStockEmail).not.toHaveBeenCalled();
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
