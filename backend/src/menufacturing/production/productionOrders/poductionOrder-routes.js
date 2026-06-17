import { Router } from 'express';
import {
  createProductionOrder,
  getAllProductionOrders,
 getProductionOrderById,
  updateProductionOrder,
  deleteProductionOrder,
  updateProductionOrderStatus,
    getProductionOrderReservations,
} from './productionOrder-controller.js';
import { verifyToken } from '../../../../middlewares/verifyToken.middleware.js';

const router = Router();

router.use(verifyToken);

// CRUD
router.post('/', createProductionOrder);
router.get('/', getAllProductionOrders);
router.get('/:id', getProductionOrderById);
router.put('/:id', updateProductionOrder);
router.delete('/:id', deleteProductionOrder);

// Additional Operations
router.patch('/:id/status', updateProductionOrderStatus);

//Reservations
router.get('/:id/reservations', getProductionOrderReservations);

export default router;