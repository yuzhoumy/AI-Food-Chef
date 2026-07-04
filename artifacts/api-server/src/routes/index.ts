import { Router, type IRouter } from "express";
import healthRouter from "./health";
import preferencesRouter from "./preferences";
import restaurantsRouter from "./restaurants";
import recommendationsRouter from "./recommendations";
import favoritesRouter from "./favorites";
import dashboardRouter from "./dashboard";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(preferencesRouter);
router.use(restaurantsRouter);
router.use(recommendationsRouter);
router.use(favoritesRouter);
router.use(dashboardRouter);
router.use(storageRouter);

export default router;
