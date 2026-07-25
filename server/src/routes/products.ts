import { Router } from "express";
import { AppError } from "../errors.js";
import { getProductById, listProducts } from "../services/catalogService.js";
import { idParamSchema, productListQuerySchema } from "../validation/catalogSchemas.js";

export const productsRouter = Router();

productsRouter.get("/products", async (req, res, next) => {
  const parsed = productListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: { message: parsed.error.issues[0]?.message ?? "Invalid query parameters" },
    });
    return;
  }

  try {
    const products = await listProducts({
      categoryId: parsed.data.categoryId,
      search: parsed.data.search,
      availableOnly: true,
    });
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

productsRouter.get("/products/:id", async (req, res, next) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: { message: "Invalid product id" } });
    return;
  }

  try {
    const product = await getProductById(parsed.data.id);
    if (!product || !product.isAvailable) {
      next(new AppError(404, "Product not found"));
      return;
    }
    res.json({ product });
  } catch (err) {
    next(err);
  }
});
