import { Router } from "express";
import {
  createBom,
  getAllBoms,
  getBomById,
  updateBom,
  deleteBom,
  duplicateBom
} from "../BOMcreate/bom-controller.js";
import { verifyToken } from "../../../../middlewares/verifyToken.middleware.js";

const router = Router();

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// BOM Routes
router.post("/", createBom);                    // Create BOM
router.get("/", getAllBoms);                    // Get all BOMs (company + warehouse wise)
router.get("/:id", getBomById);                 // Get single BOM
router.put("/:id", updateBom);                  // Update BOM
router.delete("/:id", deleteBom);               // Delete BOM
router.post("/:id/duplicate", duplicateBom);    // Duplicate BOM

export default router;