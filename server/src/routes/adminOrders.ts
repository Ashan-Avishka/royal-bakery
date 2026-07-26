import { Router } from "express";
import { AppError } from "../errors.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { getOrderById, listAllOrders, updateOrderStatus } from "../services/orderService.js";
import { idParamSchema } from "../validation/catalogSchemas.js";
import { orderStatusQuerySchema, updateOrderStatusSchema } from "../validation/orderSchemas.js";

export const adminOrdersRouter = Router();

adminOrdersRouter.use("/admin/orders", requireAuth, requireRole("admin"));

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
