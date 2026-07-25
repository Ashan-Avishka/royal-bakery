import { Router } from "express";
import { listCategories } from "../services/catalogService.js";

export const categoriesRouter = Router();

categoriesRouter.get("/categories", async (_req, res, next) => {
  try {
    const categories = await listCategories({ activeOnly: true });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});
