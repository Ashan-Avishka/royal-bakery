import type { NextFunction, Request, Response } from "express";
import { verifySupabaseToken } from "../lib/jwt.js";

export interface AuthUser {
  id: string;
  email?: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Verifies the Supabase JWT from the Authorization header and sets req.user. */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: { message: "Missing bearer token" } });
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = await verifySupabaseToken(token);
    if (!payload.sub) {
      res.status(401).json({ error: { message: "Invalid or expired token" } });
      return;
    }
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.app_metadata?.role ?? "customer",
    };
    next();
  } catch {
    res.status(401).json({ error: { message: "Invalid or expired token" } });
  }
}
