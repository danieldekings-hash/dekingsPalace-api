import express from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { depositSchema, withdrawSchema } from "../validation/wallet.schema";
import * as controller from "../controllers/wallet.controller";

const router = express.Router();

router.get("/", authenticate, controller.getWallet);
router.get("/addresses", authenticate, controller.getAddresses);
router.post("/deposit", authenticate, validateBody(depositSchema), controller.deposit);
router.post("/withdraw", authenticate, validateBody(withdrawSchema), controller.withdraw);

export default router;
