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
