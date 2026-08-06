import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { getAnalyticsSummary } from "../services/analyticsService.js";
import { analyticsQuerySchema } from "../validation/analyticsSchemas.js";

export const adminAnalyticsRouter = Router();

adminAnalyticsRouter.get(
  "/admin/analytics",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    const parsed = analyticsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          message: parsed.error.issues[0]?.message ?? "Invalid query parameters",
        },
      });
      return;
    }

    try {
      const analytics = await getAnalyticsSummary(parsed.data);
      res.json({ analytics });
    } catch (err) {
      next(err);
    }
  }
);
