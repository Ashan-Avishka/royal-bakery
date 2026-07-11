import type { NextFunction, Request, Response } from "express";
import { getSupabaseAdmin } from "../lib/supabase.js";

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
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: { message: "Invalid or expired token" } });
      return;
    }
    req.user = {
      id: data.user.id,
      email: data.user.email ?? undefined,
      role: (data.user.app_metadata?.role as string | undefined) ?? "customer",
    };
    next();
  } catch (err) {
    next(err);
  }
}
