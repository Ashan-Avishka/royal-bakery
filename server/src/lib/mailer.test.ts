import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to define mocks outside of vi.mock
const { sendMailMock, createTransportMock } = vi.hoisted(() => {
  const sendMailMock = vi.fn();
  const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock }));
  return { sendMailMock, createTransportMock };
});

vi.mock("nodemailer", () => ({
  default: { createTransport: createTransportMock },
}));
vi.mock("../config/env.js", () => ({
  env: {
    SMTP_HOST: "smtp.test.example",
    SMTP_PORT: 587,
    SMTP_USER: "user@test.example",
    SMTP_PASS: "secret",
    SMTP_FROM_EMAIL: "",
  },
}));

import { sendMail } from "./mailer.js";

beforeEach(() => {
  sendMailMock.mockReset();
});

describe("sendMail", () => {
  it("sends via the transporter, falling back to SMTP_USER as the from address", async () => {
    sendMailMock.mockResolvedValue({});

    await sendMail({ to: "customer@example.com", subject: "Hi", html: "<p>hi</p>", text: "hi" });

    expect(sendMailMock).toHaveBeenCalledWith({
      from: "user@test.example",
      to: "customer@example.com",
      subject: "Hi",
      html: "<p>hi</p>",
      text: "hi",
    });
  });

  it("never throws when the transporter rejects", async () => {
    sendMailMock.mockRejectedValue(new Error("SMTP connection refused"));

    await expect(
      sendMail({ to: "customer@example.com", subject: "Hi", html: "<p>hi</p>", text: "hi" })
    ).resolves.toBeUndefined();
  });
});
