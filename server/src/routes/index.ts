import { Router } from "express";
import { adminRouter } from "./admin.js";
import { adminCatalogRouter } from "./adminCatalog.js";
import { adminOrdersRouter } from "./adminOrders.js";
import { cartRouter } from "./cart.js";
import { categoriesRouter } from "./categories.js";
import { healthRouter } from "./health.js";
import { ordersRouter } from "./orders.js";
import { paymentsRouter } from "./payments.js";
import { productsRouter } from "./products.js";
import { usersRouter } from "./users.js";

// Every router below scopes its own auth middleware to its own path prefix
// (or applies it per-route), so mount order here is not load-bearing --
// unlike earlier, when adminCatalogRouter's path-less router.use() would
// intercept any request reaching it regardless of a matching route of its
// own, making mount order silently load-bearing until that was fixed at
// the source (see adminCatalog.ts/cart.ts/orders.ts/adminOrders.ts).
export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(usersRouter);
apiRouter.use(adminRouter);
apiRouter.use(categoriesRouter);
apiRouter.use(productsRouter);
apiRouter.use(cartRouter);
apiRouter.use(ordersRouter);
apiRouter.use(paymentsRouter);
apiRouter.use(adminCatalogRouter);
apiRouter.use(adminOrdersRouter);
