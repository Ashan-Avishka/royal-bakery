import { z } from "zod";
import { uuidSchema } from "./catalogSchemas.js";

export const initiatePaymentSchema = z.object({
  orderId: uuidSchema,
});
export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
