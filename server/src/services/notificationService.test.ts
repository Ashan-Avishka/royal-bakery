import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mailMocks = vi.hoisted(() => ({
  sendMailMock: vi.fn(),
}));
vi.mock("../lib/mailer.js", () => ({ sendMail: mailMocks.sendMailMock }));

const envMock = vi.hoisted(() => ({
  env: { ADMIN_NOTIFICATION_EMAIL: "admin@royalbakery.lk" },
}));
vi.mock("../config/env.js", () => envMock);

import * as templates from "../emails/templates.js";
import {
  sendAdminLowStockEmail,
  sendAdminNewOrderEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusChangeEmail,
  sendPaymentStatusChangeEmail,
} from "./notificationService.js";

const ORDER = {
  id: "11111111-2222-3333-4444-555555555555",
  items: [{ name: "Croissant", quantity: 2, unitPrice: 380, subtotal: 760 }],
  totalAmount: 760,
  deliveryAddress: "123 Galle Road",
};

beforeEach(() => {
  mailMocks.sendMailMock.mockReset();
  envMock.env.ADMIN_NOTIFICATION_EMAIL = "admin@royalbakery.lk";
});

describe("sendOrderConfirmationEmail", () => {
  it("emails the customer", async () => {
    await sendOrderConfirmationEmail(ORDER, "customer@example.com");
    expect(mailMocks.sendMailMock).toHaveBeenCalledTimes(1);
    expect(mailMocks.sendMailMock.mock.calls[0][0].to).toBe("customer@example.com");
  });
});

describe("sendOrderStatusChangeEmail", () => {
  it("emails the customer with the status change", async () => {
    await sendOrderStatusChangeEmail(ORDER, "customer@example.com", "pending", "processing");
    expect(mailMocks.sendMailMock.mock.calls[0][0].to).toBe("customer@example.com");
    expect(mailMocks.sendMailMock.mock.calls[0][0].html).toContain("Processing");
  });
});

describe("sendPaymentStatusChangeEmail", () => {
  it("emails the customer with the payment status change", async () => {
    await sendPaymentStatusChangeEmail(ORDER, "customer@example.com", "unpaid", "paid");
    expect(mailMocks.sendMailMock.mock.calls[0][0].to).toBe("customer@example.com");
  });
});

describe("sendAdminNewOrderEmail", () => {
  it("emails the configured admin address", async () => {
    await sendAdminNewOrderEmail(ORDER, "customer@example.com");
    expect(mailMocks.sendMailMock.mock.calls[0][0].to).toBe("admin@royalbakery.lk");
  });

  it("skips sending when no admin address is configured", async () => {
    envMock.env.ADMIN_NOTIFICATION_EMAIL = "";
    await sendAdminNewOrderEmail(ORDER, "customer@example.com");
    expect(mailMocks.sendMailMock).not.toHaveBeenCalled();
  });
});

describe("sendAdminLowStockEmail", () => {
  it("emails the configured admin address", async () => {
    await sendAdminLowStockEmail([{ name: "Croissant", stockQuantity: 3 }]);
    expect(mailMocks.sendMailMock.mock.calls[0][0].to).toBe("admin@royalbakery.lk");
  });

  it("does nothing for an empty product list", async () => {
    await sendAdminLowStockEmail([]);
    expect(mailMocks.sendMailMock).not.toHaveBeenCalled();
  });

  it("skips sending when no admin address is configured", async () => {
    envMock.env.ADMIN_NOTIFICATION_EMAIL = "";
    await sendAdminLowStockEmail([{ name: "Croissant", stockQuantity: 3 }]);
    expect(mailMocks.sendMailMock).not.toHaveBeenCalled();
  });
});

describe("notification failures never propagate (rejections are swallowed)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sendOrderConfirmationEmail resolves even if the template builder throws", async () => {
    vi.spyOn(templates, "buildOrderConfirmationEmail").mockImplementation(() => {
      throw new Error("boom");
    });
    await expect(sendOrderConfirmationEmail(ORDER, "customer@example.com")).resolves.toBeUndefined();
    expect(mailMocks.sendMailMock).not.toHaveBeenCalled();
  });

  it("sendOrderStatusChangeEmail resolves even if the template builder throws", async () => {
    vi.spyOn(templates, "buildOrderStatusChangeEmail").mockImplementation(() => {
      throw new Error("boom");
    });
    await expect(
      sendOrderStatusChangeEmail(ORDER, "customer@example.com", "pending", "processing")
    ).resolves.toBeUndefined();
    expect(mailMocks.sendMailMock).not.toHaveBeenCalled();
  });

  it("sendPaymentStatusChangeEmail resolves even if the template builder throws", async () => {
    vi.spyOn(templates, "buildPaymentStatusChangeEmail").mockImplementation(() => {
      throw new Error("boom");
    });
    await expect(
      sendPaymentStatusChangeEmail(ORDER, "customer@example.com", "unpaid", "paid")
    ).resolves.toBeUndefined();
    expect(mailMocks.sendMailMock).not.toHaveBeenCalled();
  });

  it("sendAdminNewOrderEmail resolves even if the template builder throws", async () => {
    vi.spyOn(templates, "buildAdminNewOrderEmail").mockImplementation(() => {
      throw new Error("boom");
    });
    await expect(
      sendAdminNewOrderEmail(ORDER, "customer@example.com")
    ).resolves.toBeUndefined();
    expect(mailMocks.sendMailMock).not.toHaveBeenCalled();
  });

  it("sendAdminLowStockEmail resolves even if the template builder throws", async () => {
    vi.spyOn(templates, "buildAdminLowStockEmail").mockImplementation(() => {
      throw new Error("boom");
    });
    await expect(
      sendAdminLowStockEmail([{ name: "Croissant", stockQuantity: 3 }])
    ).resolves.toBeUndefined();
    expect(mailMocks.sendMailMock).not.toHaveBeenCalled();
  });
});
