const express = require('express');
const {
  convertQuotationToSalesOrder,
  confirmSalesOrder,
  dispatchSalesOrder,
  getSalesOrders,
  getSalesOrderById,
} = require('../controllers/salesOrderController');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getSalesOrders);
router.get('/:id', getSalesOrderById);
router.post('/:id/confirm', requireRole('ADMIN'), confirmSalesOrder);
router.post('/:id/dispatch', requireRole('ADMIN'), dispatchSalesOrder);

module.exports = router;
