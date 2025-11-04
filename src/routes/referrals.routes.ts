import express from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as controller from "../controllers/referral.controller";

const router = express.Router();

router.get("/", authenticate, controller.getInfo);
router.get("/list", authenticate, controller.list);
router.get("/earnings", authenticate, controller.earnings);

export default router;


