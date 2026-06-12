import express from "express";
import {
  createDowntimeCode,
  getAllDowntimeCodes,
  updateDowntimeCode,
  deleteDowntimeCode
} from "./downtimecode-controller.js";
import { verifyToken } from "../../../middlewares/verifyToken.middleware.js";

const router = express.Router();

// Apply authentication middleware to all downtime code routes
router.use(verifyToken);

router.post("/create", createDowntimeCode);
router.get("/", getAllDowntimeCodes);
router.put("/:id", updateDowntimeCode);
router.delete("/:id", deleteDowntimeCode);

export default router;
