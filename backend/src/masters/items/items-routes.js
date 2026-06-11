import express from 'express';
import { verifyToken } from '../../../middlewares/verifyToken.middleware.js';
import {
  createItem,
  updateItem,
  deleteItem,
  getAllItems,
  getItemById,
  filterItems,
} from './items-controller.js';

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Routes
router.post('/', createItem);
router.get('/', getAllItems);
router.get('/filter', filterItems);
router.get('/:id', getItemById);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;
