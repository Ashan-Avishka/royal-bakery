import { Router, type Response } from "express";
import multer from "multer";
import type { ZodError } from "zod";
import { AppError } from "../errors.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getProductById,
  listCategories,
  listProducts,
  setProductImage,
  clearProductImage,
  updateCategory,
  updateProduct,
} from "../services/catalogService.js";
import { deleteProductImage, uploadProductImage } from "../services/uploadService.js";
import {
  createCategorySchema,
  createProductSchema,
  idParamSchema,
  productListQuerySchema,
  updateCategorySchema,
  updateProductSchema,
} from "../validation/catalogSchemas.js";

export const adminCatalogRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new AppError(400, "Only image uploads are allowed"));
      return;
    }
    cb(null, true);
  },
});

function respondValidationError(res: Response, error: ZodError) {
  res.status(400).json({ error: { message: error.issues[0]?.message ?? "Invalid request" } });
}

// Path-scoped for the same reason as cartRouter/ordersRouter/adminOrdersRouter
// -- this was the original unscoped router.use() that caused that whole
// class of mount-order bugs in the first place (Module 3's adminOrdersRouter
// and this module's paymentsRouter both had to work around it via mount
// order before this was fixed at the source).
adminCatalogRouter.use(["/admin/categories", "/admin/products"], requireAuth, requireRole("admin"));

// ---- Categories ----

adminCatalogRouter.get("/admin/categories", async (_req, res, next) => {
  try {
    res.json({ categories: await listCategories({ activeOnly: false }) });
  } catch (err) {
    next(err);
  }
});

adminCatalogRouter.post("/admin/categories", async (req, res, next) => {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) return respondValidationError(res, parsed.error);

  try {
    const category = await createCategory(parsed.data);
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
});

adminCatalogRouter.put("/admin/categories/:id", async (req, res, next) => {
  const paramsParsed = idParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: { message: "Invalid category id" } });
    return;
  }
  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) return respondValidationError(res, parsed.error);

  try {
    const category = await updateCategory(paramsParsed.data.id, parsed.data);
    res.json({ category });
  } catch (err) {
    next(err);
  }
});

adminCatalogRouter.delete("/admin/categories/:id", async (req, res, next) => {
  const paramsParsed = idParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: { message: "Invalid category id" } });
    return;
  }

  try {
    await deleteCategory(paramsParsed.data.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ---- Products ----

adminCatalogRouter.get("/admin/products", async (req, res, next) => {
  const parsed = productListQuerySchema.safeParse(req.query);
  if (!parsed.success) return respondValidationError(res, parsed.error);

  try {
    const products = await listProducts({
      categoryId: parsed.data.categoryId,
      search: parsed.data.search,
      availableOnly: false,
    });
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

adminCatalogRouter.post("/admin/products", async (req, res, next) => {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) return respondValidationError(res, parsed.error);

  try {
    const product = await createProduct(parsed.data);
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
});

adminCatalogRouter.put("/admin/products/:id", async (req, res, next) => {
  const paramsParsed = idParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: { message: "Invalid product id" } });
    return;
  }
  const parsed = updateProductSchema.safeParse(req.body);
  if (!parsed.success) return respondValidationError(res, parsed.error);

  try {
    const product = await updateProduct(paramsParsed.data.id, parsed.data);
    res.json({ product });
  } catch (err) {
    next(err);
  }
});

adminCatalogRouter.delete("/admin/products/:id", async (req, res, next) => {
  const paramsParsed = idParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: { message: "Invalid product id" } });
    return;
  }

  try {
    await deleteProduct(paramsParsed.data.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

adminCatalogRouter.post(
  "/admin/products/:id/image",
  upload.single("image"),
  async (req, res, next) => {
    const paramsParsed = idParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      res.status(400).json({ error: { message: "Invalid product id" } });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: { message: "Missing image file" } });
      return;
    }

    try {
      const existing = await getProductById(paramsParsed.data.id);
      if (!existing) {
        next(new AppError(404, "Product not found"));
        return;
      }
      const imageUrl = await uploadProductImage(
        paramsParsed.data.id,
        {
          buffer: req.file.buffer,
          mimetype: req.file.mimetype,
          originalname: req.file.originalname,
        },
        existing.imageUrl
      );
      const product = await setProductImage(paramsParsed.data.id, imageUrl);
      res.json({ product });
    } catch (err) {
      next(err);
    }
  }
);

adminCatalogRouter.delete(
  "/admin/products/:id/image",
  async (req, res, next) => {
    const paramsParsed = idParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      res.status(400).json({ error: { message: "Invalid product id" } });
      return;
    }

    try {
      const existing = await getProductById(paramsParsed.data.id);
      if (!existing) {
        next(new AppError(404, "Product not found"));
        return;
      }
      if (!existing.imageUrl) {
        next(new AppError(400, "Product has no image to remove"));
        return;
      }
      await deleteProductImage(existing.imageUrl);
      const product = await clearProductImage(paramsParsed.data.id);
      res.json({ product });
    } catch (err) {
      next(err);
    }
  }
);
