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
