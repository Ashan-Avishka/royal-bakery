import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { healthRouter } from "./health.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);

// Demo routes proving auth/RBAC wiring — replaced by real features later.
apiRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

apiRouter.get("/admin/ping", requireAuth, requireRole("admin"), (_req, res) => {
  res.json({ status: "admin ok" });
});
