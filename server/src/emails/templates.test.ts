import { describe, it, expect } from "vitest";
import {
  buildAdminLowStockEmail,
  buildAdminNewOrderEmail,
  buildOrderConfirmationEmail,
  buildOrderStatusChangeEmail,
  buildPaymentStatusChangeEmail,
} from "./templates.js";

const ORDER = {
  id: "11111111-2222-3333-4444-555555555555",
  items: [{ name: "Croissant", quantity: 2, unitPrice: 380, subtotal: 760 }],
  totalAmount: 760,
  deliveryAddress: "123 Galle Road",
};

describe("buildOrderConfirmationEmail", () => {
  it("includes the order id, items, and total", () => {
    const email = buildOrderConfirmationEmail(ORDER);
    expect(email.subject).toContain("11111111");
    expect(email.html).toContain("Croissant");
    expect(email.html).toContain("LKR 760");
    expect(email.text).toContain("Croissant");
    expect(email.text).toContain("LKR 760");
  });

  it("escapes html markup in delivery address", () => {
    const maliciousOrder = {
      ...ORDER,
      deliveryAddress: "<script>alert('xss')</script>",
    };
    const email = buildOrderConfirmationEmail(maliciousOrder);
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).not.toContain("<script>");
    expect(email.text).toContain("<script>");
  });

  it("escapes html markup in item names", () => {
    const maliciousOrder = {
      ...ORDER,
      items: [{ name: '<img src=x onerror="alert(1)">', quantity: 2, unitPrice: 380, subtotal: 760 }],
    };
    const email = buildOrderConfirmationEmail(maliciousOrder);
    expect(email.html).toContain("&lt;img");
    expect(email.html).not.toContain('<img src=x');
    expect(email.text).toContain('<img src=x');
  });
});

describe("buildOrderStatusChangeEmail", () => {
  it("mentions both the previous and new status", () => {
    const email = buildOrderStatusChangeEmail(ORDER, "pending", "processing");
    expect(email.subject).toContain("Processing");
    expect(email.html).toContain("Pending");
    expect(email.html).toContain("Processing");
  });
});

describe("buildPaymentStatusChangeEmail", () => {
  it("mentions both the previous and new payment status", () => {
    const email = buildPaymentStatusChangeEmail(ORDER, "unpaid", "paid");
    expect(email.subject.toLowerCase()).toContain("paid");
    expect(email.html).toContain("Unpaid");
    expect(email.html).toContain("Paid");
  });
});

describe("buildAdminNewOrderEmail", () => {
  it("includes the customer email and order details", () => {
    const email = buildAdminNewOrderEmail(ORDER, "customer@example.com");
    expect(email.html).toContain("customer@example.com");
    expect(email.html).toContain("Croissant");
  });

  it("escapes html markup in customer email", () => {
    const email = buildAdminNewOrderEmail(ORDER, "<img src=x onerror=alert(1)>");
    expect(email.html).toContain("&lt;img");
    expect(email.html).not.toContain("<img src=x");
    expect(email.text).toContain("<img src=x");
  });

  it("escapes html markup in delivery address", () => {
    const maliciousOrder = {
      ...ORDER,
      deliveryAddress: "<script>alert('xss')</script>",
    };
    const email = buildAdminNewOrderEmail(maliciousOrder, "customer@example.com");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).not.toContain("<script>");
    expect(email.text).toContain("<script>");
  });
});

describe("buildAdminLowStockEmail", () => {
  it("lists every product and its remaining stock", () => {
    const email = buildAdminLowStockEmail([
      { name: "Croissant", stockQuantity: 3 },
      { name: "Bagel", stockQuantity: 1 },
    ]);
    expect(email.subject).toContain("Croissant");
    expect(email.subject).toContain("Bagel");
    expect(email.html).toContain("3 left");
    expect(email.html).toContain("1 left");
  });

  it("uses singular phrasing for a single product", () => {
    const email = buildAdminLowStockEmail([{ name: "Croissant", stockQuantity: 3 }]);
    expect(email.html).toContain("has dropped");
  });

  it("escapes html markup in product names in html", () => {
    const email = buildAdminLowStockEmail([
      { name: "<script>alert('xss')</script>", stockQuantity: 3 },
    ]);
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).not.toContain("<script>");
    expect(email.text).toContain("<script>");
  });
});
