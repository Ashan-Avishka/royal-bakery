import { z } from "zod";

// A permissive UUID-shape check (8-4-4-4-12 hex) rather than zod's strict
// `.uuid()` (which enforces RFC 4122 version/variant nibbles) — this project's
// test fixtures use plain hex-repeated ids (e.g. "11111111-1111-1111-1111-111111111111")
// that aren't RFC 4122-compliant but are still valid Postgres `uuid` values.
const uuidPattern =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
export const uuidSchema = z.string().regex(uuidPattern, "Invalid uuid");

export const idParamSchema = z.object({
  id: uuidSchema,
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(1000).optional(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().min(1).max(1000).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field (name, description, isActive) is required",
  });
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000).optional(),
  price: z.number().min(0),
  categoryId: uuidSchema.nullable().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(2000).optional(),
    price: z.number().min(0).optional(),
    categoryId: uuidSchema.nullable().optional(),
    stockQuantity: z.number().int().min(0).optional(),
    isAvailable: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const productListQuerySchema = z.object({
  categoryId: uuidSchema.optional(),
  search: z.string().trim().min(1).max(200).optional(),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
