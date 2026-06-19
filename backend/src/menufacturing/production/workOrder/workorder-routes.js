import { Router } from "express";
import {
  createWorkOrder,
  getAllWorkOrders,
  getWorkOrderById,
  updateWorkOrder,
  deleteWorkOrder,
} from "./workorder-controller.js";

const router = Router();

router.post("/create", createWorkOrder);
router.get("/", getAllWorkOrders);
router.get("/:id", getWorkOrderById);
router.put("/:id", updateWorkOrder);
router.delete("/:id", deleteWorkOrder);

export default router;
