import { Router } from "express";
import { adminRouter } from "./admin.js";
import { healthRouter } from "./health.js";
import { usersRouter } from "./users.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(usersRouter);
apiRouter.use(adminRouter);
