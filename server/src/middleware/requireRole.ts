import type { NextFunction, Request, Response } from "express";

/** RBAC guard — use after requireAuth: router.get(..., requireAuth, requireRole("admin"), handler) */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: { message: "Not authenticated" } });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ error: { message: "Insufficient permissions" } });
      return;
    }
    next();
  };
}
