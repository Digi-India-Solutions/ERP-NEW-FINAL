import express from "express";
import {
  createShift,
  getAllShifts,
  updateShift,
  deleteShift
} from "./shifts-controller.js";
import { verifyToken } from "../../../middlewares/verifyToken.middleware.js";

const router = express.Router();

// Apply authentication middleware to all shift routes
router.use(verifyToken);

router.post("/create", createShift);
router.get("/", getAllShifts);
router.put("/:id", updateShift);
router.delete("/:id", deleteShift);

export default router;
