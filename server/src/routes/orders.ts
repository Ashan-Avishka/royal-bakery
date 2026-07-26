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
