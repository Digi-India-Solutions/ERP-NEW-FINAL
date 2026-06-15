import { Router } from 'express';
import {
  createBom,
  getAllBoms,
  getBomById,
  updateBom,
  deleteBom,
  duplicateBom,
  linkToItemMaster, // ✅ ADD THIS
} from '../BOMcreate/bom-controller.js';
import { verifyToken } from '../../../../middlewares/verifyToken.middleware.js';

const router = Router();

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// BOM Routes
router.post('/', createBom); // Create BOM
router.get('/', getAllBoms); // Get all BOMs
router.get('/:id', getBomById); // Get single BOM
router.put('/:id', updateBom); // Update BOM
router.delete('/:id', deleteBom); // Delete BOM
router.post('/:id/duplicate', duplicateBom); // Duplicate BOM
router.post('/:id/link', linkToItemMaster); // ✅ Link to Item Master

export default router;
