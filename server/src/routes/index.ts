import { Router } from "express";
import { adminRouter } from "./admin.js";
import { adminCatalogRouter } from "./adminCatalog.js";
import { adminOrdersRouter } from "./adminOrders.js";
import { cartRouter } from "./cart.js";
import { categoriesRouter } from "./categories.js";
import { healthRouter } from "./health.js";
import { ordersRouter } from "./orders.js";
import { productsRouter } from "./products.js";
import { usersRouter } from "./users.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(usersRouter);
apiRouter.use(adminRouter);
apiRouter.use(categoriesRouter);
apiRouter.use(productsRouter);
// cartRouter/ordersRouter must be mounted before adminCatalogRouter:
// adminCatalogRouter applies requireAuth/requireRole via a path-less
// router.use(), which intercepts every request that reaches it -- including
// ones meant for a later-mounted router -- regardless of whether it has a
// matching route of its own. Mounting the self-service routers first means
// their own matching routes handle the request before it ever reaches that
// blanket admin gate.
apiRouter.use(cartRouter);
apiRouter.use(ordersRouter);
apiRouter.use(adminCatalogRouter);
apiRouter.use(adminOrdersRouter);
