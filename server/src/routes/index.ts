import { Router } from "express";
import { adminRouter } from "./admin.js";
import { adminCatalogRouter } from "./adminCatalog.js";
import { categoriesRouter } from "./categories.js";
import { healthRouter } from "./health.js";
import { productsRouter } from "./products.js";
import { usersRouter } from "./users.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(usersRouter);
apiRouter.use(adminRouter);
apiRouter.use(categoriesRouter);
apiRouter.use(productsRouter);
apiRouter.use(adminCatalogRouter);
