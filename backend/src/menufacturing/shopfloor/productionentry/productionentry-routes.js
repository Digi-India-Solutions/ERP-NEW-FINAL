import { Router } from "express";
import {
  createProductionEntry,
  getAllProductionEntries,
  getProductionEntryById,
  updateProductionEntry,
  deleteProductionEntry,
  approveProductionEntry,
} from "./productionentry-contoller.js";

const router = Router();

router.post("/create", createProductionEntry);
router.get("/", getAllProductionEntries);
router.get("/:id", getProductionEntryById);
router.put("/:id", updateProductionEntry);
router.delete("/:id", deleteProductionEntry);
router.patch("/:id/approve", approveProductionEntry);

export default router;
