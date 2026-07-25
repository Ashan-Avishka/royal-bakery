import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err);
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { message: err.message } });
    return;
  }
  res.status(500).json({ error: { message: "Internal server error" } });
}
