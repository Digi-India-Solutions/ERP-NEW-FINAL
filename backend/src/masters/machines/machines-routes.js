import express from "express";
import {
  createMachine,
  getAllMachines,
  updateMachine,
  deleteMachine
} from "./machines.controller.js";
import { verifyToken } from "../../../middlewares/verifyToken.middleware.js";

const router = express.Router();

// Apply authentication middleware to all machine routes
router.use(verifyToken);

router.post("/create", createMachine);
router.get("/", getAllMachines);
router.put("/:id", updateMachine);
router.delete("/:id", deleteMachine);

export default router;
