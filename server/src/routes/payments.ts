import express, { Router } from "express";
import { AppError } from "../errors.js";
import { requireAuth } from "../middleware/auth.js";
import { initiatePayment, processPaymentNotification } from "../services/paymentService.js";
import { initiatePaymentSchema } from "../validation/paymentSchemas.js";

export const paymentsRouter = Router();

paymentsRouter.post("/payments/initiate", requireAuth, async (req, res, next) => {
  const parsed = initiatePaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: { message: parsed.error.issues[0]?.message ?? "Invalid request" },
    });
    return;
  }
  if (!req.user!.email) {
    next(new AppError(400, "Account email is required to make a payment"));
    return;
  }

  try {
    const payment = await initiatePayment({
      userId: req.user!.id,
      email: req.user!.email,
      orderId: parsed.data.orderId,
    });
    res.json({ payment });
  } catch (err) {
    next(err);
  }
});

paymentsRouter.post(
  "/payments/webhook",
  express.urlencoded({ extended: true }),
  async (req, res, next) => {
    try {
      await processPaymentNotification(req.body);
      res.status(200).send("OK");
    } catch (err) {
      next(err);
    }
  }
);
