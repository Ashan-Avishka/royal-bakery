import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { listProfiles, setUserRole } from "../services/profileService.js";
import {
  customerIdParamSchema,
  updateRoleSchema,
} from "../validation/userSchemas.js";

export const adminRouter = Router();

adminRouter.get(
  "/admin/customers",
  requireAuth,
  requireRole("admin"),
  async (_req, res, next) => {
    try {
      const customers = await listProfiles();
      res.json({ customers });
    } catch (err) {
      next(err);
    }
  }
);

adminRouter.put(
  "/admin/customers/:id/role",
  requireAuth,
  requireRole("admin"),
  async (req, res, next) => {
    const paramsParsed = customerIdParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      res.status(400).json({
        error: {
          message: paramsParsed.error.issues[0]?.message ?? "Invalid customer id",
        },
      });
      return;
    }

    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: { message: parsed.error.issues[0]?.message ?? "Invalid request body" },
      });
      return;
    }

    if (paramsParsed.data.id === req.user!.id && parsed.data.role === "customer") {
      res.status(400).json({
        error: { message: "You cannot remove your own admin role." },
      });
      return;
    }

    try {
      const customer = await setUserRole(paramsParsed.data.id, parsed.data.role);
      res.json({ customer });
    } catch (err) {
      next(err);
    }
  }
);
