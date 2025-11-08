import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { createPlanSchema, updatePlanSchema } from "../validation/plan.schema";
import * as controller from "../controllers/plan.controller";

const router = express.Router();

// Public list and get
router.get("/", controller.list);
router.get("/:id", controller.get);

// Admin-only management
router.post("/", authenticate, authorize("admin"), validateBody(createPlanSchema), controller.create);
router.put("/:id", authenticate, authorize("admin"), validateBody(updatePlanSchema), controller.update);
router.delete("/:id", authenticate, authorize("admin"), controller.remove);

export default router;


