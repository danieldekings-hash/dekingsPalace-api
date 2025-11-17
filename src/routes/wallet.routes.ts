import express from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { depositSchema, withdrawSchema } from "../validation/wallet.schema";
import * as controller from "../controllers/wallet.controller";

const router = express.Router();

router.get("/", authenticate, controller.getWallet);
router.get("/addresses", authenticate, controller.getAddresses);
router.get("/tracking/deposits", authenticate, controller.getTrackedDepositsSummary);
router.get("/tracking/deposits/public", controller.getPublicTrackedDepositsSummary);
router.post("/deposit", authenticate, validateBody(depositSchema), controller.deposit);
router.post("/withdraw", authenticate, validateBody(withdrawSchema), controller.withdraw);

export default router;
