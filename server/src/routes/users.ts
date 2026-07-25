import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getProfileById, updateProfile } from "../services/profileService.js";
import { updateProfileSchema } from "../validation/userSchemas.js";

export const usersRouter = Router();

usersRouter.get("/users/me", requireAuth, async (req, res, next) => {
  try {
    const profile = await getProfileById(req.user!.id);
    res.json({
      id: req.user!.id,
      email: req.user!.email ?? null,
      fullName: profile?.fullName ?? null,
      phone: profile?.phone ?? null,
      address: profile?.address ?? null,
      role: req.user!.role,
    });
  } catch (err) {
    next(err);
  }
});

usersRouter.put("/users/me", requireAuth, async (req, res, next) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: { message: parsed.error.issues[0]?.message ?? "Invalid request body" },
    });
    return;
  }

  try {
    const profile = await updateProfile(req.user!.id, parsed.data);
    res.json({
      id: req.user!.id,
      email: req.user!.email ?? null,
      fullName: profile.fullName,
      phone: profile.phone,
      address: profile.address,
      role: req.user!.role,
    });
  } catch (err) {
    next(err);
  }
});
