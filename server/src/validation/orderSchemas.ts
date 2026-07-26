import { z } from "zod";

export const orderStatuses = ["pending", "processing", "completed", "cancelled"] as const;

export const createOrderSchema = z.object({
  deliveryAddress: z.string().trim().min(1).max(500).optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatuses),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const orderStatusQuerySchema = z.object({
  status: z.enum(orderStatuses).optional(),
});
export type OrderStatusQuery = z.infer<typeof orderStatusQuerySchema>;
