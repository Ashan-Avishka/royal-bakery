import { z } from "zod";

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(1).max(200).optional(),
    phone: z.string().trim().min(1).max(50).optional(),
    address: z.string().trim().min(1).max(500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field (fullName, phone, address) is required",
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateRoleSchema = z.object({
  role: z.enum(["customer", "admin"]),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const customerIdParamSchema = z.object({
  id: z.string().uuid(),
});
